"use client"

import { useState, useRef, useEffect } from "react"
import { VideoFeed } from "@/components/watch/VideoFeed"
import { ControlBar } from "@/components/watch/ControlBar"
import { Chat } from "@/components/watch/Chat"
import { DeviceSelectors } from "@/components/watch/DeviceSelectors"
import { VolumeControl } from "@/components/watch/VolumeControl"
import { Logo } from "@/components/layout/logo"

interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
}

export default function WatchPage() {
  const [isConnected, setIsConnected] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [strangerVolume, setStrangerVolume] = useState(50)
  const [isStrangerMuted, setIsStrangerMuted] = useState(false)
  const [isUserMuted, setIsUserMuted] = useState(false)
  const [selectedCamera, setSelectedCamera] = useState("")
  const [selectedMicrophone, setSelectedMicrophone] = useState("")
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([])
  const [availableMicrophones, setAvailableMicrophones] = useState<MediaDeviceInfo[]>([])

  const strangerVideoRef = useRef<HTMLVideoElement>(null)
  const userVideoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    async function getDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices()
        const videoDevices = devices.filter((device) => device.kind === "videoinput" && device.deviceId)
        const audioDevices = devices.filter((device) => device.kind === "audioinput" && device.deviceId)
        setAvailableCameras(videoDevices)
        setAvailableMicrophones(audioDevices)
        if (videoDevices.length > 0) setSelectedCamera(videoDevices[0].deviceId)
        if (audioDevices.length > 0) setSelectedMicrophone(audioDevices[0].deviceId)
      } catch (error) {
        console.error("Error getting devices:", error)
      }
    }
    getDevices()
  }, [])

  const handleStartStop = () => {
    if (isConnected) {
      setIsConnected(false)
      setIsSearching(false)
    } else {
      setIsSearching(true)
      setTimeout(() => {
        setIsSearching(false)
        setIsConnected(true)
      }, 2000)
    }
  }

  const handleNext = () => {
    setIsSearching(true)
    setTimeout(() => {
      setIsSearching(false)
      setIsConnected(true)
    }, 1500)
  }

  const handleSendMessage = (text: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      text,
      isUser: true,
      timestamp: new Date(),
    }
    setChatMessages((prev) => [...prev, message])

    setTimeout(() => {
      const response: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Hello! Nice to meet you!",
        isUser: false,
        timestamp: new Date(),
      }
      setChatMessages((prev) => [...prev, response])
    }, 1000)
  }

  const handleVolumeChange = (value: number) => {
    setStrangerVolume(value)
    if (value > 0) setIsStrangerMuted(false)
  }

  const handleMuteToggle = () => {
    if (isStrangerMuted) {
      setIsStrangerMuted(false)
      if (strangerVolume === 0) setStrangerVolume(50)
    } else {
      setIsStrangerMuted(true)
    }
  }

  const isEffectivelyMuted = isStrangerMuted || strangerVolume === 0

  return (
    <div className="h-screen bg-black flex flex-col relative overflow-hidden">
          <Logo className="absolute top-2 left-2" />
      <div className={`flex-1 flex transition-all duration-300 ${chatOpen ? "pr-80" : ""}`}>
        <VideoFeed ref={strangerVideoRef} isMuted={isEffectivelyMuted} isConnected={isConnected} isSearching={isSearching}>
          <VolumeControl
            volume={strangerVolume}
            isMuted={isEffectivelyMuted}
            onVolumeChange={handleVolumeChange}
            onMuteToggle={handleMuteToggle}
            className="z-10"
          />
        </VideoFeed>

        <VideoFeed ref={userVideoRef} isMuted isMirrored isConnected={isConnected} isSearching={isSearching}>
          <DeviceSelectors
            cameras={availableCameras}
            microphones={availableMicrophones}
            selectedCamera={selectedCamera}
            selectedMicrophone={selectedMicrophone}
            isMuted={isUserMuted}
            onCameraChange={setSelectedCamera}
            onMicrophoneChange={setSelectedMicrophone}
            onMuteToggle={() => setIsUserMuted(!isUserMuted)}
            className="z-10"
          />
        </VideoFeed>
      </div>

      <ControlBar
        isConnected={isConnected}
        isSearching={isSearching}
        onStartStop={handleStartStop}
        onNext={handleNext}
        onToggleChat={() => setChatOpen(!chatOpen)}
      />

      <Chat
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        messages={chatMessages}
        onSendMessage={handleSendMessage}
      />
    </div>
  )
}