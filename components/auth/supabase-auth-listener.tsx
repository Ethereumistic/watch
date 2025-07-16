"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore, Profile } from "@/stores/use-auth-store"

export default function SupabaseAuthListener() {
  const supabase = createClient()
  // Get the profile object itself to listen for changes to its ID
  const { profile, setSession, setProfile, setLoading } = useAuthStore()

  // This is your existing useEffect that handles login/logout. It is unchanged.
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
          setProfile(profile as Profile)
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

  // FIX: This new useEffect listens for real-time profile updates (e.g., bans/warnings).
  useEffect(() => {
    // Only create a subscription if we have a logged-in user with a profile
    if (!profile?.id) return;

    // Create a Supabase channel that subscribes to changes on the current user's specific row
    const channel = supabase.channel(`profile-updates:${profile.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${profile.id}` // This ensures we only get updates for our own profile
        },
        (payload) => {
          console.log('Real-time profile update received!', payload.new);
          // When an update is pushed from the database, update the profile in our global store immediately.
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    // This cleanup function is crucial. It removes the channel subscription when the component unmounts
    // or when the user logs out (and the profile.id changes).
    return () => {
      supabase.removeChannel(channel);
    }
  }, [profile?.id, setProfile, supabase]); // This effect depends on the user's ID

  return null
}
