"use client"

import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Camera, Mic, MicOff } from "lucide-react"
import { cn } from "@/lib/utils"

interface DeviceSelectorsProps {
  cameras: MediaDeviceInfo[]
  microphones: MediaDeviceInfo[]
  selectedCamera: string
  selectedMicrophone: string
  isMuted: boolean
  onCameraChange: (deviceId: string) => void
  onMicrophoneChange: (deviceId: string) => void
  onMuteToggle: () => void
  className?: string
}

export function DeviceSelectors({
  cameras,
  microphones,
  selectedCamera,
  selectedMicrophone,
  isMuted,
  onCameraChange,
  onMicrophoneChange,
  onMuteToggle,
  className,
}: DeviceSelectorsProps) {
  return (
    <div className={cn("absolute top-2 right-2 flex items-center space-x-2 pointer-events-auto", className)}>
      <Select value={selectedCamera} onValueChange={onCameraChange}>
        <SelectTrigger className="w-14 h-8 bg-gradient-30 backdrop-blur-sm border-none ">
          <Camera className="h-4 w-4 text-white" />
        </SelectTrigger>
        <SelectContent>
          {cameras.map((camera) => (
            <SelectItem key={camera.deviceId} value={camera.deviceId}>
              {camera.label || `Camera ${camera.deviceId.slice(0, 8)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={selectedMicrophone} onValueChange={onMicrophoneChange}>
        <SelectTrigger className="w-14 h-10 bg-gradient-30 backdrop-blur-sm border-none ">
          <Mic className="h-4 w-4 text-white" />
        </SelectTrigger>
        <SelectContent>
          {microphones.map((mic) => (
            <SelectItem key={mic.deviceId} value={mic.deviceId}>
              {mic.label || `Microphone ${mic.deviceId.slice(0, 8)}`}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        size="sm"
        className="text-white  bg-gradient-30 backdrop-blur-xs p-2 h-8 w-8"
        onClick={onMuteToggle}
      >
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  )
}
