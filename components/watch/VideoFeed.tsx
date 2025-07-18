"use client"

import { forwardRef } from "react"
import { Video } from "lucide-react"

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
      // --- CHANGE START ---
      // Removed `flex-1` and added explicit sizing for mobile and desktop.
      // On mobile (default), it takes 50% of the height (`h-1/2`) and full width.
      // On large screens (`lg:`), it takes 50% of the width (`lg:w-1/2`) and full height.
      // This creates a strict boundary for the video element.
      <div className="relative w-full h-1/2 lg:w-1/2 lg:h-full border-r border-gray-700 bg-black overflow-hidden">
        <video
          ref={ref}
          // The `object-cover` will now fill the container which has a fixed 50% height on mobile,
          // correctly cropping the video without breaking the layout.
          className={`w-full h-full object-cover ${isMirrored ? "scale-x-[-1]" : ""}`}
          autoPlay
          playsInline
          muted={isMuted}
        />
        <div className="absolute inset-0 ">
          {children}
          {isRemote && !isConnected && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-30">
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
