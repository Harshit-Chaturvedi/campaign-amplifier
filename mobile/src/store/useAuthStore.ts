import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../types/campaign';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, token?: string) => void;
  loginAsDemo: () => void;
  register: (name: string, email: string, password?: string, token?: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      login: (email: string, _password?: string, token?: string) => {
        const username = email.split('@')[0].toLowerCase();
        const user: UserProfile = {
          uid: 'user-' + username,
          email,
          name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          username,
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        set({
          user,
          token: token || 'demo-jwt-token-' + Date.now(),
          isAuthenticated: true,
        });
      },

      loginAsDemo: () => {
        const user: UserProfile = {
          uid: 'creator-demo',
          email: 'creator@demo.org',
          name: 'Elena Rostova',
          username: 'elena-rostova',
          role: 'creator',
          bio: 'Independent environmental reporter and community campaign organizer.',
          photoURL: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80',
          createdAt: new Date().toISOString(),
        };
        set({
          user,
          token: 'demo-jwt-token-creator-elena',
          isAuthenticated: true,
        });
      },

      register: (name: string, email: string, _password?: string, token?: string) => {
        const user: UserProfile = {
          uid: 'user-' + Date.now().toString(36),
          email,
          name,
          username: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24),
          role: 'user',
          createdAt: new Date().toISOString(),
        };
        set({
          user,
          token: token || 'demo-jwt-token-' + Date.now(),
          isAuthenticated: true,
        });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateProfile: (updates: Partial<UserProfile>) => {
        const { user } = get();
        if (user) {
          set({ user: { ...user, ...updates } });
        }
      },
    }),
    {
      name: 'campaign-auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
