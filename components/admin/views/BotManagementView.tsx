"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isValid, parseISO } from "date-fns";
import { Loader2, CalendarClock, Play, Pause, Trash2, PlusCircle, Calendar as CalendarIcon, Clock, Pencil } from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { cn } from "@/lib/utils";
import { ALL_COUNTRIES } from '@/lib/constants'; // Import your countries data

const supabase = createClient();


// --- Types ---
interface BotProfile {
  id: string;
  username: string;
  dob: string;
  gender: 'male' | 'female' | 'couple';
  country: string;
  video_urls: string[];
  is_active: boolean;
  active_days: string[];
  start_time: string | null;
  end_time: string | null;
  settings: {
    show_vip_badge: boolean;
  };
}

// Map of days to trigger tabs
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const GENDERS = ['male', 'female', 'couple'];
const TIMES = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

// Helper function to get country abbreviation
const getCountryAbbr = (countryName: string) => {
  const country = ALL_COUNTRIES.find(c => c.name.toLowerCase() === countryName.toLowerCase());
  return country ? country.abbr : 'us'; // Default to US flag if not found
};

// Helper function to get gender-based background color
const getGenderBackground = (gender: 'male' | 'female' | 'couple') => {
    switch (gender) {
        case 'male': return 'bg-blue-900';
        case 'female': return 'bg-pink-900';
        case 'couple': return 'bg-yellow-900';
        default: return 'bg-gray-900';
    }
};


export function BotManagementView() {
  const [bots, setBots] = useState<BotProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingBot, setEditingBot] = useState<BotProfile | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  // Function to fetch all bots from the new API route
  const fetchBots = async () => {
    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error("No active session found.");
        setIsLoading(false);
        return;
      }

      const response = await fetch('/api/admin/bots', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch bots');
      const data = await response.json();
      setBots(data);
    } catch (error) {
      console.error("Failed to fetch bots", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBots();
  }, []);

  // Handler for toggling the 'is_active' switch
  const handleActiveToggle = async (botId: string, isActive: boolean) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");
      
      await fetch(`/api/admin/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ is_active: isActive }),
      });
      // Refresh the list
      fetchBots();
    } catch (error) {
      console.error("Failed to toggle bot status", error);
    }
  };
  
  // Handler for adding/removing a day from active_days
  const handleDayToggle = async (botId: string, day: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;
    const newActiveDays = bot.active_days.includes(day)
      ? bot.active_days.filter(d => d !== day)
      : [...bot.active_days, day];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");
      
      await fetch(`/api/admin/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ active_days: newActiveDays }),
      });
      fetchBots();
    } catch (error) {
      console.error("Failed to update active days", error);
    }
  };

  const handleTimeChange = async (botId: string, field: 'start_time' | 'end_time', value: string) => {
    const bot = bots.find(b => b.id === botId);
    if (!bot) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");

      const [hour, minute] = value.split(':').map(Number);
      if (isNaN(hour) || isNaN(minute)) {
          console.error("Invalid time format.");
          return;
      }
      const updatedTime = new Date(`1970-01-01T${value}:00Z`).toISOString();
      
      await fetch(`/api/admin/bots/${botId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ [field]: updatedTime }),
      });
      fetchBots();
    } catch (error) {
      console.error("Failed to update bot time", error);
    }
  };

  const handleDeleteBot = async (botId: string) => {
    if (!window.confirm("Are you sure you want to delete this bot? This action cannot be undone.")) {
      return;
    }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");

      await fetch(`/api/admin/bots/${botId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
      });
      fetchBots();
    } catch (error) {
      console.error("Failed to delete bot", error);
    }
  };

  const handleAddBot = async (newBot: Omit<BotProfile, 'id'>) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");

      const response = await fetch('/api/admin/bots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(newBot),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to add bot: ${response.status} ${errorText}`);
      }
      fetchBots();
      setIsAddFormOpen(false);
    } catch (error) {
      console.error("Failed to add new bot", error);
    }
  };
  
  const handleEditBot = async (updatedBot: BotProfile) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Authentication session not found.");
      
      const { id, ...updates } = updatedBot;
      const response = await fetch(`/api/admin/bots/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to update bot: ${response.status} ${errorText}`);
      }
      fetchBots();
      setEditingBot(null);
    } catch (error) {
      console.error("Failed to update bot", error);
    }
  };


  const filterBotsByDay = (day: string) => {
    if (day === 'all') {
      return bots;
    }
    
    return bots.filter(bot => {
        if (bot.is_active) {
            return false;
        }

        return bot.active_days.includes(day);
    });
  };
  
  if (isLoading) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin h-8 w-8" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Bot Management</h2>
        <Button 
          variant="outline" 
          className="bg-green-600 hover:bg-green-700 text-white" 
          onClick={() => {
            setEditingBot(null);
            setIsAddFormOpen(true);
          }}
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          Add Bot
        </Button>
      </div>
      <Card className="border-gray-800 bg-gray-950">
        <CardContent className="p-4">
          <Tabs defaultValue="all">
            <TabsList className="bg-gray-800">
              <TabsTrigger value="all">All Bots ({bots.length})</TabsTrigger>
              {DAYS.map(day => (
                <TabsTrigger key={day} value={day}>
                  {day.slice(0, 3).toUpperCase()}
                  ({filterBotsByDay(day).length})
                </TabsTrigger>
              ))}
            </TabsList>
            
            <TabsContent value="all" className="mt-4">
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {bots.length > 0 ? bots.map(bot => (
                  <BotCard key={bot.id} bot={bot} onToggleActive={handleActiveToggle} onDayToggle={handleDayToggle} onDelete={handleDeleteBot} onTimeChange={handleTimeChange} onEdit={() => setEditingBot(bot)} />
                )) : <p className="text-gray-400">No bots found.</p>}
              </div>
            </TabsContent>
            
            {DAYS.map(day => (
              <TabsContent key={day} value={day} className="mt-4">
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                  {filterBotsByDay(day).length > 0 ? filterBotsByDay(day).map(bot => (
                    <BotCard key={bot.id} bot={bot} onToggleActive={handleActiveToggle} onDayToggle={handleDayToggle} onDelete={handleDeleteBot} onTimeChange={handleTimeChange} onEdit={() => setEditingBot(bot)} />
                  )) : <p className="text-gray-400">No bots active on {day}.</p>}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Add Bot Dialog */}
      <AddEditBotDialog
        onSave={handleAddBot}
        initialData={null}
        isOpen={isAddFormOpen}
        onOpenChange={setIsAddFormOpen}
      />

      {/* Edit Dialog */}
      {editingBot && (
        <AddEditBotDialog
          onSave={handleEditBot}
          initialData={editingBot}
          isOpen={!!editingBot}
          onOpenChange={(isOpen) => !isOpen && setEditingBot(null)}
        />
      )}
    </div>
  );
}

// Helper component for a single bot card
const BotCard = ({ bot, onToggleActive, onDayToggle, onDelete, onTimeChange, onEdit }: {
  bot: BotProfile;
  onToggleActive: (id: string, isActive: boolean) => void;
  onDayToggle: (id: string, day: string) => void;
  onDelete: (id: string) => void;
  onTimeChange: (id: string, field: 'start_time' | 'end_time', value: string) => void;
  onEdit: () => void;
}) => {
  const isCurrentlyActive = bot.is_active;

  return (
    <Card className={cn("flex flex-col md:flex-row items-center justify-between p-4 border-gray-700", getGenderBackground(bot.gender))}>
      <div className="flex-1 space-y-2 md:space-y-0 md:space-x-4 flex flex-wrap items-center">
        <h3 className="font-semibold text-lg">{bot.username}</h3>
        <p className="text-sm font-mono text-gray-400">ID: {bot.id}</p>
        <div className="flex items-center space-x-2">
            {bot.country && (
                <img
                    src={`https://flagcdn.com/32x24/${getCountryAbbr(bot.country)}.png`}
                    alt={bot.country}
                    className="h-4 w-6 rounded-sm"
                />
            )}
            <p className="text-sm text-gray-400">Country: {bot.country}</p>
        </div>
        <p className="text-sm text-gray-400">Gender: {bot.gender}</p>
        <div className="flex items-center space-x-2">
          <Label htmlFor={`active-switch-${bot.id}`} className="text-gray-300">Manually Active:</Label>
          <Switch
            id={`active-switch-${bot.id}`}
            checked={isCurrentlyActive}
            onCheckedChange={(checked) => onToggleActive(bot.id, checked)}
          />
        </div>
        <div className="flex items-center space-x-2 text-sm text-gray-400">
            <Label>Daily Active Hours:</Label>
            <Select value={bot.start_time ? bot.start_time.slice(11,16) : '00:00'} onValueChange={(value) => onTimeChange(bot.id, 'start_time', value)}>
                <SelectTrigger className="w-[80px] bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-48 overflow-y-auto">
                    {TIMES.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <span>-</span>
            <Select value={bot.end_time ? bot.end_time.slice(11,16) : '23:00'} onValueChange={(value) => onTimeChange(bot.id, 'end_time', value)}>
                <SelectTrigger className="w-[80px] bg-gray-700 border-gray-600 text-white">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-48 overflow-y-auto">
                    {TIMES.map(time => (
                        <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
        <div className="flex items-center space-x-2 flex-wrap">
          <Label className="text-gray-300">Active Days:</Label>
          {DAYS.map(day => (
            <Button
              key={day}
              type="button"
              variant={bot.active_days.includes(day) ? "default" : "outline"}
              size="sm"
              className={`text-xs ${bot.active_days.includes(day) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
              onClick={() => onDayToggle(bot.id, day)}
            >
              {day.slice(0, 3).toUpperCase()}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center space-x-2 mt-4 md:mt-0">
        <Button onClick={onEdit} variant="outline" size="sm" className="bg-gray-700 hover:bg-gray-600">
            <Pencil className="w-4 h-4" />
        </Button>
        <Button onClick={() => onDelete(bot.id)} variant="destructive" size="sm">
            <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </Card>
  );
};


// Reusable dialog for adding and editing bots
const AddEditBotDialog = ({ onSave, initialData, isOpen, onOpenChange }: {
  onSave: (bot: any) => void;
  initialData: BotProfile | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}) => {
  const [formData, setFormData] = useState({
    username: initialData?.username || '',
    dob: initialData?.dob ? initialData.dob.slice(0, 10) : '',
    gender: initialData?.gender || 'female',
    country: initialData?.country || '',
    video_urls: initialData?.video_urls.join(', ') || '',
    is_active: initialData?.is_active || false,
    active_days: initialData?.active_days || [],
    start_time: initialData?.start_time ? initialData.start_time.slice(11, 16) : '00:00',
    end_time: initialData?.end_time ? initialData.end_time.slice(11, 16) : '23:00',
    settings: initialData?.settings || { show_vip_badge: false }
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username,
        dob: initialData.dob.slice(0, 10), // Set date input to 'YYYY-MM-DD'
        gender: initialData.gender,
        country: initialData.country,
        video_urls: initialData.video_urls.join(', '),
        is_active: initialData.is_active,
        active_days: initialData.active_days,
        start_time: initialData.start_time ? initialData.start_time.slice(11, 16) : '00:00',
        end_time: initialData.end_time ? initialData.end_time.slice(11, 16) : '23:00',
        settings: initialData.settings
      });
    } else {
      setFormData({
        username: '',
        dob: '',
        gender: 'female',
        country: '',
        video_urls: '',
        is_active: false,
        active_days: [],
        start_time: '00:00',
        end_time: '23:00',
        settings: { show_vip_badge: false }
      });
    }
  }, [initialData]);
  
  const handleDayToggle = (day: string) => {
    setFormData(prevData => ({
      ...prevData,
      active_days: prevData.active_days.includes(day)
        ? prevData.active_days.filter(d => d !== day)
        : [...prevData.active_days, day]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Convert comma-separated string to array
    const videoUrlsArray = formData.video_urls.split(',').map(url => url.trim()).filter(url => url.length > 0);

    // Format dob to YYYY-MM-DD
    const dob = formData.dob;

    // Supabase expects ISO 8601 strings for timestamps
    const dummyDate = '1970-01-01'; // This is just a placeholder, the time is what matters
    const start_time_iso = new Date(`${dummyDate}T${formData.start_time}:00Z`).toISOString();
    const end_time_iso = new Date(`${dummyDate}T${formData.end_time}:00Z`).toISOString();
    
    const botToSave = {
      ...formData,
      dob,
      start_time: start_time_iso,
      end_time: end_time_iso,
      video_urls: videoUrlsArray,
    };

    if (initialData) {
        await onSave({ ...botToSave, id: initialData.id });
    } else {
        await onSave(botToSave);
    }
    
    setIsSubmitting(false);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {!initialData && (
          <Button variant="outline" className="bg-green-600 hover:bg-green-700 text-white">
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Bot
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-700 text-white">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Bot' : 'Add New Bot'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dob">Date of Birth (YYYY-MM-DD)</Label>
            <Input id="dob" type="date" value={formData.dob} onChange={(e) => setFormData({...formData, dob: e.target.value})} required className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select onValueChange={(value) => setFormData({...formData, gender: value as 'male' | 'female' | 'couple'})} defaultValue={formData.gender}>
              <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                <SelectValue placeholder="Select a gender" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-white">
                {GENDERS.map(gender => (
                  <SelectItem key={gender} value={gender}>{gender.charAt(0).toUpperCase() + gender.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Input id="country" value={formData.country} onChange={(e) => setFormData({...formData, country: e.target.value})} required className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="video_urls">Video URLs (comma-separated)</Label>
            <Textarea id="video_urls" value={formData.video_urls} onChange={(e) => setFormData({...formData, video_urls: e.target.value})} required className="bg-gray-800 border-gray-700 text-white" />
          </div>
          <div className="space-y-2">
            <Label className="block">Active Days</Label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <Button
                  key={day}
                  type="button"
                  variant={formData.active_days.includes(day) ? "default" : "outline"}
                  size="sm"
                  className={`text-xs ${formData.active_days.includes(day) ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                  onClick={() => handleDayToggle(day)}
                >
                  {day.slice(0, 3).toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Daily Active Hours</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_time">Start Time</Label>
                <Select value={formData.start_time} onValueChange={(value) => setFormData({...formData, start_time: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="Start Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-48 overflow-y-auto">
                    {TIMES.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_time">End Time</Label>
                <Select value={formData.end_time} onValueChange={(value) => setFormData({...formData, end_time: value})}>
                  <SelectTrigger className="bg-gray-800 border-gray-700 text-white">
                    <SelectValue placeholder="End Time" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white max-h-48 overflow-y-auto">
                    {TIMES.map(time => (
                      <SelectItem key={time} value={time}>{time}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="is_active" checked={formData.is_active} onCheckedChange={(checked) => setFormData({...formData, is_active: checked})} />
            <Label htmlFor="is_active">Manually Active</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch id="show_vip_badge" checked={formData.settings.show_vip_badge} onCheckedChange={(checked) => setFormData({...formData, settings: { ...formData.settings, show_vip_badge: checked }})} />
            <Label htmlFor="show_vip_badge">Show VIP Badge</Label>
          </div>
          <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            {initialData ? 'Save Changes' : 'Add Bot'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};
