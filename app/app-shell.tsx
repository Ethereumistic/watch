"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";
import { LogIn } from "@/components/auth/log-in";
import SupabaseAuthListener from "@/components/auth/supabase-auth-listener";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoginOpen, setLoginOpen] = useState(false);

  // Condition to show the navbar on all routes except '/watch' and '/moderation'
  const showNavbar = pathname !== "/watch" && !pathname.startsWith("/moderation");

  return (
    <>
      {showNavbar && <Navbar setLoginOpen={setLoginOpen} />}
      <main>{children}</main>
      <LogIn open={isLoginOpen} onOpenChange={setLoginOpen} />
      <SupabaseAuthListener />
    </>
  );
}