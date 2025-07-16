"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Volume2, VolumeX, Flag } from "lucide-react"
import { cn } from "@/lib/utils"

interface VolumeControlProps {
  volume: number
  isMuted: boolean
  onVolumeChange: (value: number) => void
  onMuteToggle: () => void
  className?: string
}

export function VolumeControl({ volume, isMuted, onVolumeChange, onMuteToggle, className }: VolumeControlProps) {
  const handleSliderChange = useCallback((value: number[]) => {
    onVolumeChange(value[0]);
  }, [onVolumeChange]);

  return (
    <div>
    <div className={cn("absolute bottom-2 right-2  flex justify-between items-center pointer-events-auto", className)}>
      <div className="group flex items-center space-x-2  backdrop-blur-sm rounded-lg p-2">
        <Button
          size="sm"
          variant="outline"
          className="text-white hover:bg-white/20 h-8 w-8 ml-2"
          onClick={onMuteToggle}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <div className="w-0  group-hover:w-48 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Slider
            value={[volume]}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
          />
        </div>
      </div>


    </div>

    <div className="absolute top-2 right-2 z-10">
      <Button
        size="sm"
        variant="outline"
        className="text-white hover:bg-red-500/20 bg-black/50 backdrop-blur-sm p-2 h-8 w-8"
      >
        <Flag className="h-4 w-4" />
      </Button>
      </div>
    </div>
  )
}
