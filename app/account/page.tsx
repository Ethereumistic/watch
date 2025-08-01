"use client"

import type React from "react"
import { useState, useRef, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { User, Settings, CreditCard, Shield, Camera, MapPin, Calendar, Clock, Save, Heart } from "lucide-react"
import { useAuthStore, Profile } from "@/stores/use-auth-store"
import { createClient } from "@/lib/supabase/client"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { SubscriptionStatus } from "@/components/account/SubscriptionStatus"
import { ALL_COUNTRIES, ALL_POSSIBLE_INTERESTS } from "@/lib/constants"

// We declare the shape of our profile object from the database
type ProfileWithInterests = Profile & {
  interests: string[] | null; // The DB ENUM array comes back as a string array
}

export default function AccountPage() {
  const { user, profile: globalProfile, setProfile: setGlobalProfile } = useAuthStore()

  const [activeTab, setActiveTab] = useState("account")
  
  const [editableProfile, setEditableProfile] = useState<ProfileWithInterests | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const userCountry = useMemo(() => {
    if (!editableProfile?.country) return null;
    return ALL_COUNTRIES.find(c => c.name === editableProfile.country);
  }, [editableProfile?.country]);

  const handleSubscriptionChange = (newProfile: Profile) => {
    setGlobalProfile(newProfile);
    setEditableProfile(newProfile as ProfileWithInterests);
    if (newProfile.interests) {
        setSelectedInterests(newProfile.interests);
    }
  };

  useEffect(() => {
    const globalProfileId = globalProfile?.id;
    
    if (globalProfile && (!editableProfile || editableProfile.id !== globalProfileId)) {
        setEditableProfile(globalProfile as ProfileWithInterests);
        setSelectedInterests(globalProfile.interests || []);
    }
  }, [globalProfile, editableProfile]);
  
  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (!user || !editableProfile) {
        throw new Error("User or profile not available for saving.");
      }
      
      const updatePayload = {
        username: editableProfile.username,
        dob: editableProfile.dob,
        gender: editableProfile.gender,
        updated_at: new Date().toISOString(),
        interests: selectedInterests,
      };

      const { data: updatedProfile, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq('id', user.id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setGlobalProfile(updatedProfile);
      setEditableProfile(updatedProfile as ProfileWithInterests);

    } catch (error) {
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (username: string | null, email: string | undefined) => {
    if (username && username.length >= 2) return username.slice(0, 2).toUpperCase()
    if (email && email.length >= 2) return email.slice(0, 2).toUpperCase()
    return "U"
  }

  const calculateAge = (dob: string | null | undefined) => {
    if (!dob) return 0;
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  }
  
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  if (!editableProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 md:p-8">
      <div className="mt-12 max-w-6xl mx-auto">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-white mb-1">Account Settings</h1>
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

            <div className="mt-6">
              <SubscriptionStatus profile={editableProfile} onSubscriptionChange={handleSubscriptionChange} />
            </div>
          </div>

          <div className="lg:col-span-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsContent value="account" className="mt-0">
                    <div className="space-y-6">
                      <Card className="bg-white/10 backdrop-blur-sm border border-white/20">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-white"><User className="h-5 w-5" />Profile Information</CardTitle>
                          <CardDescription className="text-white/80">Update your personal information and profile picture</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                            {/* --- Left Column: Avatar & Info --- */}
                            <div className="lg:col-span-1 flex flex-col items-center lg:items-start gap-4">
                                <div className="relative">
                                    <Avatar className="h-24 w-24">
                                        <AvatarImage src={editableProfile.avatar_url || ""} alt="Profile picture" />
                                        <AvatarFallback className="text-lg font-semibold bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                                        {getInitials(editableProfile.username, user?.email)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <Button size="sm" className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white" onClick={() => fileInputRef.current?.click()}>
                                        <Camera className="h-4 w-4" />
                                    </Button>
                                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"  />
                                </div>
                                <div className="text-center lg:text-left">
                                    <p className="text-sm text-white/80">{user?.email}</p>
                                    {editableProfile.dob && <Badge variant="secondary" className="mt-2 bg-white/20 text-white border-white/30">{calculateAge(editableProfile.dob)} years old</Badge>}
                                </div>
                            </div>
                            
                            {/* --- Right Column: Editable Fields --- */}
                            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label htmlFor="username" className="text-white/80">Username</Label>
                                    <Input id="username" value={editableProfile.username || ''} onChange={e => setEditableProfile(p => p ? { ...p, username: e.target.value } : null)} placeholder="Enter your username" className="bg-white/10 border-white/20 text-white placeholder:text-white/60" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dob" className="text-white/80">Date of Birth</Label>
                                    <Input id="dob" type="date" value={editableProfile.dob ? new Date(editableProfile.dob).toISOString().split('T')[0] : ''} onChange={e => setEditableProfile(p => p ? { ...p, dob: e.target.value } : null)} className="bg-white/10 border-white/20 text-white" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender" className="text-white/80">Gender</Label>
                                    <Select value={editableProfile.gender || ''} onValueChange={(value: 'male' | 'female' | 'couple') => setEditableProfile(p => p ? { ...p, gender: value } : null)}>
                                        <SelectTrigger className="bg-white/10 border-white/20 text-white">
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
                                    <div className="flex items-center gap-3 bg-white/5 border-white/10 text-white rounded-md h-10 px-3">
                                        {userCountry ? (
                                            <img
                                                src={`https://flagcdn.com/32x24/${userCountry.abbr}.png`}
                                                alt={userCountry.name}
                                                className="h-4 w-6 rounded-sm"
                                            />
                                        ) : (
                                            <MapPin className="h-4 w-4 text-white/60" />
                                        )}
                                        <span>{editableProfile.country || 'Detecting...'}</span>
                                    </div>
                                </div>
                            </div>
                          </div>
                          
                          <Separator className="bg-white/20" />

                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 text-white"><Heart className="h-4 w-4" />Interests</h4>
                            <ToggleGroup
                              type="multiple"
                              variant="outline"
                              value={selectedInterests}
                              onValueChange={(value) => setSelectedInterests(value)}
                              className="flex flex-wrap gap-2 justify-start"
                            >
                              {ALL_POSSIBLE_INTERESTS.map((interest) => (
                                <ToggleGroupItem 
                                  key={interest.name} 
                                  value={interest.name} 
                                  className="border-white/30 bg-white/10 text-white/80 hover:bg-white/20 hover:text-white data-[state=on]:bg-gradient-to-br from-purple-500 to-pink-500 data-[state=on]:text-white data-[state=on]:border-pink-500"
                                >
                                  {interest.emoji} <span className="ml-2">{interest.name}</span>
                                </ToggleGroupItem>
                              ))}
                            </ToggleGroup>
                          </div>

                          <Separator className="bg-white/20" />

                          <div className="space-y-4">
                            <h4 className="font-semibold flex items-center gap-2 text-white"><Clock className="h-4 w-4" />Account Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div className="flex items-center gap-2 text-white/80"><Calendar className="h-4 w-4" /><span>Created: {formatDate(editableProfile.created_at)}</span></div>
                              <div className="flex items-center gap-2 text-white/80"><Clock className="h-4 w-4" /><span>Last updated: {formatDate(editableProfile.updated_at)}</span></div>
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <Button 
                              onClick={handleSave} 
                              disabled={isSaving} 
                              className="px-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {isSaving ? (<><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Saving...</>) : (<><Save className="h-4 w-4 mr-2" />Save Changes</>)}
                            </Button>
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
  );
}