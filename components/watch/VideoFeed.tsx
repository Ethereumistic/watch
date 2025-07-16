"use client"

import { forwardRef } from "react"
import { Video } from "lucide-react"
import { Logo } from "@/Logo"

interface VideoFeedProps {
  isMuted?: boolean
  isMirrored?: boolean
  children?: React.ReactNode
  isConnected: boolean
  isSearching: boolean
  isRemote?: boolean
  hasCamera?: boolean
  cameraPermission?: "prompt" | "granted" | "denied"
}

export const VideoFeed = forwardRef<HTMLVideoElement, VideoFeedProps>(
  (
    {
      isMuted = false,
      isMirrored = false,
      children,
      isConnected,
      isSearching,
      isRemote = false,
      hasCamera = true,
      cameraPermission = "prompt",
    },
    ref
  ) => {
    const showNoCameraMessage = !isRemote && !hasCamera
    const showPermissionMessage = !isRemote && cameraPermission === "denied"

    return (
      <div className="flex-1 relative border-r border-gray-700 bg-black">
        <video
          ref={ref}
          className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
          autoPlay
          playsInline
          muted={isMuted}
        />
        <div className="absolute inset-0 pointer-events-none">
          {children}
          {isRemote && !isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
              <div className="mt-4 text-center text-white">
                {isSearching ? (
                  <div className="space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
                    <p>Looking for someone...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center space-y-2 opacity-50">
                    <Video className="h-12 w-12" />
                    <p className="text-gray-400">Start connecting...</p>
                  </div>
                )}
              </div>
            </div>
          )}
          {showNoCameraMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-center text-white p-4 rounded-lg">
                <Video className="h-12 w-12 mx-auto mb-2" />
                <p className="font-bold">No Camera Detected</p>
                <p className="text-sm text-gray-300">Please connect a camera to start.</p>
              </div>
            </div>
          )}
          {showPermissionMessage && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70">
              <div className="text-center text-white p-4 rounded-lg">
                <Video className="h-12 w-12 mx-auto mb-2" />
                <p className="font-bold">Camera Access Denied</p>
                <p className="text-sm text-gray-300">Please allow camera access in your browser settings.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }
)

VideoFeed.displayName = "VideoFeed"
