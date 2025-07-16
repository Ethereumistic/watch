
import { Button } from "@/components/ui/button"
import { Flag } from "lucide-react"

interface ReportProps {
  onReport: () => void;
}

export function Report({ onReport }: ReportProps) {
  return (
    <div className="absolute top-4 right-[51%] z-50">
      <Button
        size="sm"
        variant="outline"
        className="text-white hover:bg-red-500/20 bg-black/50 backdrop-blur-sm p-2 h-8 w-8"
        onClick={onReport}
      >
        <Flag className="h-4 w-4" />
      </Button>
    </div>
  )
}
