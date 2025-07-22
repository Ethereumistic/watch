"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore, Profile } from "@/stores/use-auth-store";

// --- TYPES ---
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}
// The profile now includes the user's IP, received from the server
type PartnerProfile = (Omit<Profile, "id"> & { user_ip?: string }) | null;


// --- HOOK ---
export function useWebRTC(
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) {
  const { session } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const onOpenActions = useRef<(() => void)[]>([]);
  
  // Use a ref to hold all handlers to prevent stale closures in the onmessage callback.
  const handlersRef = useRef<any>({});

  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>();
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | undefined>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // --- SIGNALING ---
  const sendSignal = useCallback((type: string, payload: any) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      console.log(`[SEND] type: ${type}, payload:`, payload);
      socketRef.current.send(JSON.stringify({ type, payload }));
    } else {
      console.error(`[SEND] FAILED: Socket not open. Type: ${type}`);
    }
  }, []);

  // --- CONNECTION CLEANUP ---
  const cleanupConnection = useCallback(() => {
    console.log("[CLEANUP] Cleaning up peer connection.");
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.onconnectionstatechange = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
    setPartnerId(null);
    setPartnerProfile(null);
    setChatMessages([]);
  }, [remoteVideoRef]);

  // --- PEER CONNECTION MANAGEMENT ---
  const createPeerConnection = useCallback((iceServers: RTCConfiguration['iceServers'], currentPartnerId: string) => {
    console.log("[PCC] Creating new RTCPeerConnection with ICE servers:", iceServers);
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[PCC] onicecandidate: Found candidate, sending...", event.candidate);
        sendSignal("signal", { targetUserId: currentPartnerId, candidate: event.candidate });
      } else {
        console.log("[PCC] onicecandidate: All candidates have been sent.");
      }
    };

    pc.ontrack = (event) => {
      console.log("[PCC] ontrack: Received remote stream!", event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState) {
        console.log(`[PCC] Connection State Change: ${pc.connectionState}`);
      }
    };
    
    console.log("[PCC] Attaching local stream to peer connection.");
    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    peerConnectionRef.current = pc;
    return pc;
  }, [sendSignal, remoteVideoRef]);

  // --- SIGNALING HANDLERS ---
  // We wrap these in a useEffect to ensure the ref always has the latest functions.
  useEffect(() => {
    handlersRef.current.handleMatchFound = async (payload: { opponentId: string; role: 'polite' | 'impolite'; iceServers: RTCConfiguration['iceServers'] }) => {
      const { opponentId, role, iceServers } = payload;
      console.log(`Match found with ${opponentId}. My role: ${role}.`);
      cleanupConnection(); // <-- MOVED HERE
      setPartnerId(opponentId);
      const pc = createPeerConnection(iceServers, opponentId);
      setIsSearching(false);
  
      if (role === 'impolite') {
        console.log("I am the initiator ('impolite'), creating offer...");
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        console.log("Offer created and set as local description. Sending offer.");
        sendSignal("signal", { targetUserId: opponentId, offer: offer });
      }
    };

    handlersRef.current.handleOffer = async (payload: { senderId: string; offer: RTCSessionDescriptionInit }) => {
      const { senderId, offer } = payload;
      console.log("Received offer from", senderId);
      if (!peerConnectionRef.current) {
        console.error("Received offer but peer connection is not initialized. This is a critical error.");
        return;
      }
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      console.log("Remote description (offer) set. Creating answer.");
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      console.log("Answer created and set as local description. Sending answer.");
      sendSignal("signal", { targetUserId: senderId, answer: answer });
    };

    handlersRef.current.handleAnswer = async (payload: { senderId: string; answer: RTCSessionDescriptionInit }) => {
      console.log("Received answer from", payload.senderId);
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        console.log("Remote description (answer) set successfully.");
      } else {
        console.error("Received answer but peer connection is not initialized.");
      }
    };

    handlersRef.current.handleIceCandidate = (payload: { senderId: string; candidate: RTCIceCandidateInit }) => {
      console.log("Received ICE candidate from", payload.senderId);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate))
          .catch(e => console.error("Error adding received ICE candidate:", e));
      } else {
        console.error("Received ICE candidate but peer connection is not initialized.");
      }
    };

    handlersRef.current.handleChatMessage = (payload: { senderId: string; text: string }) => {
      setChatMessages(prev => [...prev, { id: crypto.randomUUID(), text: payload.text, isUser: false, timestamp: new Date() }]);
    };

    handlersRef.current.handlePartnerProfile = (payload: { profile: PartnerProfile }) => {
      console.log("CLIENT: Received partner profile:", payload.profile); // <-- MODIFY THIS LOG
      setPartnerProfile(payload.profile);
    };

    handlersRef.current.handlePartnerDisconnected = () => {
      console.log("Partner disconnected. Cleaning up and starting a new search.");
      cleanupConnection();
      setIsSearching(true);
      sendSignal("start-search", {});
    };

  }, [cleanupConnection, createPeerConnection, sendSignal]);


  // --- WEBSOCKET LIFECYCLE & ACTION QUEUE ---
  const connectToSignalingServer = useCallback(() => {
    const token = session?.access_token;
    if (!token) { 
      console.error("No auth token found."); 
      return; 
    }
    // Prevent creating a new socket if one already exists or is connecting
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) {
      console.log("Socket already exists or is connecting.");
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:3003";
    console.log(`Connecting to signaling server at: ${wsUrl}`);
    const newSocket = new WebSocket(wsUrl, token);
    socketRef.current = newSocket;

    newSocket.onopen = () => {
      console.log("✅ WebSocket connection opened.");
      setIsSocketConnected(true);
      // Process any queued actions
      onOpenActions.current.forEach(action => action());
      onOpenActions.current = []; // Clear the queue
    };

    newSocket.onclose = () => {
      console.log("❌ WebSocket connection closed.");
      socketRef.current = null;
      setIsSocketConnected(false);
      setIsSearching(false);
      cleanupConnection();
    };

    newSocket.onerror = (error) => console.error("WebSocket Error:", error);

    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`[RECV] type: ${message.type}, payload:`, message.payload);
        
        switch (message.type) {
          case 'info': break;
          case 'match-found': handlersRef.current.handleMatchFound(message.payload); break;
          case 'partner-profile': handlersRef.current.handlePartnerProfile(message.payload); break;
          case 'signal':
            if (message.payload.offer) handlersRef.current.handleOffer(message.payload);
            else if (message.payload.answer) handlersRef.current.handleAnswer(message.payload);
            else if (message.payload.candidate) handlersRef.current.handleIceCandidate(message.payload);
            break;
          case 'chat-message': handlersRef.current.handleChatMessage(message.payload); break;
          case 'peer-disconnected': handlersRef.current.handlePartnerDisconnected(); break;
          case 'error': console.error("Server error:", message.payload.message); break;
        }
      } catch (e) {
        console.error("Failed to parse incoming message:", event.data, e);
      }
    };
  }, [session, cleanupConnection]);

  const executeWhenConnected = useCallback((action: () => void) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      action();
    } else {
      onOpenActions.current.push(action);
      // If not connected or connecting, initiate connection.
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connectToSignalingServer();
      }
    }
  }, [connectToSignalingServer]);

  // --- MEDIA DEVICE MANAGEMENT ---
  useEffect(() => {
    const getDevices = async () => {
      try {
        // We need to request permission first to be able to enumerate devices
        await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === "videoinput");
        const audioDevices = devices.filter((d) => d.kind === "audioinput");
        setHasCamera(videoDevices.length > 0);
        setCameraPermission(videoDevices.length > 0 ? "granted" : "denied");
        setAvailableCameras(videoDevices);
        setAvailableMicrophones(audioDevices);
        if (videoDevices.length > 0 && !selectedCamera) setSelectedCamera(videoDevices[0].deviceId);
        if (audioDevices.length > 0 && !selectedMicrophone) setSelectedMicrophone(audioDevices[0].deviceId);
      } catch (error) {
        console.error("Failed to get media devices:", error);
        if (error instanceof DOMException && error.name === "NotAllowedError") {
          setCameraPermission("denied");
        }
      }
    };
    getDevices();
  }, [selectedCamera, selectedMicrophone]);

  useEffect(() => {
    const getMediaStream = async () => {
      if (selectedCamera && selectedMicrophone) {
        // Stop previous stream tracks before getting a new one
        localStreamRef.current?.getTracks().forEach((track) => track.stop());
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { deviceId: { exact: selectedCamera } },
            audio: { deviceId: { exact: selectedMicrophone } },
          });
          localStreamRef.current = stream;
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        } catch (error) {
          console.error("Failed to get media stream:", error);
        }
      }
    };
    getMediaStream();
  }, [selectedCamera, selectedMicrophone, localVideoRef]);

  // --- USER ACTIONS ---
  const startSearching = useCallback(() => {
    executeWhenConnected(() => {
      setIsSearching(true);
      sendSignal("start-search", {});
    });
  }, [executeWhenConnected, sendSignal]);

  const stopSearching = useCallback(() => {
    if (socketRef.current) {
      sendSignal("stop-search", {});
      socketRef.current.close(); // This will trigger the onclose handler for cleanup
    }
    cleanupConnection();
  }, [cleanupConnection, sendSignal]);
  
  const skipChat = useCallback(() => {
    // A skip is effectively a stop followed by an immediate start
    stopSearching();
    setTimeout(() => startSearching(), 100); // Small delay to allow cleanup
  }, [startSearching, stopSearching]);

  const sendMessage = useCallback((text: string) => {
    if (partnerId) {
      setChatMessages(prev => [...prev, { id: crypto.randomUUID(), text, isUser: true, timestamp: new Date() }]);
      sendSignal('chat-message', { targetUserId: partnerId, text });
    }
  }, [partnerId, sendSignal]);

  const sendReport = useCallback(async ({ screenshot, chatLog }: { screenshot: ArrayBuffer, chatLog: { messages: ChatMessage[] } }) => {
    if (!partnerId) {
      console.error("Cannot send report: no partner connected.");
      return;
    }

    // Convert ArrayBuffer to Base64
    let binary = '';
    const bytes = new Uint8Array(screenshot);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const screenshotBase64 = window.btoa(binary);

    console.log("Sending report for partner:", partnerId);
    sendSignal('report-peer', {
      reportedUserId: partnerId,
      screenshot: screenshotBase64,
      chatLog: chatLog,
    });
    
    console.log("Report sent. Skipping to next chat.");
    // Immediately skip to the next user after sending the report.
    skipChat();
  }, [partnerId, sendSignal, skipChat]);

  const notifySettingsChanged = useCallback((settingsPayload: any) => {
    executeWhenConnected(() => {
      console.log("Notifying backend of settings change:", settingsPayload);
      sendSignal('settings-updated', settingsPayload);
    });
  }, [executeWhenConnected, sendSignal]);

  // --- RETURN ---
  return {
    startSearching,
    stopSearching,
    skipChat,
    stopChat: stopSearching,
    partnerId,
    partnerProfile,
    isSearching,
    hasCamera,
    cameraPermission,
    availableCameras,
    availableMicrophones,
    selectedCamera,
    setSelectedCamera,
    selectedMicrophone,
    setSelectedMicrophone,
    sendMessage,
    chatMessages,
    localStreamRef,
    sendReport,
    notifySettingsChanged,
  };
}
