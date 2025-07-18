"use client"

import { Button } from "@/components/ui/button"
import { Play, Square, SkipForward, MessageCircle } from "lucide-react"

interface ControlBarProps {
  isConnected: boolean
  isSearching: boolean
  onStartStop: () => void
  onNext: () => void
  onToggleChat: () => void
  isCameraReady: boolean
  unreadMessages: number
}

export function ControlBar({ isConnected, isSearching, onStartStop, onNext, onToggleChat, isCameraReady, unreadMessages }: ControlBarProps) {
  return (
<div
  className={`absolute bottom-2 ${
    isConnected ? "left-[50.9%]" : "left-[50%]"
  } right-[50%] flex items-center justify-center space-x-4 z-10`}
>

  <div className="flex items-center space-x-4">
    <Button
      variant={isConnected || isSearching ? "destructive" : "gradient"}
      onClick={onStartStop}
      className={`px-6 py-2  font-semibold w-36 ${isConnected || isSearching ? "opacity-80 bg-gradient-pink" : "asd"}`} // Added fixed width to prevent layout shifts
      disabled={!isCameraReady && !isConnected && !isSearching}
    >
      {isSearching ? (
        <>
          <div className="animate-spin h-4 w-4 mr-2">*</div>
          Searching...
        </>
      ) : isConnected ? (
        <>
          <Square className="h-4 w-4 mr-2" />
          Stop
        </>
      ) : (
        <>
          <Play className="h-4 w-4 mr-2" />
          Start
        </>
      )}
    </Button>

    {isConnected && (
      <div className="space-x-2 flex justify-center items-center"> 
      <Button
        variant="gradient"
        onClick={onNext}
        className="px-6 py-2 font-semibold"
        disabled={isSearching}
      >
        <SkipForward className="h-4 w-4 mr-2" />
        Next
      </Button>
      <Button
    variant="outline"
    size="sm"
    onClick={onToggleChat}
    className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 relative"
  >
    {unreadMessages > 0 && (
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
        {unreadMessages}
      </span>
    )}
    <MessageCircle className="h-4 w-4 mr-2" />
    Chat
  </Button>
  </div>
    )}
  </div>

  {/* <Button
    variant="outline"
    size="sm"
    onClick={onToggleChat}
    className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700 relative"
  >
    {unreadMessages > 0 && (
      <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
        {unreadMessages}
      </span>
    )}
    <MessageCircle className="h-4 w-4 mr-2" />
    Chat
  </Button> */}
</div>
  )
}
