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
import { useAuthStore, Profile } from "@/stores/use-auth-store"
import { createClient } from "@/lib/supabase/client"

interface Interest {
  id: number
  name: string
  emoji: string
}

export default function AccountPage() {
  const { user, profile: initialProfile, loading: authLoading } = useAuthStore()
  const [activeTab, setActiveTab] = useState("account")
  const [profile, setProfile] = useState<Profile | null>(initialProfile)
  const [interests, setInterests] = useState<Interest[]>([])
  const [selectedInterests, setSelectedInterests] = useState<number[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  useEffect(() => {
    setProfile(initialProfile)
  }, [initialProfile])

  useEffect(() => {
    const fetchInterests = async () => {
      if (!user) return

      setIsLoading(true)
      const { data: interestsData, error: interestsError } = await supabase
        .from("interests")
        .select("*")

      if (interestsError) {
        console.error("Error fetching interests:", interestsError)
      } else {
        setInterests(interestsData || [])
      }

      const { data: selectedInterestsData, error: selectedInterestsError } = await supabase
        .from("profile_interests")
        .select("interest_id")
        .eq("profile_id", user.id)

      if (selectedInterestsError) {
        console.error("Error fetching selected interests:", selectedInterestsError)
      } else {
        setSelectedInterests(selectedInterestsData.map((i) => i.interest_id))
      }
      setIsLoading(false)
    }

    fetchInterests()
  }, [user, supabase])

  useEffect(() => {
    const updateUserCountry = async () => {
      if (profile && !profile.country) {
        if (user) {
          try {
            const { data, error } = await supabase.functions.invoke('update-country', {
              body: { userId: user.id },
            });

            if (error) throw error;

            setProfile((prevProfile) => {
              if (!prevProfile) return null;
              return { ...prevProfile, country: data.country };
            });

          } catch (error) {
            console.error('Error updating country:', error);
          }
        }
      }
    };

    updateUserCountry();
  }, [profile, user, supabase]);


  const getInitials = (username: string | null, email: string | undefined) => {
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
    if (!file) return;

    const reader = new FileReader()
    reader.onload = (e) => {
      const newAvatarUrl = e.target?.result as string
      setProfile((prevProfile) => {
        if (!prevProfile) return null; // FIX: Guard against null state
        return { ...prevProfile, avatar_url: newAvatarUrl };
      });
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    setIsLoading(true)

    if (user && profile) {
      // NOTE: This assumes `avatar_url` is a text field that can store a base64 string.
      // For a production app, you should upload the file to Supabase Storage and save the URL.
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
      }

      const { error: interestError } = await supabase
        .from("profile_interests")
        .delete()
        .eq("profile_id", user.id)

      if (interestError) console.error("Error clearing interests:", interestError)
      

      if (selectedInterests.length > 0) {
        const { error: newInterestError } = await supabase
          .from("profile_interests")
          .insert(
            selectedInterests.map((interest_id) => ({
              profile_id: user.id,
              interest_id,
            }))
          )

        if (newInterestError) console.error("Error adding new interests:", newInterestError)
      }
    }
    setIsLoading(false)
  }

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center">
        <p className="text-red-500">Could not load profile. You might not be logged in.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-8">
      <div className="mt-12 max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-white/80">Manage your account settings and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-4 bg-white/10 backdrop-blur-sm border border-white/20">
              <CardContent className="p-0">
                <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="w-full">
                  <TabsList className="grid w-full grid-rows-4 h-auto bg-transparent p-1">
                    <TabsTrigger value="account" className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"><User className="h-4 w-4" />Account</TabsTrigger>
                    <TabsTrigger value="settings" className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"><Settings className="h-4 w-4" />Settings</TabsTrigger>
                    <TabsTrigger value="subscription" className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"><CreditCard className="h-4 w-4" />Subscription</TabsTrigger>
                    <TabsTrigger value="privacy" className="w-full justify-start gap-3 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/80 hover:text-white"><Shield className="h-4 w-4" />Privacy</TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
              <TabsContent value="account" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white"><User className="h-5 w-5" />Profile Information</CardTitle>
                      <CardDescription className="text-white/80">Update your personal information and profile picture</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center gap-6">
                        <div className="relative">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={profile.avatar_url || "/placeholder.svg"} alt="Profile picture" />
                            <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {getInitials(profile.username, user?.email)}
                            </AvatarFallback>
                          </Avatar>
                          <Button
                            size="sm"
                            className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                            onClick={() => fileInputRef.current?.click()}
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
                          <p className="text-sm text-white/80">{user?.email}</p>
                          {profile.dob && (
                            <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">
                              {calculateAge(profile.dob)} years old
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Separator className="bg-white/20" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-white/80">Username</Label>
                          <Input
                            id="username"
                            value={profile.username || ''}
                            onChange={(e) => {
                                const newUsername = e.target.value;
                                setProfile((prev) => {
                                    if (!prev) return null;
                                    return { ...prev, username: newUsername };
                                });
                            }}
                            placeholder="Enter your username"
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="dob" className="text-white/80">Date of Birth</Label>
                          <Input
                            id="dob"
                            type="date"
                            value={profile.dob || ''}
                            onChange={(e) => {
                                const newDob = e.target.value;
                                setProfile((prev) => {
                                    if (!prev) return null;
                                    return { ...prev, dob: newDob };
                                });
                            }}
                            className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="gender" className="text-white/80">Gender</Label>
                          <Select
                            value={profile.gender || ''}
                            onValueChange={(value: "male" | "female" | "couple") =>
                                setProfile((prev) => {
                                    if (!prev) return null;
                                    return { ...prev, gender: value };
                                })
                            }
                          >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white placeholder:text-white/60">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                            <SelectContent className="bg-gray-800 border-gray-700 text-white">
                              <SelectItem value="male">Male</SelectItem>
                              <SelectItem value="female">Female</SelectItem>
                              <SelectItem value="couple">Couple</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-white/80">Country</Label>
                          <div className="relative">
                            <Input id="country" value={profile.country || ''} disabled className="bg-white/5 border-white/10 text-white cursor-not-allowed"/>
                            <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
                          </div>
                          <p className="text-xs text-white/60">Automatically detected from your IP address</p>
                        </div>
                      </div>

                      <Separator className="bg-white/20" />

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-white"><Heart className="h-4 w-4" />Interests</h4>
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

                      <div className="space-y-4">
                        <h4 className="font-semibold flex items-center gap-2 text-white"><Clock className="h-4 w-4" />Account Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-white/80"><Calendar className="h-4 w-4" /><span>Created: {profile.created_at ? formatDate(profile.created_at) : 'N/A'}</span></div>
                          <div className="flex items-center gap-2 text-white/80"><Clock className="h-4 w-4" /><span>Last updated: {profile.updated_at ? formatDate(profile.updated_at) : 'N/A'}</span></div>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={isLoading} className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                          {isLoading ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>) : (<><Save className="h-4 w-4 mr-2" />Save Changes</>)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white"><Settings className="h-5 w-5" />General Settings</CardTitle>
                      <CardDescription className="text-white/80">Configure your app preferences and notifications</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-white/80">Email Notifications</Label><p className="text-sm text-white/60">Receive email updates about your account</p></div><Switch /></div>
                      <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-white/80">Push Notifications</Label><p className="text-sm text-white/60">Get notified about new matches</p></div><Switch defaultChecked /></div>
                      <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-white/80">Sound Effects</Label><p className="text-sm text-white/60">Play sounds during video calls</p></div><Switch defaultChecked /></div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="subscription" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white"><CreditCard className="h-5 w-5" />Subscription Plan</CardTitle>
                      <CardDescription className="text-white/80">Manage your subscription and billing information</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="p-4 border rounded-lg bg-white/5 border-white/10"><div className="flex items-center justify-between mb-4"><div><h3 className="font-semibold text-white">Free Plan</h3><p className="text-sm text-white/80">Basic features included</p></div><Badge className="bg-white/20 text-white border-white/30">Current Plan</Badge></div><ul className="text-sm space-y-1 text-white/60"><li>• 10 matches per day</li><li>• Basic chat features</li><li>• Standard video quality</li></ul></div>
                      <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">Upgrade to Premium</Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="privacy" className="mt-0">
                <div className="space-y-6">
                  <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-white"><Shield className="h-5 w-5" />Privacy & Security</CardTitle>
                      <CardDescription className="text-white/80">Control your privacy settings and data sharing</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-white/80">Profile Visibility</Label><p className="text-sm text-white/60">Make your profile visible to other users</p></div><Switch /></div>
                      <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-white/80">Location Sharing</Label><p className="text-sm text-white/60">Share your location for better matches</p></div><Switch /></div>
                      <div className="flex items-center justify-between"><div className="space-y-0.5"><Label className="text-white/80">Data Analytics</Label><p className="text-sm text-white/60">Help improve our service with usage data</p></div><Switch defaultChecked /></div>
                      <Separator className="bg-white/20" />
                      <div className="space-y-4"><h4 className="font-semibold text-red-400">Danger Zone</h4><Button variant="destructive" className="w-full bg-red-600 hover:bg-red-700 text-white">Delete Account</Button></div>
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
