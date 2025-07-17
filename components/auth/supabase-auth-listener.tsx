"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore, Profile } from "@/stores/use-auth-store"

export default function SupabaseAuthListener() { // No longer needs serverAccessToken
  const supabase = createClient()
  const { setSession, fetchUserProfile, profile, setProfile } = useAuthStore()
  const currentUserId = profile?.id

  useEffect(() => {
    // Handles live auth changes (login, logout in another tab).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        // If a new user logs in or the session changes for the current user, re-fetch the profile.
        if (event === "SIGNED_IN" && session?.user) {
          await fetchUserProfile(session.user);
        }
        // If the user signs out, the store's session will be set to null.
        if (event === "SIGNED_OUT") {
          setProfile(null);
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, fetchUserProfile, setProfile, supabase])

  // Real-time profile updates listener remains the same
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase.channel(`profile-updates:${currentUserId}`)
      .on<Profile>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUserId}` },
        (payload) => {
          setProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [currentUserId, setProfile, supabase]);

  return null
}