"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X, User, Moon, Sun, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "next-themes"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useAuthStore } from "@/stores/use-auth-store"
import { createClient } from "@/lib/supabase/client"
import { ModeToggle } from "../ui/theme-switch"

interface NavbarProps {
  setLoginOpen: (isOpen: boolean) => void;
}

const getInitials = (name?: string | null, email?: string | null): string => {
  if (name) {
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  if (email) {
    return email.substring(0, 2).toUpperCase();
  }
  return "??";
};

export function Navbar({ setLoginOpen }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const { session, user, profile, setSession } = useAuthStore()
  const supabase = createClient()

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
  };

  const navItems: { label: string; href: string; disabled?: boolean }[] = [
    { label: "Connect", href: "/connect" },
    { label: "Watch", href: "/watch" },
    { label: "Match", href: "/match" },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === href
    }
    return pathname.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-50 w-full  bg-transparent backdrop-blur supports-[backdrop-filter]:bg-background/10">
      <div className="container flex h-16 items-center justify-between px-4 md:px-6">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
          <span className="text-3xl">👀</span>
          <span className="text-xl text-white font-bold">watch.fun</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.disabled ? "#" : item.href}
              className={`text-sm font-medium transition-colors hover:text-primary ${
                isActive(item.href) ? "text-primary" : "text-muted-foreground"
              } ${item.disabled ? "opacity-50 cursor-not-allowed hover:text-muted-foreground" : ""}`}
              onClick={(e) => item.disabled && e.preventDefault()}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          {/* Theme Toggle */}
          <ModeToggle />

          {/* User Menu / Sign In Button */}
          {session ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="w-9 px-0 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={profile?.avatar_url || "/placeholder.svg"} alt="Profile picture" />
                    <AvatarFallback>{getInitials(profile?.username, user?.email)}</AvatarFallback>
                  </Avatar>
                  <span className="sr-only">User menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{profile?.username || "New User"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              variant="gradient"
              size="sm"
              className=" "
              onClick={() => setLoginOpen(true)}
            >
              Sign In
            </Button>
          )}
        </div>

        {/* Mobile Menu Button */}
        <Button variant="ghost" size="sm" className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          <span className="sr-only">Toggle menu</span>
        </Button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container px-4 py-4 space-y-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.disabled ? "#" : item.href}
                className={`block text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                } ${item.disabled ? "opacity-50 cursor-not-allowed hover:text-muted-foreground" : ""}`}
                onClick={(e) => {
                  if (item.disabled) {
                    e.preventDefault()
                  } else {
                    setIsMobileMenuOpen(false)
                  }
                }}
              >
                {item.label}
              </Link>
            ))}

            {/* Mobile Theme Toggle */}
            <div className="pt-3 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Theme</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="w-9 px-0">
                      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Mobile User Menu */}
            {session ? (
              <div className="pt-3 border-t space-y-2">
                <Link
                  href="/account"
                  className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left w-full"
                  onClick={() => {
                    handleSignOut()
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-3 border-t space-y-2">
                <button
                  className="block text-sm font-medium text-muted-foreground hover:text-primary transition-colors text-left w-full"
                  onClick={() => {
                    setLoginOpen(true)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  Sign In
                </button>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}