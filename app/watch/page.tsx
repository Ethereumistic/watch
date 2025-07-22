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

  const [showViolationModal, setShowViolationModal] = useState(false);
  const { profile } = useAuthStore();

  const strangerVideoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)

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
    localStream,
    sendReport, // FIX: Destructure the new sendReport function
  } = useWebRTC(
      userVideoRef as React.RefObject<HTMLVideoElement>, 
      strangerVideoRef as React.RefObject<HTMLVideoElement>
  );

  useEffect(() => {
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
    // FIX: Use the new sendReport function from the hook
    if (!strangerVideoRef.current || !partnerId || !sendReport) {
      console.error("Cannot report: No partner connected or report function not available.");
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
        // Call the new function from the hook
        sendReport({ 
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
    <div className="h-[100dvh] bg-black flex flex-col relative overflow-hidden">
      <div className={`flex-1 flex-col lg:flex-row flex transition-all duration-300 overflow-hidden ${chatOpen ? "pr-80" : ""}`}>
      <PartnerInfo profile={partnerProfile} />

        <VideoFeed ref={strangerVideoRef} isMuted={isEffectivelyMuted} isConnected={isConnected} isSearching={isSearching} isRemote>
        <Link href="/" className="z-[5001]">
          <Logo className="absolute left-2 lg:top-2 top-[88%] z-[5000]" />
          </Link>
          {isConnected && <Report onReport={handleReport} />}

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
            // FIX: Handle undefined state to prevent Radix error
            selectedCamera={selectedCamera || ''}
            selectedMicrophone={selectedMicrophone || ''}
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
