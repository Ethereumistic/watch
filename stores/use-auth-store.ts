import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Profile type remains the same
export type Profile = {
  id: string;
  username: string | null;
  avatar_url?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'couple';
  country: string;
  created_at: string;
  updated_at: string;
  role: 'free' | 'vip' | 'mod' | 'admin';
  times_reported: number;
  warnings_count: number;
  violation_level: number;
  banned_until: string | null;
  interests: string[] | null;
}

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  fetchUserProfile: (user: User) => Promise<void>;
}

// NOTE: The 'loading' state and its setters are completely removed.
export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),
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
        set({ profile: null });
      } else {
        set({ profile: profileData });
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      set({ profile: null });
    }
  },
}))