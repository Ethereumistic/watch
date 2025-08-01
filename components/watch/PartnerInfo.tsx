"use client"

import { useAuthStore } from "@/stores/use-auth-store"
import { calculateAge } from "@/lib/utils"
import {
  User,
  Cake,
  VenetianMask,
  ChevronRight,
  Globe,
  Crown,
} from "lucide-react"
import { useEffect, useState } from "react"

interface PartnerInfoProps {
  partnerId: string | null
}

export function PartnerInfo({ partnerId }: PartnerInfoProps) {
  const partnerProfile = useAuthStore((state) => state.partnerProfile)
  const [isInfoVisible, setInfoVisible] = useState(false)

  // This effect controls the visibility of the info card.
  // When a new partner connects, it shows for 7 seconds, then hides.
  useEffect(() => {
    if (partnerId) {
      setInfoVisible(true)
      const timer = setTimeout(() => {
        setInfoVisible(false)
      }, 7000)

      return () => clearTimeout(timer)
    } else {
      setInfoVisible(false) // Ensure it's hidden when there's no partner
    }
  }, [partnerId])

  // Render nothing if there is no partner or profile data.
  if (!partnerId || !partnerProfile) {
    return null
  }

  const age = partnerProfile.dob ? calculateAge(partnerProfile.dob) : null

  return (
    <div 
      className="absolute lg:top-16 top-4 left-0 z-10"

    >
      <div
        className={`absolute left-0 top-0 z-20 rounded-tr-full rounded-br-full 
                   p-1 text-white 
                   transition-colors duration-300 
                   ${isInfoVisible ? 'bg-transparent' : 'bg-gradient-30 shadow-lg backdrop-blur-sm'}`}
                   onMouseEnter={() => setInfoVisible(true)}
                   onMouseLeave={() => setInfoVisible(false)}
      >
        <ChevronRight size={24} className={`transition-transform duration-300 ${isInfoVisible ? 'rotate-180' : 'rotate-0'}`} />
      </div>

      <div
        className={`z-10 rounded-tr-lg rounded-br-lg bg-gradient-30 p-3 pl-10 text-white shadow-lg backdrop-blur-sm transition-all duration-500 ease-in-out ${
          isInfoVisible
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-bold">
              <User size={16} />
              <span>{partnerProfile.username || "Stranger"}</span>
              {partnerProfile.role === "vip" && partnerProfile.settings?.show_vip_badge && (
                <span className="ml-2 flex items-center gap-1 rounded-full bg-gradient-pink px-2 py-0.5 text-xs text-white">
                  <Crown size={12} />
                  VIP
                </span>
              )}
            </h3>
            <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-gray-300">
              {age && age > 0 && (
                <span className="flex items-center gap-1.5">
                  <Cake size={14} />
                  {age}
                </span>
              )}
              {partnerProfile.gender && (
                <span className="flex items-center gap-1.5 capitalize">
                  <VenetianMask size={14} />
                  {partnerProfile.gender}
                </span>
              )}
              {partnerProfile.country && (
                <span className="flex items-center gap-1.5">
                  <Globe size={14} />
                  {partnerProfile.country}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}