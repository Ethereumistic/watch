"use client"

import { Profile } from "@/stores/use-auth-store"
import { calculateAge } from "@/lib/utils"
import { User, Cake, VenetianMask, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

interface PartnerInfoProps {
  profile: Omit<Profile, "id"> | null
  partnerId: string | null
}

export function PartnerInfo({ profile, partnerId }: PartnerInfoProps) {
  const [isInfoVisible, setInfoVisible] = useState(false)

  // This effect correctly controls the visibility of the info card.
  // It triggers only when the partner connection state changes.
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
  if (!partnerId || !profile) {
    return null
  }

  const age = calculateAge(profile.dob)

  return (
    <div className="absolute top-4 left-0 lg:top-4 z-[5001]">
      <button
        onClick={() => setInfoVisible(!isInfoVisible)}
        className={`absolute left-0 top-0 z-20 rounded-tr-full rounded-br-full 
                   p-1 text-white 
                    transition-colors duration-900 
                    ${isInfoVisible ? 'bg-transparent' : 'bg-gradient-30 shadow-lg backdrop-blur-sm'}`}
        aria-label="Toggle partner info"
      >
        <ChevronRight size={24} className={`transition-transform duration-300 ${isInfoVisible ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      <div
        className={`z-10 rounded-tr-lg rounded-br-lg bg-gradient-30 p-3 pl-10 text-white text-shadow-lg shadow-lg backdrop-blur-xs transition-all duration-500 ease-in-out ${
          isInfoVisible
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <div>
            <h3 className="flex items-center gap-2 font-bold">
              <User size={16} />
              <span>{profile.username || "Stranger"}</span>
            </h3>
            <div className="mt-1 flex items-center gap-4 text-sm text-gray-300">
              {age > 0 && (
                <span className="flex items-center gap-1">
                  <Cake size={14} />
                  {age}
                </span>
              )}
              {profile.gender && (
                <span className="flex items-center gap-1 capitalize">
                  <VenetianMask size={14} />
                  {profile.gender}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
