"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useAuthStore, PartnerProfile } from "@/stores/use-auth-store";

// --- TYPES ---
interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

// <-- NEW: Define the shape of the ad payload from the server
interface AdPayload {
  videoUrl: string;
  profile: PartnerProfile;
}

// --- HOOK ---
export function useWebRTC(
  localVideoRef: React.RefObject<HTMLVideoElement>,
  remoteVideoRef: React.RefObject<HTMLVideoElement>
) {
  const { session, setPartnerProfile } = useAuthStore();
  const socketRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const onOpenActions = useRef<(() => void)[]>([]);

  const handlersRef = useRef<any>({});

  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasCamera, setHasCamera] = useState(true);
  const [cameraPermission, setCameraPermission] = useState<"prompt" | "granted" | "denied">("prompt");
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedCamera, setSelectedCamera] = useState<string | undefined>();
  const [selectedMicrophone, setSelectedMicrophone] = useState<string | undefined>();
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  // <-- NEW: State for managing video ads
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adPayload, setAdPayload] = useState<AdPayload | null>(null);

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
  const resetPeerConnection = useCallback(() => {
    console.log("[RESET] Resetting peer connection for new partner.");
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
    setChatMessages([]);
  }, [remoteVideoRef]);

  const endChatSession = useCallback(() => {
    console.log("[END] Ending chat session completely.");
    resetPeerConnection();
    setPartnerId(null);
    setPartnerProfile(null);
    // <-- NEW: Reset ad state on cleanup
    setIsAdPlaying(false);
    setAdPayload(null);
  }, [resetPeerConnection, setPartnerProfile]);


  // --- PEER CONNECTION MANAGEMENT ---
  const createPeerConnection = useCallback((iceServers: RTCConfiguration['iceServers'], currentPartnerId: string) => {
    console.log("[PCC] Creating new RTCPeerConnection with ICE servers:", iceServers);
    const pc = new RTCPeerConnection({ iceServers });

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        console.log("[PCC] onicecandidate: Found candidate, sending...", event.candidate);
        sendSignal("signal", { targetUserId: currentPartnerId, candidate: event.candidate });
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

    localStreamRef.current?.getTracks().forEach(track => {
      pc.addTrack(track, localStreamRef.current!);
    });

    peerConnectionRef.current = pc;
    return pc;
  }, [sendSignal, remoteVideoRef]);

// --- SIGNALING HANDLERS ---
useEffect(() => {
  handlersRef.current.handleAdMatchFound = (payload: AdPayload) => {
    endChatSession(); // Use full cleanup for ads
    setIsSearching(false);
    setPartnerId("ad_bot");
    setIsAdPlaying(true);
    setAdPayload(payload);
    setPartnerProfile(payload.profile);
  };

  handlersRef.current.handleMatchFound = async (payload: { opponentId: string; role: 'polite' | 'impolite'; iceServers: RTCConfiguration['iceServers'] }) => {
    const { opponentId, role, iceServers } = payload;
    // <-- BUG FIX: Use resetPeerConnection() instead of endChatSession() here.
    // This prepares the technical connection without clearing the partner profile,
    // which is set by the subsequent 'partner-profile' message.
    resetPeerConnection();
    setPartnerId(opponentId);
    const pc = createPeerConnection(iceServers, opponentId);
    setIsSearching(false);

    if (role === 'impolite') {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendSignal("signal", { targetUserId: opponentId, offer: offer });
    }
  };

    // ... (rest of the handlers: handleOffer, handleAnswer, etc. remain unchanged) ...
    handlersRef.current.handleOffer = async (payload: { senderId: string; offer: RTCSessionDescriptionInit }) => {
        if (!peerConnectionRef.current) return;
        await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
        const answer = await peerConnectionRef.current.createAnswer();
        await peerConnectionRef.current.setLocalDescription(answer);
        sendSignal("signal", { targetUserId: payload.senderId, answer: answer });
    };
    handlersRef.current.handleAnswer = async (payload: { senderId: string; answer: RTCSessionDescriptionInit }) => {
        if (peerConnectionRef.current) {
            await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
        }
    };
    handlersRef.current.handleIceCandidate = (payload: { senderId: string; candidate: RTCIceCandidateInit }) => {
        if (peerConnectionRef.current) {
            peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate)).catch(e => {});
        }
    };
    handlersRef.current.handleChatMessage = (payload: { senderId: string; text: string }) => {
        setChatMessages(prev => [...prev, { id: crypto.randomUUID(), text: payload.text, isUser: false, timestamp: new Date() }]);
    };
    handlersRef.current.handlePartnerProfile = (payload: { profile: PartnerProfile }) => {
        setPartnerProfile(payload.profile);
    };
    handlersRef.current.handlePartnerDisconnected = () => {
        endChatSession();
        startSearching();
    };

  }, [endChatSession, createPeerConnection, sendSignal, setPartnerProfile]);


  // --- WEBSOCKET LIFECYCLE & ACTION QUEUE ---
  const connectToSignalingServer = useCallback(() => {
    const token = session?.access_token;
    if (!token) { return; }
    if (socketRef.current && socketRef.current.readyState !== WebSocket.CLOSED) { return; }

    const wsUrl = process.env.NEXT_PUBLIC_SIGNALING_URL || "ws://localhost:3003";
    const newSocket = new WebSocket(wsUrl, token);
    socketRef.current = newSocket;

    newSocket.onopen = () => {
      setIsSocketConnected(true);
      onOpenActions.current.forEach(action => action());
      onOpenActions.current = [];
    };

    newSocket.onclose = () => {
      socketRef.current = null;
      setIsSocketConnected(false);
      setIsSearching(false);
      endChatSession();
    };

    newSocket.onerror = (error) => console.error("WebSocket Error:", error);

    newSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        console.log(`[RECV] type: ${message.type}, payload:`, message.payload);

        switch (message.type) {
          case 'info': break;
          case 'ad-match-found': handlersRef.current.handleAdMatchFound(message.payload); break; // <-- NEW
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
  }, [session, endChatSession]);

  const executeWhenConnected = useCallback((action: () => void) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      action();
    } else {
      onOpenActions.current.push(action);
      if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
        connectToSignalingServer();
      }
    }
  }, [connectToSignalingServer]);

  // --- MEDIA DEVICE MANAGEMENT ---
  useEffect(() => {
    const getDevices = async () => {
      try {
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
      socketRef.current.close();
    }
    endChatSession();
  }, [endChatSession, sendSignal]);

  const skipChat = useCallback(() => {
    stopSearching();
    setTimeout(() => startSearching(), 100);
  }, [startSearching, stopSearching]);

  const sendMessage = useCallback((text: string) => {
    // <-- NEW: Prevent sending chat messages to ads
    if (partnerId && !isAdPlaying) {
      setChatMessages(prev => [...prev, { id: crypto.randomUUID(), text, isUser: true, timestamp: new Date() }]);
      sendSignal('chat-message', { targetUserId: partnerId, text });
    }
  }, [partnerId, sendSignal, isAdPlaying]);

  const sendReport = useCallback(async ({ screenshot, chatLog }: { screenshot: ArrayBuffer, chatLog: { messages: ChatMessage[] } }) => {
    // <-- NEW: Prevent reporting ads
    if (!partnerId || isAdPlaying) {
      console.error("Cannot send report: no partner connected or partner is an ad.");
      return;
    }

    let binary = '';
    const bytes = new Uint8Array(screenshot);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const screenshotBase64 = window.btoa(binary);

    sendSignal('report-peer', {
      reportedUserId: partnerId,
      screenshot: screenshotBase64,
      chatLog: chatLog,
    });

    skipChat();
  }, [partnerId, sendSignal, skipChat, isAdPlaying]);

  const notifySettingsChanged = useCallback((settingsPayload: any) => {
    executeWhenConnected(() => {
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
    localStream: localStreamRef.current,
    sendReport,
    notifySettingsChanged,
    // <-- NEW: Expose ad state to the component
    isAdPlaying,
    adPayload,
  };
}