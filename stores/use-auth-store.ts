import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type ProfileSettings = {
  privacy_mode: boolean;
  sound_effects: boolean;
  show_vip_badge: boolean;
  auto_roll: boolean;
  interest_max_wait_time: number;
  country_max_wait_time: number;
};

// The profile type now includes all fields from the DB and a nested settings object.
export type Profile = {
  id: string;
  username: string | null;
  avatar_url?: string;
  dob: string | null;
  gender: 'male' | 'female' | 'couple' | null;
  country: string | null;
  created_at: string;
  updated_at: string;
  role: 'free' | 'vip' | 'boost' | 'mod' | 'admin';
  times_reported: number;
  warnings_count: number;
  violation_level: number;
  banned_until: string | null;
  interests: string[] | null;
  preferred_countries: string[] | null;
  preferred_gender: ('male' | 'female' | 'couple')[] | null;
  settings: ProfileSettings | null;
  boosts: number;
  boost_until: string | null;
  vip_until: string | null;
};

// This type represents the data received from the backend about a matched partner.
export type PartnerProfile = {
  username: string | null;
  dob: string | null;
  gender: 'male' | 'female' | 'couple' | null;
  country: string | null;
  role: 'free' | 'vip' | 'boost' | 'mod' | 'admin';
  settings: Partial<ProfileSettings> | null;
};

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  partnerProfile: PartnerProfile | null; // New state for partner's profile
  isInitialized: boolean; // This flag confirms the store has been initialized from the server.
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setPartnerProfile: (profile: PartnerProfile | null) => void; // New setter
  fetchUserProfile: (user: User) => Promise<void>;
}

// MODIFIED: Added `get` to the create function arguments
export const useAuthStore = create<AuthState>((set, get) => ({
  session: null,
  user: null,
  profile: null,
  partnerProfile: null, // Default to null
  isInitialized: false, // Default to false on app load
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
  setPartnerProfile: (profile) => set({ partnerProfile: profile }), // Setter for partner profile
  
  // MODIFIED: The logic inside fetchUserProfile is now more resilient
  fetchUserProfile: async (user: User) => {
    const supabase = createClient();
    try {
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.warn('Error fetching profile or profile does not exist:', error.message);
        // FIX: Only set profile to null if there wasn't one to begin with.
        // This prevents a failed refresh from wiping a valid, server-initialized profile.
        if (!get().profile) {
          set({ profile: null });
        }
      } else {
        set({ profile: profileData as Profile });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      // FIX: We also don't want to clear the profile on a generic catch error.
      // The existing profile is better than no profile.
    }
  },
}))