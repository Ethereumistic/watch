"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { User, Settings, CreditCard, Shield, Camera, MapPin, Calendar, Clock, Save, Heart } from "lucide-react"

import { createClient } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  username: string | null
  email: string | undefined
  avatar_url: string | null
  dob: string | null
  gender: "male" | "female" | "non-binary" | "other" | "prefer_not_to_say" | null
  country: string | null
  created_at: string | null
  updated_at: string | null
}

interface Interest {
  id: number
  name: string
  emoji: string
}

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState("account")
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profileData, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()

        if (profileData) {
          setProfile({ ...profileData, email: user.email })
        } else {
          // Create a default profile for a new user
          setProfile({
            id: user.id,
            username: null,
            email: user.email,
            avatar_url: null,
            dob: null,
            gender: null,
            country: null,
            created_at: null,
            updated_at: null,
          })
        }

        // Fetch interests regardless of profile existence
        const { data: interestsData, error: interestsError } = await supabase
          .from("interests")
          .select("*")

        if (interestsError) {
          console.error("Error fetching interests:", interestsError)
        } else {
          setInterests(interestsData || [])
        }

        if (profileData) {
            const { data: selectedInterestsData, error: selectedInterestsError } = await supabase
              .from("profile_interests")
              .select("interest_id")
              .eq("profile_id", user.id)

            if (selectedInterestsError) {
              console.error("Error fetching selected interests:", selectedInterestsError)
            } else {
              setSelectedInterests(selectedInterestsData.map((i) => i.interest_id))
            }
        }

      } else {
          // Handle case where user is not logged in
          // Maybe redirect to login page
      }
      setIsLoading(false)
    }

    fetchData()
  }, [supabase])

  useEffect(() => {
    const updateUserCountry = async () => {
      // Only run if the profile is loaded and the country is not set
      if (profile && !profile.country) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const { data, error } = await supabase.functions.invoke('update-country', {
              body: { userId: user.id },
            });

            if (error) {
              throw error;
            }

            // Update the local state with the new country
            setProfile((prevProfile) => {
              if (prevProfile) {
                return { ...prevProfile, country: data.country };
              }
              return null;
            });

          } catch (error) {
            console.error('Error updating country:', error);
          }
        }
      }
    };

    updateUserCountry();
  }, [profile, supabase]);

  const getInitials = (username: string, email: string) => {
    if (username && username.length >= 2) {
      return username.slice(0, 2).toUpperCase()
    }
    if (email && email.length >= 2) {
      return email.slice(0, 2).toUpperCase()
    }
    return "U"
  }

  const calculateAge = (dob: string) => {
    const today = new Date()
    const birthDate = new Date(dob)
    let age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--
    }
    return age
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfile((prev) => ({
          ...prev,
          avatar_url: e.target?.result as string,
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setIsLoading(true)
    const { data: { user } } = await supabase.auth.getUser()

    if (user && profile) {
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          username: profile.username,
          dob: profile.dob,
          gender: profile.gender,
          avatar_url: profile.avatar_url,
          updated_at: new Date().toISOString(),
        })

      if (profileError) {
        console.error("Error upserting profile:", profileError)
      } else {
        // Refetch profile data to get the latest updated_at and created_at
        const { data: updatedProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
        if (fetchError) {
            console.error("Error refetching profile:", fetchError)
        } else if (updatedProfile) {
            setProfile({ ...updatedProfile, email: user.email });
        }
      }

      const { error: interestError } = await supabase
        .from("profile_interests")
        .delete()
        .eq("profile_id", user.id)

      if (interestError) {
        console.error("Error clearing interests:", interestError)
      }

      if (selectedInterests.length > 0) {
        const { error: newInterestError } = await supabase
          .from("profile_interests")
          .insert(
            selectedInterests.map((interest_id) => ({
              profile_id: user.id,
              interest_id,
            }))
          )

        if (newInterestError) {
          console.error("Error adding new interests:", newInterestError)
        }
      }
    }
    setIsLoading(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-red-500">Could not load profile. Please try again later.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-white/80">Manage your account settings and preferences</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Vertical Tabs */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4 bg-white/10 backdrop-blur-sm border border-white/20">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                  <TabsList className="grid w-full grid-rows-4 h-auto bg-transparent p-1">
                    <TabsTrigger
                      value="account"
                      className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"
                    >
                      <User className="h-4 w-4" />
                      Account
                    </TabsTrigger>
                    <TabsTrigger
                      value="settings"
                      className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </TabsTrigger>
                    <TabsTrigger
                      value="subscription"
                      className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"
                    >
                      <CreditCard className="h-4 w-4" />
                      Subscription
                    </TabsTrigger>
                    <TabsTrigger
                      value="privacy"
                      className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"
                    >
                      <Shield className="h-4 w-4" />
                      Privacy
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
              {/* Account Tab */}
              <TabsContent value="account" className="mt-0">
                <div className="space-y-6">
                  {/* Profile Header */}
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <User className="h-5 w-5" />
                        Profile Information
                      </CardTitle>
                      <CardDescription className="text-white/80">Update your personal information and profile picture</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {/* Avatar Section */}
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt="Profile picture" />
                            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {getInitials(profile.username || '', profile.email || '')}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="sm"
                            className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                          >
                            <Camera className="h-4 w-4" />
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-white">{profile.username || 'New User'}</h3>
                          <p className="text-sm text-white/80">{profile.email}</p>
                          {profile.dob && (
                            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
                              {calculateAge(profile.dob)} years old
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-white/20" />

                      {/* Form Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-white/80">Username</Label>
                          <Input
                            id="username"
                            value={profile?.username || ''}
                            onChange={(e) => setProfile((prev) => ({ ...prev, username: e.target.value }))}
                            placeholder="Enter your username"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dob" className="text-white/80">Date of Birth</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={profile?.dob || ''}
                            onChange={(e) => setProfile((prev) => ({ ...prev, dob: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender" className="text-white/80">Gender</Label>
                          <Select
                            value={profile?.gender || ''}
                            onValueChange={(value: "male" | "female" | "non-binary" | "other" | "prefer_not_to_say") =>
                              setProfile((prev) => ({ ...prev, gender: value }))
                            }
                          >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/60">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="non-binary">Non-binary</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-white/80">Country</Label>
                          <div className="relative">
                            <Input
                              id="country"
                              value={profile?.country || ''}
                              disabled
                              className="bg-white/5 border-white/10 text-white cursor-not-allowed"
                            />
                            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                          </div>
                          <p className="text-xs text-white/60">Automatically detected from your IP address</p>
                        </div>
                      </div>

                      <Separator className="bg-white/20" />

                      {/* Interests Section */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-white">
                          <Heart className="h-4 w-4" />
                          Interests
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {interests.map((interest) => (
                            <Badge
                              key={interest.id}
                              variant={selectedInterests.includes(interest.id) ? "default" : "secondary"}
                              onClick={() => {
                                const newSelectedInterests = selectedInterests.includes(interest.id)
                                  ? selectedInterests.filter((id) => id !== interest.id)
                                  : [...selectedInterests, interest.id]
                                setSelectedInterests(newSelectedInterests)
                              }}
                              className="cursor-pointer bg-white/20 text-white border-white/30 hover:bg-white/30"
                            >
                              {interest.emoji} {interest.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <Separator className="bg-white/20" />

                      {/* Account Info */}
                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-white">
                          <Clock className="h-4 w-4" />
                          Account Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-white/80">
                            <Calendar className="h-4 w-4" />
                            <span>Created: {profile.created_at ? formatDate(profile.created_at) : 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/80">
                            <Clock className="h-4 w-4" />
                            <span>Last updated: {profile.updated_at ? formatDate(profile.updated_at) : 'N/A'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Save Button */}
                      <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isLoading} className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                          {isLoading ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              Saving...
                            </>
                          ) : (
                            <>
                              <Save className="h-4 w-4 mr-2" />
                              Save Changes
                            </>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Settings Tab */}
              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Settings className="h-5 w-5" />
                        General Settings
                      </CardTitle>
                      <CardDescription className="text-white/80">Configure your app preferences and notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-white/80">Email Notifications</Label>
                          <p className="text-sm text-white/60">Receive email updates about your account</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-white/80">Push Notifications</Label>
                          <p className="text-sm text-white/60">Get notified about new matches</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-white/80">Sound Effects</Label>
                          <p className="text-sm text-white/60">Play sounds during video calls</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Subscription Tab */}
              <TabsContent value="subscription" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <CreditCard className="h-5 w-5" />
                        Subscription Plan
                      </CardTitle>
                      <CardDescription className="text-white/80">Manage your subscription and billing information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 border rounded-lg bg-white/5 border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-white">Free Plan</h3>
                            <p className="text-sm text-white/80">Basic features included</p>
                          </div>
                          <Badge className="bg-white/20 text-white border-white/30">Current Plan</Badge>
                        </div>
                        <ul className="text-sm space-y-1 text-white/60">
                          <li>• 10 matches per day</li>
                          <li>• Basic chat features</li>
                          <li>• Standard video quality</li>
                        </ul>
                      </div>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">Upgrade to Premium</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Privacy Tab */}
              <TabsContent value="privacy" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Shield className="h-5 w-5" />
                        Privacy & Security
                      </CardTitle>
                      <CardDescription className="text-white/80">Control your privacy settings and data sharing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-white/80">Profile Visibility</Label>
                          <p className="text-sm text-white/60">Make your profile visible to other users</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-white/80">Location Sharing</Label>
                          <p className="text-sm text-white/60">Share your location for better matches</p>
                        </div>
                        <Switch />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                          <Label className="text-white/80">Data Analytics</Label>
                          <p className="text-sm text-white/60">Help improve our service with usage data</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                      <Separator className="bg-white/20" />
                      <div className="space-y-4">
                        <h4 className="font-semibold text-red-400">Danger Zone</h4>
                        <Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">Delete Account</Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
