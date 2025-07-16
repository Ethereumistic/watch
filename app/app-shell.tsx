"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";
import { Navbar } from "@/components/layout/navbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isLoginOpen, setLoginOpen] = useState(false);

  // Condition to show the navbar on all routes except '/watch' and '/moderation'
  const showNavbar = pathname !== "/watch" && !pathname.startsWith("/moderation");

  return (
    <>
      {showNavbar && <Navbar setLoginOpen={setLoginOpen} />}
      <main>{children}</main>
    </>
  );
}