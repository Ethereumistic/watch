"use client"

import { forwardRef } from "react"
import { Video } from "lucide-react"

interface VideoFeedProps {
  isMuted?: boolean
  isMirrored?: boolean
  children?: React.ReactNode
  isConnected: boolean
  isSearching: boolean
}

export const VideoFeed = forwardRef<HTMLVideoElement, VideoFeedProps>(
  ({ isMuted = false, isMirrored = false, children, isConnected, isSearching }, ref) => {
    return (
      <div className="flex-1 relative bg-gray-900 border-r border-gray-700">
        <video
          ref={ref}
          className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
          autoPlay
          playsInline
          muted={isMuted}
        />
        <div className="absolute inset-0 pointer-events-none">
          {children}
          {!isConnected && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70">
              <div className="text-center text-white">
                {isSearching ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p>Looking for someone...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2 opacity-50">
                    <Video className="h-12 w-12" />
                    <p className="text-gray-400">No connection</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

VideoFeed.displayName = "VideoFeed"
