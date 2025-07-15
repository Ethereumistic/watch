"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/stores/use-auth-store"

export default function SupabaseAuthListener() {
  const supabase = createClient()
  const setSession = useAuthStore((state) => state.setSession)
  const setProfile = useAuthStore((state) => state.setProfile)
  const setLoading = useAuthStore((state) => state.setLoading)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      if (session?.user) {
        const { data: profile, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .single()

        if (error) {
          console.error("Error fetching profile:", error)
          setProfile(null)
        } else {
          setProfile(profile)
        }
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, setProfile, setLoading, supabase])

  return null
}
