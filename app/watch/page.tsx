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
import { Loader2 } from "lucide-react"

// Add a type declaration for the Brave-specific navigator property.
// This informs TypeScript about the 'brave' object and its 'isBrave' method,
// preventing a build error without changing the runtime logic.
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

  // --- MODAL LOGIC START ---
  const [showViolationModal, setShowViolationModal] = useState(false);
  const { profile, loading: authLoading } = useAuthStore();
  // --- MODAL LOGIC END ---

  const strangerVideoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const detectBrowser = async () => {
      // This line will no longer cause a type error during the build.
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
    localStream // Get the localStream to control the audio track
    // FIX: Use a type assertion to match the specific RefObject type expected by the hook.
    // This resolves the type mismatch without changing runtime functionality.
  } = useWebRTC(
      userVideoRef as React.RefObject<HTMLVideoElement>, 
      strangerVideoRef as React.RefObject<HTMLVideoElement>
  );

  // --- MODAL LOGIC START ---
  useEffect(() => {
    // When the auth state is done loading, check the user's profile
    if (!authLoading && profile) {
      const isCurrentlyBanned = profile.banned_until && new Date(profile.banned_until) > new Date();
      // Only show a warning if it hasn't been acknowledged in this browser session
      const hasUnacknowledgedWarning = profile.violation_level === 1 && sessionStorage.getItem('warningAcknowledged') !== 'true';

      if (isCurrentlyBanned || hasUnacknowledgedWarning) {
        setShowViolationModal(true);
      }
    }
  }, [profile, authLoading]);

  // Add a useEffect to control the actual audio track based on the isUserMuted state
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isUserMuted;
      });
    }
  }, [isUserMuted, localStream]);

  const handleAcknowledgeWarning = () => {
    // Use sessionStorage to remember that the user has seen the warning
    sessionStorage.setItem('warningAcknowledged', 'true');
    setShowViolationModal(false);
  };
  // --- MODAL LOGIC END ---

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

  // --- MODAL LOGIC START ---
  // While checking the user's auth status, show a loader
  if (authLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-white" />
      </div>
    );
  }

  // If the user has a violation, render the modal and block the rest of the page
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
  // --- MODAL LOGIC END ---

  // If the user has no violations, render the normal page content
  return (
    <div className={`${isSafari ? 'h-[89vh]' : 'h-screen'} bg-black flex flex-col relative overflow-hidden`}>

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

        {/* The local video feed should always be muted to prevent echo. */}
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
