"use client"

import { Profile } from "@/stores/use-auth-store"
import { calculateAge } from "@/lib/utils"
import { User, Cake, VenetianMask, ChevronRight, Info } from "lucide-react"
import { useEffect, useState } from "react"

interface PartnerInfoProps {
  profile: Omit<Profile, "id"> | null
}

export function PartnerInfo({ profile }: PartnerInfoProps) {
  const [isInfoVisible, setInfoVisible] = useState(true)

  // This effect controls the visibility of the info card.
  // When a new partner connects, it shows the card for 7 seconds, then hides it.
  useEffect(() => {
    if (profile) {
      setInfoVisible(true)
      const timer = setTimeout(() => {
        setInfoVisible(false)
      }, 7000)

      return () => clearTimeout(timer)
    } else {
      setInfoVisible(false) // Ensure it's hidden when there's no partner
    }
  }, [profile])

  if (!profile) {
    return null
  }

  const age = calculateAge(profile.dob)

  return (
    // Repositioned for mobile using `top-4` and kept `lg:bottom-4` for desktop.
    // Removed the `group` class as we are no longer using hover.
    <div className="absolute top-2 left-0 lg:top-15 z-10">
      {/* This button is always visible and toggles the info card on click/tap. */}
      <button
        onClick={() => setInfoVisible(!isInfoVisible)}
        className={`absolute left-0 top-0 z-20 rounded-tr-full rounded-br-full 
                   p-1 text-white 
                    transition-colors duration-900 
                    ${isInfoVisible ? 'bg-transparent  ' : 'bg-gradient-30 shadow-lg backdrop-blur-sm'}`}
        aria-label="Toggle partner info"
      >
        {/* The chevron rotates to provide visual feedback of the card's state. */}
        <ChevronRight size={24} className={`transition-transform duration-300 ${isInfoVisible ? 'rotate-180' : 'rotate-0'}`} />
      </button>

      {/* The main info card's visibility is now controlled by the `isInfoVisible` state. */}
      <div
        className={`z-10  rounded-tr-lg rounded-br-lg bg-gradient-30 p-3 pl-10 text-white text-shadow-lg shadow-lg backdrop-blur-xs transition-all duration-500 ease-in-out ${
          isInfoVisible
            ? "translate-x-0 opacity-100 "
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
              {age && (
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
