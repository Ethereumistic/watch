"use client"

import { useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore, Profile } from "@/stores/use-auth-store"

export default function SupabaseAuthListener() {
  const supabase = createClient()
  const { setSession, fetchUserProfile, setProfile } = useAuthStore()

  // Real-time auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        // Get the most up-to-date profile from the store *inside* the callback
        // This avoids stale closures and ensures we are comparing against the current state.
        const currentProfile = useAuthStore.getState().profile;
        const newUserId = session?.user?.id;

        // Set the session on every auth event. This keeps the user object in sync.
        setSession(session);

        // If a new user has logged in (their ID is different from the current profile ID),
        // fetch their profile data.
        if (newUserId && newUserId !== currentProfile?.id) {
          await fetchUserProfile(session!.user);
        } 
        // If the session has become null, it means the user has signed out.
        // Clear the profile from the store.
        else if (!newUserId && currentProfile) {
          setProfile(null);
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [setSession, fetchUserProfile, setProfile, supabase])

  // Real-time profile updates listener (no changes needed here)
  useEffect(() => {
    const currentUserId = useAuthStore.getState().profile?.id;
    if (!currentUserId) return;

    const channel = supabase.channel(`profile-updates:${currentUserId}`)
      .on<Profile>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${currentUserId}` },
        (payload) => {
          // Use setProfile to update the store with the latest data from the database.
          setProfile(payload.new as Profile);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    }
  }, [setProfile, supabase]);

  return null
}