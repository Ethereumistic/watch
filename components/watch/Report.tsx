
import { Button } from "@/components/ui/button"
import { Flag } from "lucide-react"

interface ReportProps {
  onReport: () => void;
}

export function Report({ onReport }: ReportProps) {
  return (
    <div className="absolute top-2 right-2 z-[5001]">
      <Button
        size="sm"
        
        className="text-white hover:bg-red-500/40 bg-red-500/30 backdrop-blur-sm shadow p-2 h-8 w-8"
        onClick={onReport}
      >
        <Flag className="h-4 w-4" />
      </Button>
    </div>
  )
}
