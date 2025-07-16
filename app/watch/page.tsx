"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { VideoFeed } from "@/components/watch/VideoFeed"
import { ControlBar } from "@/components/watch/ControlBar"
import { Chat } from "@/components/watch/Chat"
import { DeviceSelectors } from "@/components/watch/DeviceSelectors"
import { VolumeControl } from "@/components/watch/VolumeControl"
import { Logo } from "@/components/layout/logo"
import { useWebRTC } from "@/hooks/useWebRTC"
import Link from "next/link"

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

  const strangerVideoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)

  // NEW: More robust browser detection
  useEffect(() => {
    const detectBrowser = async () => {
      // The 'navigator.brave' object is a specific, reliable way to detect the Brave browser.
      // We make the function async to use 'await'.
      const isBrave = (navigator.brave && (await navigator.brave.isBrave())) || false;

      // If the browser is NOT Brave, then we can proceed to check if it's Safari.
      if (!isBrave) {
        // This check is more specific to Safari. It verifies the user agent and vendor,
        // while excluding other browsers on iOS like Chrome (CriOS) or Firefox (FxiOS).
        const isSafariBrowser =
          /Safari/i.test(navigator.userAgent) &&
          /Apple/i.test(navigator.vendor || '') &&
          !/CriOS/i.test(navigator.userAgent) &&
          !/FxiOS/i.test(navigator.userAgent);
        setIsSafari(isSafariBrowser);
      }
      // If 'isBrave' is true, the 'isSafari' state will correctly remain false.
    };
    
    // Ensure this code only runs in the browser.
    if (typeof window !== "undefined") {
      detectBrowser();
    }
  }, []); // Empty dependency array ensures this runs only once on mount.


  const { 
    startSearching, 
    stopSearching,
    skipChat,
    stopChat,
    partnerId,
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
    chatMessages
  } = useWebRTC(userVideoRef, strangerVideoRef)

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

  // Effect to handle unread messages
  useEffect(() => {
    if (chatMessages.length > 0 && !chatOpen) {
      const lastMessage = chatMessages[chatMessages.length - 1];
      if (!lastMessage.isUser) {
        setUnreadMessages(prev => prev + 1);
      }
    }
  }, [chatMessages, chatOpen]);

  // Effect to close chat panel when partner disconnects
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

  return (
    <div className={`${isSafari ? 'h-[89vh]' : 'h-screen'} bg-black flex flex-col relative overflow-hidden`}>
          <Link href="/">
          <Logo className="absolute top-2 left-2" />
          </Link>
      <div className={`flex-1 flex-col lg:flex-row flex transition-all duration-300 ${chatOpen ? "pr-80" : ""}`}>
        <VideoFeed ref={strangerVideoRef} isMuted={isEffectivelyMuted} isConnected={isConnected} isSearching={isSearching} isRemote>
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