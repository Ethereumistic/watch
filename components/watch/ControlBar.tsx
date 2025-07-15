"use client"

import { Button } from "@/components/ui/button"
import { Play, Square, SkipForward, MessageCircle } from "lucide-react"

interface ControlBarProps {
  isConnected: boolean
  isSearching: boolean
  onStartStop: () => void
  onNext: () => void
  onToggleChat: () => void
}

export function ControlBar({ isConnected, isSearching, onStartStop, onNext, onToggleChat }: ControlBarProps) {
  return (
    <div className="bg-gray-900 border-t border-gray-700 p-4 flex items-center justify-center space-x-4">
      <div className="flex items-center space-x-4">
        <Button
          variant={isConnected || isSearching ? "destructive" : "gradient"}
          onClick={onStartStop}
          className="px-6 py-2 rounded-full font-semibold w-36" // Added fixed width to prevent layout shifts
        >
          {isSearching ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Stop
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
          <Button
            variant="gradient"
            onClick={onNext}
            className="px-6 py-2 rounded-full font-semibold"
            disabled={isSearching}
          >
            <SkipForward className="h-4 w-4 mr-2" />
            Next
          </Button>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleChat}
        className="bg-gray-800 border-gray-600 text-white hover:bg-gray-700"
      >
        <MessageCircle className="h-4 w-4 mr-2" />
        Chat
      </Button>
    </div>
  )
}
