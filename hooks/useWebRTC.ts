"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import io, { Socket } from "socket.io-client"
import { useAuthStore, Profile } from "@/stores/use-auth-store"

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

// Define a type for the partner's profile, which can be null
type PartnerProfile = Omit<Profile, "id"> | null

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

export function useWebRTC(
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) {
  const { profile } = useAuthStore()
  const [socket, setSocket] = useState<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [hasCamera, setHasCamera] = useState(true)
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt")
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])

  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState("")
  const [selectedMicrophone, setSelectedMicrophone] = useState("")
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);


  // 1. Initialize Socket.IO connection
  useEffect(() => {
    const newSocket = io()
    setSocket(newSocket)
    return () => {
      newSocket.disconnect()
    }
  }, [])

  // 2. Get available media devices
  useEffect(() => {
    const getDevices = async () => {
      try {
        // We need to ask for permission first.
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        stream.getTracks().forEach(track => track.stop()); // Stop tracks, we only needed permission
        setCameraPermission("granted")

        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === "videoinput")
        const audioDevices = devices.filter((d) => d.kind === "audioinput")

        setHasCamera(videoDevices.length > 0)
        if (videoDevices.length === 0) return;

        setAvailableCameras(videoDevices)
        setAvailableMicrophones(audioDevices)
        if (videoDevices.length > 0) {
            setSelectedCamera(videoDevices[0].deviceId)
            setCurrentCameraIndex(0)
        }
        if (audioDevices.length > 0) setSelectedMicrophone(audioDevices[0].deviceId)
      } catch (error) {
        console.error("Failed to get media devices:", error)
        if (error instanceof DOMException && error.name === "NotAllowedError") {
            setCameraPermission("denied")
        }
        setHasCamera(false)
      }
    }
    getDevices()
  }, [])

  // 3. Set up local media stream when a device is selected
  useEffect(() => {
    const getMediaStream = async () => {
      if (selectedCamera && selectedMicrophone) {
        // Stop previous tracks
        localStreamRef.current?.getTracks().forEach((track) => track.stop())
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCamera } },
            audio: { deviceId: { exact: selectedMicrophone } },
          })
          localStreamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
            // Required for iOS Safari to play video inline
            localVideoRef.current.setAttribute('playsinline', 'true');
          }
           // If a peer connection exists, replace the track
          if (peerConnectionRef.current) {
            const videoTrack = stream.getVideoTracks()[0];
            const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
            if (sender) {
              sender.replaceTrack(videoTrack);
            }
          }
        } catch (error) {
          console.error("Failed to get media stream:", error)
        }
      }
    }
    getMediaStream()
  }, [selectedCamera, selectedMicrophone, localVideoRef])

  const createPeerConnection = useCallback((partnerId: string) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit("ice-candidate", { candidate: event.candidate, partnerId })
      }
    }

    pc.ontrack = (event) => {
      remoteStreamRef.current = event.streams[0];
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
        // Required for iOS Safari to play video inline
        remoteVideoRef.current.setAttribute('playsinline', 'true');
      }
    }
    
    localStreamRef.current?.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!)
    })

    peerConnectionRef.current = pc
  }, [socket, remoteVideoRef])

  const cleanupConnection = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close()
      peerConnectionRef.current = null
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null
    }
    remoteStreamRef.current = null;
    setPartnerId(null)
    setPartnerProfile(null)
  }, [remoteVideoRef])

  // 4. Set up signaling listeners
  useEffect(() => {
    if (!socket) return

    socket.on("match-found", async ({ partnerId: newPartnerId, initiator, partnerProfile: newPartnerProfile }) => {
      console.log(`Match found with ${newPartnerId}. Initiator: ${initiator}`)
      cleanupConnection(); // Clean up previous connection before starting a new one
      setIsSearching(false)
      setPartnerId(newPartnerId)
      setPartnerProfile(newPartnerProfile)
      createPeerConnection(newPartnerId)

      if (initiator) {
        const offer = await peerConnectionRef.current?.createOffer()
        await peerConnectionRef.current?.setLocalDescription(offer)
        socket.emit("offer", { sdp: offer, partnerId: newPartnerId })
      }
    })

    socket.on("offer", async ({ sdp, senderId }) => {
        console.log(`Offer received from ${senderId}`)
        if (!peerConnectionRef.current) {
            createPeerConnection(senderId);
        }
        await peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(sdp));
        const answer = await peerConnectionRef.current?.createAnswer();
        await peerConnectionRef.current?.setLocalDescription(answer);
        socket.emit("answer", { sdp: answer, partnerId: senderId });
    });

    socket.on("answer", ({ sdp }) => {
      console.log("Answer received")
      peerConnectionRef.current?.setRemoteDescription(new RTCSessionDescription(sdp))
    })

    socket.on("ice-candidate", ({ candidate }) => {
      console.log("ICE candidate received")
      peerConnectionRef.current?.addIceCandidate(new RTCIceCandidate(candidate))
    })

    socket.on("partner-disconnected", () => {
      console.log("Partner disconnected, cleaning up.")
      cleanupConnection()
      setChatMessages([])
    })

    socket.on("auto-searching", () => {
        console.log("Server triggered auto-search.")
        setIsSearching(true);
    })

    socket.on("chat-message", ({ message }) => {
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        isUser: false,
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, chatMessage])
    })

    return () => {
      socket.off("match-found")
      socket.off("offer")
      socket.off("answer")
      socket.off("ice-candidate")
      socket.off("partner-disconnected")
      socket.off("auto-searching")
      socket.off("chat-message")
    }
  }, [socket, createPeerConnection, cleanupConnection])

  const sendMessage = useCallback((message: string) => {
    if (socket && partnerId) {
      const chatMessage: ChatMessage = {
        id: Date.now().toString(),
        text: message,
        isUser: true,
        timestamp: new Date(),
      }
      setChatMessages(prev => [...prev, chatMessage])
      socket.emit("chat-message", { message, partnerId })
    }
  }, [socket, partnerId])

  const startSearching = useCallback(() => {
    if (profile) {
      setIsSearching(true)
      const { id, ...profileData } = profile
      socket?.emit("start-searching", { profile: profileData })
    } else {
      console.warn("Cannot start searching without a profile.")
      // Optionally, you could trigger a UI notification here
    }
  }, [socket, profile])

  const stopSearching = useCallback(() => {
    setIsSearching(false)
    socket?.emit("stop-searching")
  }, [socket])

  const skipChat = useCallback(() => {
    socket?.emit("skip-chat")
    cleanupConnection()
    setChatMessages([])
  }, [socket, cleanupConnection])
  
  const stopChat = useCallback(() => {
    setIsSearching(false)
    socket?.emit("stop-chat");
    cleanupConnection();
    setChatMessages([])
  }, [socket, cleanupConnection]);

  const switchCamera = useCallback(() => {
    if (availableCameras.length > 1) {
        const nextCameraIndex = (currentCameraIndex + 1) % availableCameras.length;
        setSelectedCamera(availableCameras[nextCameraIndex].deviceId);
        setCurrentCameraIndex(nextCameraIndex);
    }
  }, [availableCameras, currentCameraIndex]);

  return {
    startSearching,
    stopSearching,
    skipChat,
    stopChat,
    partnerId,
    partnerProfile,
    isSearching,
    switchCamera,
    availableCameras,
    availableMicrophones,
    selectedCamera,
    setSelectedCamera,
    selectedMicrophone,
    setSelectedMicrophone,
    localStream: localStreamRef.current,
    remoteStream: remoteStreamRef.current,
    hasCamera,
    cameraPermission,
    sendMessage,
    chatMessages,
  }
}
