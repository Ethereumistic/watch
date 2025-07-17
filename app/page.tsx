"use client"

import { SignUp } from "@/components/auth/sign-up"
import { Gamepad2, Globe, Heart, Star, Users, Zap, Play } from "lucide-react"
import { useAuthStore } from "@/stores/use-auth-store"
import Link from "next/link"
import { Button } from "@/components/ui/button"


export default function Page() {
  const { session } = useAuthStore()

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-60 h-60 bg-indigo-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse delay-500"></div>
      </div>



      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6 text-center">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Hero Section */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight">
              Connect, <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent"> Watch</span>, Match
              
            </h1>
            <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              The next generation of social connection. Meet new people, play mini-games together, and share interests
              in a safe, modern environment.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 my-12">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Smart Matching</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Gamepad2 className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Mini Games</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Heart className="w-8 h-8 text-pink-400 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Interest Based</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
              <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
              <p className="text-white/80 text-sm">Instant Connect</p>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {session ? (
              <Link href="/watch">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 text-lg font-semibold rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Watching
                </Button>
              </Link>
            ) : (
              <SignUp />
            )}
          </div>

          {/* Stats */}
          <div className="flex justify-center items-center space-x-8 text-white/60 text-sm">
            <div className="flex items-center space-x-2">
              <Globe className="w-4 h-4" />
              <span>Global Community</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>Safe & Moderated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Instant Connection</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-8 text-white/60 text-sm">
        <p>&copy; 2024 watch.fun. The future of social connection.</p>
      </footer>
    </div>
  )
}
