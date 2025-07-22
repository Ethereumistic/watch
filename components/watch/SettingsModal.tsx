"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuthStore } from "@/stores/use-auth-store"
import { Settings, Zap, Shield, Save, Gem, Filter } from "lucide-react"
import { ALL_POSSIBLE_INTERESTS, ALL_COUNTRIES } from "@/lib/constants"

// Define the structure for the settings state
interface UserSettingsState {
  privacy_mode: boolean;
  sound_effects: boolean;
  show_vip_badge: boolean;
  auto_roll: boolean;
  interest_max_wait_time: number;
  country_max_wait_time: number;
  interests: string[];
  preferred_countries: string[];
  preferred_gender: string;
}

interface SettingsModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSave: (settingsPayload: any) => void;
}

export function SettingsModal({ isOpen, onOpenChange, onSave }: SettingsModalProps) {
  const { profile } = useAuthStore();

  const [settings, setSettings] = React.useState<UserSettingsState>({
    privacy_mode: false,
    sound_effects: true,
    show_vip_badge: true,
    auto_roll: true,
    interest_max_wait_time: 30,
    country_max_wait_time: 30,
    interests: [],
    preferred_countries: [],
    preferred_gender: "any",
  });

  React.useEffect(() => {
    if (profile) {
      setSettings({
        privacy_mode: profile.settings?.privacy_mode ?? false,
        sound_effects: profile.settings?.sound_effects ?? true,
        show_vip_badge: profile.settings?.show_vip_badge ?? true,
        auto_roll: profile.settings?.auto_roll ?? true,
        interest_max_wait_time: profile.settings?.interest_max_wait_time ?? 30,
        country_max_wait_time: profile.settings?.country_max_wait_time ?? 30,
        interests: profile.interests ?? [],
        preferred_countries: profile.preferred_countries ?? [],
        preferred_gender: profile.preferred_gender?.[0] ?? "any",
      });
    }
  }, [profile]);

  const handleSettingChange = <K extends keyof UserSettingsState>(key: K, value: UserSettingsState[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSaveChanges = () => {
    const payload = {
      settings: {
        privacy_mode: settings.privacy_mode,
        sound_effects: settings.sound_effects,
        show_vip_badge: settings.show_vip_badge,
        auto_roll: settings.auto_roll,
        interest_max_wait_time: settings.interest_max_wait_time,
        country_max_wait_time: settings.country_max_wait_time,
      },
      interests: settings.interests,
      preferred_countries: settings.preferred_countries,
      // Backend expects an array for preferred_gender
      preferred_gender: settings.preferred_gender === 'any' ? [] : [settings.preferred_gender],
    };

    onSave(payload);
    onOpenChange(false); // Close modal on save
  };

  const canFilterByGender = profile && ['vip', 'boost', 'admin'].includes(profile.role);
  const isVip = profile?.role === 'vip';

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-black/30 backdrop-blur-xl border-gray-700 text-white max-w-2xl p-0 flex flex-col">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings className="h-6 w-6" /> Settings
          </DialogTitle>
        </DialogHeader>
        <div className="flex-grow px-6">
          <Tabs defaultValue="general" className="w-full flex flex-col h-full">
            <TabsList className="grid w-full grid-cols-3 bg-gray-900/50">
              <TabsTrigger value="general"><Shield className="h-4 w-4 mr-2" />General</TabsTrigger>
              <TabsTrigger value="matching"><Zap className="h-4 w-4 mr-2" />Matching</TabsTrigger>
              <TabsTrigger value="filters"><Filter className="h-4 w-4 mr-2" />Filters</TabsTrigger>
            </TabsList>

            <ScrollArea className="h-[400px] mt-4 pr-4">
              <TabsContent value="general">
                <div className="space-y-6 p-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg col-span-1">
                      <span className="font-semibold text-gray-300">Your Gender</span>
                      <span className="capitalize font-bold">{profile?.gender || 'Not set'}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg col-span-1">
                      <span className="font-semibold text-gray-300">Your Country</span>
                      <span className="font-bold">{profile?.country || 'Unknown'}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="privacy-mode" className="flex flex-col gap-1">
                      <span className="font-semibold">Privacy Mode</span>
                      <span className="text-xs text-gray-400">Hide your country and other personal info.</span>
                    </Label>
                    <Switch id="privacy-mode" checked={settings.privacy_mode} onCheckedChange={(checked) => handleSettingChange('privacy_mode', checked)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="sfx-volume" className="flex flex-col gap-1">
                      <span className="font-semibold">Sound Effects (SFX)</span>
                      <span className="text-xs text-gray-400">Enable or disable interface sounds.</span>
                    </Label>
                    <Switch id="sfx-volume" checked={settings.sound_effects} onCheckedChange={(checked) => handleSettingChange('sound_effects', checked)} />
                  </div>
                   <div className="flex items-center justify-between">
                    <Label htmlFor="show-vip-badge" className="flex flex-col gap-1">
                      <span className="font-semibold flex items-center gap-1.5"><Gem className="h-4 w-4 text-purple-400"/>Show VIP Badge</span>
                      <span className="text-xs text-gray-400">Display your VIP status to others.</span>
                    </Label>
                    <Switch id="show-vip-badge" checked={settings.show_vip_badge} onCheckedChange={(checked) => handleSettingChange('show_vip_badge', checked)} disabled={!isVip} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="matching">
                <div className="space-y-6 p-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-roll" className="flex flex-col gap-1">
                      <span className="font-semibold">Auto-Roll</span>
                      <span className="text-xs text-gray-400">Automatically find a new partner when a chat ends.</span>
                    </Label>
                    <Switch id="auto-roll" checked={settings.auto_roll} onCheckedChange={(checked) => handleSettingChange('auto_roll', checked)} />
                  </div>
                  <div>
                    <Label className="font-semibold">Interests</Label>
                    <p className="text-xs text-gray-400 mb-2">Match with users who share your interests.</p>
                    <ToggleGroup
                      type="multiple"
                      variant="outline"
                      value={settings.interests}
                      onValueChange={(value) => handleSettingChange('interests', value)}
                      className="flex flex-wrap gap-2 justify-start p-1"
                    >
                      {ALL_POSSIBLE_INTERESTS.map((interest) => (
                        <ToggleGroupItem key={interest.name} value={interest.name} className="border-gray-600 hover:bg-gray-700 data-[state=on]:bg-purple-600 data-[state=on]:text-white">
                          {interest.emoji} <span className="ml-2">{interest.name}</span>
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                  </div>
                  <div>
                    <Label htmlFor="interest-wait" className="font-semibold">Interests Max Wait ({settings.interest_max_wait_time}s)</Label>
                    <p className="text-xs text-gray-400 mb-2">Time to search for interests before matching with anyone.</p>
                    <Slider id="interest-wait" value={[settings.interest_max_wait_time]} max={60} step={5} onValueChange={(value) => handleSettingChange('interest_max_wait_time', value[0])} />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="filters">
                  <div className="space-y-6 p-2">
                      <div>
                          <Label className="font-semibold">Country Filter</Label>
                          <p className="text-xs text-gray-400 mb-2">Select countries to match with. Multi-select is enabled.</p>
                          {/* This is a simplified multi-select. A more robust solution might use a multi-select component library */}
                          <ToggleGroup
                            type="multiple"
                            variant="outline"
                            value={settings.preferred_countries}
                            onValueChange={(value) => handleSettingChange('preferred_countries', value)}
                            className="flex flex-wrap gap-2 justify-start p-1"
                          >
                            {ALL_COUNTRIES.map(country => (
                                <ToggleGroupItem key={country.name} value={country.name} className="border-gray-600 hover:bg-gray-700 data-[state=on]:bg-blue-600 data-[state=on]:text-white">
                                  {country.flag} <span className="ml-2">{country.name}</span>
                                </ToggleGroupItem>
                            ))}
                          </ToggleGroup>
                      </div>
                      <div>
                          <Label htmlFor="country-wait" className="font-semibold">Country Max Wait ({settings.country_max_wait_time}s)</Label>
                          <p className="text-xs text-gray-400 mb-2">Time to search for countries before matching with anyone.</p>
                          <Slider id="country-wait" value={[settings.country_max_wait_time]} max={60} step={5} onValueChange={(value) => handleSettingChange('country_max_wait_time', value[0])} />
                      </div>
                      <div className="space-y-2">
                          <Label htmlFor="preferred-gender" className="font-semibold">Preferred Gender</Label>
                          <Select value={settings.preferred_gender} onValueChange={(value) => handleSettingChange('preferred_gender', value)} disabled={!canFilterByGender}>
                              <SelectTrigger className="w-full bg-gray-800 border-gray-600">
                                  <SelectValue placeholder={canFilterByGender ? "Select preferred gender" : "VIP/Boost Feature"} />
                              </SelectTrigger>
                              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                                  <SelectItem value="any">Any</SelectItem>
                                  <SelectItem value="male">Male</SelectItem>
                                  <SelectItem value="female">Female</SelectItem>
                                  <SelectItem value="couple">Couple</SelectItem>
                              </SelectContent>
                          </Select>
                          {!canFilterByGender && <p className="text-xs text-amber-400 mt-1">Upgrade to VIP or Boost to use this feature.</p>}
                      </div>
                  </div>
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
        <DialogFooter className="p-6 pt-0">
          <Button onClick={handleSaveChanges} className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}


