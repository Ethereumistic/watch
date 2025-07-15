"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import io, { Socket } from "socket.io-client"

const ICE_SERVERS = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
}

export function useWebRTC(
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const [partnerId, setPartnerId] = useState<string | null>(null)
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([])
  const [selectedCamera, setSelectedCamera] = useState("")
  const [selectedMicrophone, setSelectedMicrophone] = useState("")

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
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true }) // Request permission
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((d) => d.kind === "videoinput")
        const audioDevices = devices.filter((d) => d.kind === "audioinput")
        setAvailableCameras(videoDevices)
        setAvailableMicrophones(audioDevices)
        if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId)
        if (audioDevices.length > 0) setSelectedMicrophone(audioDevices[0].deviceId)
      } catch (error) {
        console.error("Failed to get media devices:", error)
      }
    }
    getDevices()
  }, [])

  // 3. Set up local media stream when a device is selected
  useEffect(() => {
    const getMediaStream = async () => {
      if (selectedCamera && selectedMicrophone) {
        localStreamRef.current?.getTracks().forEach((track) => track.stop())
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCamera } },
            audio: { deviceId: { exact: selectedMicrophone } },
          })
          localStreamRef.current = stream
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream
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
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0]
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
    setPartnerId(null)
  }, [remoteVideoRef])

  // 4. Set up signaling listeners
  useEffect(() => {
    if (!socket) return

    socket.on("match-found", async ({ partnerId: newPartnerId, initiator }) => {
      console.log(`Match found with ${newPartnerId}. Initiator: ${initiator}`)
      setPartnerId(newPartnerId)
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
      console.log("Partner disconnected")
      cleanupConnection()
    })

    return () => {
      socket.off("match-found")
      socket.off("offer")
      socket.off("answer")
      socket.off("ice-candidate")
      socket.off("partner-disconnected")
    }
  }, [socket, createPeerConnection, cleanupConnection])

  const startSearching = useCallback(() => {
    socket?.emit("start-searching")
  }, [socket])

  const stopSearching = useCallback(() => {
    socket?.emit("stop-searching")
  }, [socket])

  const skipChat = useCallback(() => {
    socket?.emit("skip-chat")
    cleanupConnection()
  }, [socket, cleanupConnection])

  return {
    startSearching,
    stopSearching,
    skipChat,
    partnerId,
    availableCameras,
    availableMicrophones,
    selectedCamera,
    setSelectedCamera,
    selectedMicrophone,
    setSelectedMicrophone,
  }
}
