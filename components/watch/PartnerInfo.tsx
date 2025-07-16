"use client"

import { Profile } from "@/stores/use-auth-store"
import { calculateAge } from "@/lib/utils"
import { User, Cake, VenetianMask, Info, ChevronRight } from "lucide-react"
import { useEffect, useState } from "react"

interface PartnerInfoProps {
  profile: Omit<Profile, "id"> | null
}

export function PartnerInfo({ profile }: PartnerInfoProps) {
  const [isInitiallyHidden, setInitiallyHidden] = useState(false)

  useEffect(() => {
    if (profile) {
      setInitiallyHidden(false)
      const timer = setTimeout(() => {
        setInitiallyHidden(true)
      }, 7000)

      return () => clearTimeout(timer)
    }
  }, [profile])

  if (!profile) {
    return null
  }

  const age = calculateAge(profile.dob)

  return (
    <div className="group absolute lg:bottom-4 bottom-[91%] left-4 z-10">
      <div
        className={`absolute left-0 z-20 rounded-md bg-black/50 p-2 text-white shadow-lg backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-0 ${
          isInitiallyHidden ? "opacity-100 -translate-x-6" : "pointer-events-none opacity-0"
        }`}
        aria-label="Partner info"
      >
        <ChevronRight size={24} />
      </div>

      <div
        className={`z-10 rounded-lg bg-black/50 p-3 text-white shadow-lg backdrop-blur-sm transition-all duration-500 ease-in-out group-hover:translate-x-0 group-hover:opacity-100 group-hover:pointer-events-auto ${
          !isInitiallyHidden
            ? "translate-x-0 opacity-100"
            : "-translate-x-full opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          {/* You can add an avatar here later if you want */}
          {/* <Avatar>
            <AvatarImage src={profile.avatar_url} />
            <AvatarFallback>??</AvatarFallback>
          </Avatar> */}
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
