"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"

export function LogIn({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleSignIn = async () => {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error signing in:", error)
      // Handle error appropriately
    } else {
      onOpenChange(false)
      // Handle successful sign in
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="lg"
          className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-full backdrop-blur-sm bg-transparent"
        >
          Sign In
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
        <SheetHeader className="text-center pb-6">
          <SheetTitle className="text-2xl font-bold">Welcome Back</SheetTitle>
          <SheetDescription>Sign in to your watch.fun account</SheetDescription>
        </SheetHeader>
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="your@email.com" className="h-12" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" placeholder="Enter your password" className="h-12" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleSignIn} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg">
              Sign In
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
