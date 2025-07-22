"use client"

import { useEffect, useRef, useCallback } from "react"
import { useAuthStore } from "@/stores/use-auth-store"
import { createClient } from "@/lib/supabase/client"

export function SupabaseAuthListener({ serverSession }: { serverSession: any }) {
  const { setSession, setProfile } = useAuthStore()
  const supabase = createClient()
  const countryUpdatedSessionId = useRef<string | null>(null);

  // This function calls the 'update-country' edge function to reliably update
  // the user's country and IP address based on the request headers.
  const updateUserCountryAndIp = useCallback(async (userId: string) => {
    try {
      console.log(`Invoking 'update-country' for user: ${userId}`);
      const { error } = await supabase.functions.invoke('update-country', {
        body: { userId },
      });
      if (error) {
        throw error;
      }
      console.log(`Successfully invoked 'update-country' for user: ${userId}`);
    } catch (error) {
      console.error("Error updating user country and IP:", error);
    }
  }, [supabase]);

  useEffect(() => {
    // This runs once on mount. If we have a server session, we set it in the
    // store and trigger the country update.
    if (serverSession && countryUpdatedSessionId.current !== serverSession.user.id) {
      setSession(serverSession);
      updateUserCountryAndIp(serverSession.user.id);
      countryUpdatedSessionId.current = serverSession.user.id;
    }

    // We listen for auth changes.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      
      // On a new sign-in, we update the country. We use a ref to prevent
      // this from running on every auth event for the same session (e.g., token refresh).
      if (event === "SIGNED_IN" && session && countryUpdatedSessionId.current !== session.user.id) {
        updateUserCountryAndIp(session.user.id);
        countryUpdatedSessionId.current = session.user.id;
      }

      // If the user signs out, we clear the profile and reset our tracking ref.
      if (event === "SIGNED_OUT") {
        setProfile(null);
        countryUpdatedSessionId.current = null;
      }
    });

    // Cleanup the subscription on unmount.
    return () => {
      subscription.unsubscribe();
    };
  }, [serverSession, setSession, setProfile, supabase.auth, updateUserCountryAndIp]);

  return null
}
