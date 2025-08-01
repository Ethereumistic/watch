"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, Crown, Star, Shield, Sparkles } from "lucide-react"
import { Profile, useAuthStore } from "@/stores/use-auth-store"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"

const useCountdown = (targetDate: string | null | undefined) => {
  const [countDown, setCountDown] = useState<number | null>(null);

  useEffect(() => {
    if (!targetDate) {
      setCountDown(null);
      return;
    }

    const countDownDate = new Date(targetDate).getTime();
    
    const updateCountdown = () => {
        const remaining = countDownDate - new Date().getTime();
        setCountDown(remaining > 0 ? remaining : 0);
    }

    updateCountdown(); // Initial set
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [targetDate]);

  if (countDown === null || countDown <= 0) return null;

  const hours = Math.floor((countDown % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((countDown % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((countDown % (1000 * 60)) / 1000);

  return {
    hours: String(hours).padStart(2, "0"),
    minutes: String(minutes).padStart(2, "0"),
    seconds: String(seconds).padStart(2, "0"),
  };
};

interface SubscriptionStatusProps {
  profile: Profile
  onSubscriptionChange: (newProfile: Profile) => void;
}

export function SubscriptionStatus({ profile, onSubscriptionChange }: SubscriptionStatusProps) {
  const supabase = createClient()
  const { user } = useAuthStore()
  const [isActivating, setIsActivating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const boostCountdown = useCountdown(profile.boost_until)

  const handleActivateBoost = async () => {
    if (!user) return
    setIsActivating(true)
    setError(null)
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc("activate_boost", { user_id_input: user.id })
      if (rpcError) throw rpcError

      if (rpcData.success) {
        // After successful activation, fetch the updated profile to refresh the state
        const { data: updatedProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        if (profileError) throw profileError;

        if (updatedProfile) {
          onSubscriptionChange(updatedProfile);
        }

      } else {
        throw new Error(rpcData.message || "Failed to activate boost.")
      }
    } catch (err: any) {
      console.error("Error activating boost:", err)
      setError(err.message || "An unexpected error occurred.")
    } finally {
      setIsActivating(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
  }

  // Render based on role priority
  if (profile.role === "admin" || profile.role === "mod") {
    return (
      <Card className="bg-gradient-to-br from-gray-700 to-gray-900 text-white border-gray-600">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
          </CardTitle>
          <CardDescription className="text-white/80">You have administrative privileges.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (profile.role === "vip") {
    return (
      <Card className="bg-gradient-to-br from-yellow-400 via-purple-500 to-pink-500 text-white border-yellow-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" /> VIP Member
          </CardTitle>
          <CardDescription className="text-white/80">You have unlocked all features.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm">Next payment on:</p>
          <p className="font-bold">{formatDate(profile.vip_until)}</p>
        </CardContent>
      </Card>
    )
  }

  if (profile.role === "boost" && boostCountdown) {
    return (
      <Card className="bg-gradient-to-br from-purple-500 to-pink-500 text-white border-purple-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" /> Boost Active
          </CardTitle>
          <CardDescription className="text-white/80">You have enhanced features enabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <p className="text-sm">Expires in:</p>
            <p className="text-2xl font-bold tracking-widest">
              {boostCountdown.hours}:{boostCountdown.minutes}:{boostCountdown.seconds}
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (profile.role === "free" && profile.boosts && profile.boosts > 0) {
    return (
      <Card className="bg-white/10 backdrop-blur-sm border border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" /> You have a Boost!
          </CardTitle>
          <CardDescription className="text-white/80">
            You have {profile.boosts} boost{profile.boosts > 1 ? "s" : ""} available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">Activate a 1-hour boost to get premium features like gender filtering and priority matching.</p>
          <Button
            onClick={handleActivateBoost}
            disabled={isActivating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all"
          >
            {isActivating ? "Activating..." : <><Zap className="h-4 w-4 mr-2" />Activate Boost</>}
          </Button>
          {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
        </CardContent>
      </Card>
    )
  }

  // Default: Free user with no boosts
  return (
    <Card className="bg-white/10 backdrop-blur-sm border border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" /> Free Plan
        </CardTitle>
        <CardDescription className="text-white/80">You are on the free plan.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm mb-4">Upgrade to unlock more features like gender filtering, priority matching, and an ad-free experience.</p>
        <Button variant="gradient" asChild className="w-full  text-white">
          <Link href="/subscription">View Plans</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
