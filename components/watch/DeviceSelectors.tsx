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
    <div className={cn("absolute bottom-4 left-4 flex items-center space-x-2 pointer-events-auto", className)}>
      <Select value={selectedCamera} onValueChange={onCameraChange}>
        <SelectTrigger className="w-14 h-8 bg-black/50 backdrop-blur-sm border-none text-white">
          <Camera className="h-4 w-4" />
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
        <SelectTrigger className="w-14 h-10 bg-black/50 backdrop-blur-sm border-none text-white">
          <Mic className="h-4 w-4" />
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
        variant="outline"
        className="text-white hover:bg-white/20 bg-black/50 backdrop-blur-sm p-2 h-8 w-8"
        onClick={onMuteToggle}
      >
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>
    </div>
  )
}
