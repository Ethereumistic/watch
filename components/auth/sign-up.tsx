"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { createClient } from "@/lib/supabase/client"
import { Play, Chrome } from "lucide-react"

export function SignUp() {
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")

  const supabase = createClient()

  const handleEmailSignUp = async () => {
    setMessage("")
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    })

    if (error) {
      console.error("Error signing up:", error)
      setMessage(error.message)
    } else {
      setMessage("Check your email for a verification link!")
    }
  }

  const handleGoogleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
        // These are the scopes needed to request gender and birthday from Google.
        scopes: "https://www.googleapis.com/auth/user.birthday.read https://www.googleapis.com/auth/user.gender.read",
      },
    })
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          size="lg"
          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        >
          <Play className="w-5 h-5 mr-2" />
          Start Watching
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl bg-gray-900 text-white border-t-gray-800">
        <SheetHeader className="text-center pb-6">
          <SheetTitle className="text-2xl font-bold">Join yea.cool</SheetTitle>
          <SheetDescription className="text-gray-400">Create your account to start connecting with people worldwide</SheetDescription>
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
              <Label htmlFor="signup-email">Email</Label>
              <Input id="signup-email" type="email" placeholder="your@email.com" className="h-12 bg-gray-800 border-gray-700" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <Input
                id="signup-password"
                type="password"
                placeholder="Create a strong password"
                className="h-12 bg-gray-800 border-gray-700"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button onClick={handleEmailSignUp} className="w-full h-12 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg">
              Create Account
            </Button>
            {message && <p className="text-center text-sm text-green-400">{message}</p>}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
