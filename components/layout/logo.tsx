
import { cn } from "@/lib/utils"

interface LogoProps {
  className?: string
}

export function Logo({ className }: LogoProps) {
  return (
    <div className={cn("flex items-center space-x-2 z-50", className)}>
      <span className="text-3xl">👀</span>
      <span className="text-xl text-white font-bold">watch.fun</span>
    </div>
  )
}