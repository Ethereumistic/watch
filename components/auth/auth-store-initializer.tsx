"use client";

import { useRef } from "react";
import { useAuthStore, Profile } from "@/stores/use-auth-store";
import { Session } from "@supabase/supabase-js";

interface AuthStoreInitializerProps {
  session: Session | null;
  profile: Profile | null;
}

export function AuthStoreInitializer({ session, profile }: AuthStoreInitializerProps) {
  const initialized = useRef(false);

  // This ensures the state is set only once on the initial client load.
  if (!initialized.current) {
    useAuthStore.setState({ session, profile, user: session?.user ?? null });
    initialized.current = true;
  }

  return null; // This component renders nothing.
}