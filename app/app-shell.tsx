"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { LogIn } from "@/components/auth/log-in";
import { SupabaseAuthListener } from "@/components/auth/supabase-auth-listener";
import { AuthStoreInitializer } from "@/components/auth/auth-store-initializer"; // Import the initializer
import { Session } from "@supabase/supabase-js";
import { Profile } from "@/stores/use-auth-store";

export function AppShell({ 
  children,
  session,
  profile,
}: { 
  children: React.ReactNode,
  session: Session | null,
  profile: Profile | null,
}) {
  const pathname = usePathname();
  const [isLoginOpen, setLoginOpen] = useState(false);

  const showNavbar = pathname !== "/watch" && !pathname.startsWith("/moderation");

  return (
    <>
      {/* The initializer runs first, setting the store's state synchronously */}
      <AuthStoreInitializer session={session} profile={profile} />
      
      {showNavbar && <Navbar setLoginOpen={setLoginOpen} />}
      <main>{children}</main>
      <LogIn open={isLoginOpen} onOpenChange={setLoginOpen} />

      {/* The listener is now only for LIVE updates after the initial load */}
      <SupabaseAuthListener />
    </>
  );
}