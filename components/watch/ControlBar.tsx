"use client"

import { Button } from "@/components/ui/button"
import { Play, Square, SkipForward, MessageCircle, Settings } from "lucide-react"

interface ControlBarProps {
  isConnected: boolean
  isSearching: boolean
  onStartStop: () => void
  onNext: () => void
  onToggleChat: () => void
  onToggleSettings: () => void; // New prop for settings
  isCameraReady: boolean
  unreadMessages: number
}

export function ControlBar({ 
  isConnected, 
  isSearching, 
  onStartStop, 
  onNext, 
  onToggleChat, 
  onToggleSettings, // Destructure new prop
  isCameraReady, 
  unreadMessages 
}: ControlBarProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center justify-center space-x-2 z-20">
      <div className="flex items-center p-2 bg-black/40 backdrop-blur-md rounded-full shadow-lg border border-white/10 space-x-2">
        
        {/* Start/Stop Button */}
        <Button
          variant={isConnected || isSearching ? "destructive" : "gradient"}
          onClick={onStartStop}
          className="px-6 py-2 font-semibold w-36 rounded-full"
          disabled={!isCameraReady && !isConnected && !isSearching}
        >
          {isSearching ? (
            <><div className="animate-spin h-4 w-4 mr-2">*</div>Searching...</>
          ) : isConnected ? (
            <><Square className="h-4 w-4 mr-2" />Stop</>
          ) : (
            <><Play className="h-4 w-4 mr-2" />Start</>
          )}
        </Button>

        {/* Next Button */}
        {isConnected && (
          <Button
            variant="gradient"
            onClick={onNext}
            className="px-6 py-2 font-semibold rounded-full"
            disabled={isSearching}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Next
          </Button>
        )}

        {/* Chat Button */}
        {isConnected && (
          <Button
            variant="outline"
            size="icon"
            onClick={onToggleChat}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full relative"
          >
            {unreadMessages > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                {unreadMessages}
              </span>
            )}
            <MessageCircle className="h-5 w-5" />
          </Button>
        )}

        {/* Settings Button */}
        <Button
          variant="outline"
          size="icon"
          onClick={onToggleSettings}
          className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full"
        >
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </div>
  )
}
