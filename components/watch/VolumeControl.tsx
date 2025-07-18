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
    <div className={cn("absolute bottom-2 right-2 lg:left-2   flex justify-between items-center pointer-events-auto", className)}>
      <div className="group flex items-center backdrop-blur-sm rounded-lg ">
        <Button
          size="sm"
          className="text-white bg-gradient-30 h-8 w-8 "
          onClick={onMuteToggle}
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
        <div className="w-0 group-hover:px-2  group-hover:w-48 opacity-0 group-hover:opacity-100 transition-all duration-300">
          <Slider
            value={[volume]}
            onValueChange={handleSliderChange}
            max={100}
            step={1}
          />
        </div>
      </div>


    </div>

    </div>
  )
}
