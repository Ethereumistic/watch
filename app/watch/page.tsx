"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { PartnerInfo } from "@/components/watch/PartnerInfo"
import { VideoFeed } from "@/components/watch/VideoFeed"
import { ControlBar } from "@/components/watch/ControlBar"
import { Chat } from "@/components/watch/Chat"
import { DeviceSelectors } from "@/components/watch/DeviceSelectors"
import { VolumeControl } from "@/components/watch/VolumeControl"
import { Logo } from "@/components/layout/logo"
import { useWebRTC } from "@/hooks/useWebRTC"
import Link from "next/link"
import { Report } from "@/components/watch/Report"
import { useAuthStore } from "@/stores/use-auth-store"
import { ViolationModal } from "@/components/watch/ViolationModal"

declare global {
  interface Navigator {
    brave?: {
      isBrave: () => Promise<boolean>;
    };
  }
}

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function WatchPage() {
  const [strangerVolume, setStrangerVolume] = useState(50)
  const [isStrangerMuted, setIsStrangerMuted] = useState(false)
  const [isUserMuted, setIsUserMuted] = useState(false)
  const [chatOpen, setChatOpen] = useState(false)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [isSafari, setIsSafari] = useState(false)

  const [showViolationModal, setShowViolationModal] = useState(false);
  // FIX: Remove `loading: authLoading` as it no longer exists in the store.
  const { profile } = useAuthStore();

  const strangerVideoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const detectBrowser = async () => {
      const isBrave = (navigator.brave && (await navigator.brave.isBrave())) || false;
      if (!isBrave) {
        const isSafariBrowser = /Safari/i.test(navigator.userAgent) && /Apple/i.test(navigator.vendor || '') && !/CriOS/i.test(navigator.userAgent) && !/FxiOS/i.test(navigator.userAgent);
        setIsSafari(isSafariBrowser);
      }
    };
    if (typeof window !== "undefined") {
      detectBrowser();
    }
  }, []);


  const { 
    startSearching, 
    stopSearching,
    skipChat,
    stopChat,
    partnerId,
    partnerProfile,
    isSearching,
    hasCamera,
    cameraPermission,
    availableCameras, 
    availableMicrophones, 
    selectedCamera, 
    selectedMicrophone, 
    setSelectedCamera, 
    setSelectedMicrophone, 
    sendMessage,
    chatMessages,
    socket,
    localStream
  } = useWebRTC(
      userVideoRef as React.RefObject<HTMLVideoElement>, 
      strangerVideoRef as React.RefObject<HTMLVideoElement>
  );

  // FIX: The dependency array is now just [profile]. The `!authLoading` check is removed.
  useEffect(() => {
    // This effect now runs whenever the profile state changes.
    // If the user is not logged in, profile will be null and this check will correctly fail.
    if (profile) {
      const isCurrentlyBanned = profile.banned_until && new Date(profile.banned_until) > new Date();
      const hasUnacknowledgedWarning = profile.violation_level === 1 && sessionStorage.getItem('warningAcknowledged') !== 'true';

      if (isCurrentlyBanned || hasUnacknowledgedWarning) {
        setShowViolationModal(true);
      }
    }
  }, [profile]);

  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isUserMuted;
      });
    }
  }, [isUserMuted, localStream]);

  const handleAcknowledgeWarning = () => {
    sessionStorage.setItem('warningAcknowledged', 'true');
    setShowViolationModal(false);
  };

  const handleReport = async () => {
    if (!strangerVideoRef.current || !partnerId || !socket) {
      console.error("Cannot report: No partner connected or socket not available.");
      return;
    }
  
    const video = strangerVideoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const recentMessages = chatMessages.slice(-10);
  
    canvas.toBlob(async (blob) => {
      if (blob) {
        const screenshotBuffer = await blob.arrayBuffer();
        socket.emit('initiate-report', { 
          partnerId, 
          screenshot: screenshotBuffer,
          chatLog: { messages: recentMessages }
        });
      }
    }, 'image/jpeg', 0.7);
  };

  const isConnected = !!partnerId
  const isCameraReady = hasCamera && cameraPermission === "granted"

  const handleStartStop = useCallback(() => {
    if (isConnected) {
      stopChat()
      setChatOpen(false)
    } else if (isSearching) {
      stopSearching()
    } else {
      startSearching()
    }
  }, [isConnected, isSearching, startSearching, stopSearching, stopChat])

  const handleNext = useCallback(() => {
    if (isConnected) {
      skipChat()
      setChatOpen(false)
    }
  }, [isConnected, skipChat])

  useEffect(() => {
    if (chatMessages.length > 0 && !chatOpen) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (!lastMessage.isUser) {
        setUnreadMessages(prev => prev + 1);
      }
    }
  }, [chatMessages, chatOpen]);

  useEffect(() => {
    if (!isConnected && chatOpen) {
      setChatOpen(false);
    }
    if (!isConnected) {
      setUnreadMessages(0);
    }
  }, [isConnected, chatOpen]);

  const handleVolumeChange = useCallback((value: number) => {
    setStrangerVolume(value)
    if (value > 0) setIsStrangerMuted(false)
  }, [])

  const handleMuteToggle = useCallback(() => {
    setIsStrangerMuted(prev => !prev)
  }, [])

  const handleUserMuteToggle = useCallback(() => {
    setIsUserMuted((prev) => !prev)
  }, [])

  const isEffectivelyMuted = isStrangerMuted || strangerVolume === 0

  // FIX: This entire loading block is removed. The new pattern has no global auth loading state.
  // The page will render immediately, and the logic now depends on whether `profile` is available.

  if (showViolationModal && profile) {
    return (
      <ViolationModal 
        isOpen={true}
        level={profile.violation_level}
        banned_until={profile.banned_until}
        onAcknowledge={profile.violation_level === 1 ? handleAcknowledgeWarning : undefined}
      />
    )
  }

  return (
    <div className={`${isSafari ? 'h-[89vh]' : 'h-screen'} bg-black flex flex-col relative overflow-hidden`}>
      {/* ... rest of your JSX remains the same ... */}
       <div className={`flex-1 flex-col lg:flex-row flex transition-all duration-300 ${chatOpen ? "pr-80" : ""}`}>
      <PartnerInfo profile={partnerProfile} />
      {isConnected && <Report onReport={handleReport} />}

        <VideoFeed ref={strangerVideoRef} isMuted={isEffectivelyMuted} isConnected={isConnected} isSearching={isSearching} isRemote>
        <Link href="/" className="z-50">
          <Logo className="absolute left-2 lg:top-2 top-[88%] z-[5000]" />
          </Link>
          
          <VolumeControl
            volume={strangerVolume}
            isMuted={isEffectivelyMuted}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            className="z-10"
          />
        </VideoFeed>

        <VideoFeed ref={userVideoRef} isMuted isMirrored isConnected={isConnected} isSearching={isSearching} hasCamera={hasCamera} cameraPermission={cameraPermission}>
          <DeviceSelectors
            cameras={availableCameras}
            microphones={availableMicrophones}
            selectedCamera={selectedCamera}
            selectedMicrophone={selectedMicrophone}
            isMuted={isUserMuted}
            onCameraChange={setSelectedCamera}
            onMicrophoneChange={setSelectedMicrophone}
            onMuteToggle={handleUserMuteToggle}
            className="z-10"
          />
        </VideoFeed>
      </div>

      <ControlBar
        isConnected={isConnected}
        isSearching={isSearching}
        onStartStop={handleStartStop}
        onNext={handleNext}
        onToggleChat={() => {
          setChatOpen(!chatOpen)
          if (!chatOpen) {
            setUnreadMessages(0)
          }
        }}
        isCameraReady={isCameraReady}
        unreadMessages={unreadMessages}
      />

      <Chat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSendMessage={sendMessage}
      />
    </div>
  )
}