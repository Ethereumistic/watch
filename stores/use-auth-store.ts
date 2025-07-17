import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

// Define the structure of a user profile based on your new schema
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
}

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
  fetchUserProfile: (user: User) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set((state) => ({ ...state, session, user: session?.user ?? null })),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
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
