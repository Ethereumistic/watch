import { create } from 'zustand'
import { Session, User } from '@supabase/supabase-js'

// Define the structure of a user profile based on your new schema
export type Profile = {
  id: string;
  username: string | null;
  avatar_url?: string;
  dob?: string;
  gender?: 'male' | 'female' | 'couple';
  // Add other profile fields as needed
}

type AuthState = {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,
  setSession: (session) => set((state) => ({ ...state, session, user: session?.user ?? null })),
  setProfile: (profile) => set({ profile }),
  setLoading: (loading) => set({ loading }),
}))
