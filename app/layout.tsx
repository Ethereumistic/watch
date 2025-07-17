import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AppShell } from "./app-shell";
import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/stores/use-auth-store";
import { Session } from "@supabase/supabase-js";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "yea cool",
  description: "The future of social connection.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = createClient();

  // 1. Use the secure `getUser()` method to get an authenticated user.
  const { data: { user } } = await supabase.auth.getUser();
  
  // 2. We can still get the session for the initializer, as it's useful.
  const { data: { session } } = await supabase.auth.getSession();

  let profile: Profile | null = null;
  // 3. Fetch the profile only if we have a securely authenticated user.
  if (user) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    profile = profileData;
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppShell session={session} profile={profile}>
            {children}
          </AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}