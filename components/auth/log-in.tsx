"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Chrome } from "lucide-react"

export function LogIn({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const supabase = createClient()

  const handleEmailSignIn = async () => {
    setMessage("")
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error("Error signing in:", error)
      setMessage(error.message)
    } else {
      onOpenChange(false)
    }
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl bg-gray-900 text-white border-t-gray-800">
        <SheetHeader className="text-center pb-6">
          <SheetTitle className="text-2xl font-bold">Welcome Back</SheetTitle>
          <SheetDescription className="text-gray-400">Sign in to your yea.cool account</SheetDescription>
        </SheetHeader>
        <div className="max-w-md mx-auto space-y-6">
          <div className="space-y-4">
            <Button onClick={handleGoogleSignIn} variant="outline" className="w-full h-12 bg-gray-800 hover:bg-gray-700 border-gray-700">
              <Chrome className="w-5 h-5 mr-3" />
              Continue with Google
            </Button>

            <div className="flex items-center">
              <Separator className="flex-1 bg-gray-700" />
              <span className="px-4 text-xs text-gray-500">OR</span>
              <Separator className="flex-1 bg-gray-700" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="your@email.com" className="h-12 bg-gray-800 border-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" placeholder="Enter your password" className="h-12 bg-gray-800 border-gray-700" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleEmailSignIn} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg">
              Sign In
            </Button>
            {message && <p className="text-center text-sm text-red-400">{message}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
