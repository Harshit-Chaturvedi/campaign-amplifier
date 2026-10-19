import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../types/campaign';

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: UserProfile, token: string) => void;
  login: (emailOrUser: string | UserProfile, passOrToken?: string, optionalToken?: string) => void;
  loginAsDemo?: () => void;
  register?: (name: string, email: string, password?: string, token?: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export function isFakeToken(token?: string | null): boolean {
  if (!token) return false;
  return token.startsWith('demo-jwt-token') || token.startsWith('demo-token');
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user: UserProfile, token: string) => {
        if (!token || isFakeToken(token)) {
          // Never store fake tokens
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      login: (emailOrUser: string | UserProfile, passOrToken?: string, optionalToken?: string) => {
        let user: UserProfile;
        let token: string | undefined;

        if (typeof emailOrUser === 'object' && emailOrUser !== null) {
          user = emailOrUser;
          token = passOrToken;
        } else {
          const email = emailOrUser;
          token = optionalToken;
          const username = email.split('@')[0].toLowerCase();
          user = {
            uid: 'user-' + username,
            email,
            name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            username,
            role: 'user',
            createdAt: new Date().toISOString(),
          };
        }

        if (!token || isFakeToken(token)) {
          // Never store a fake token and do NOT log in locally
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }

        set({
          user,
          token,
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
      onRehydrateStorage: () => (state) => {
        if (state && isFakeToken(state.token)) {
          state.user = null;
          state.token = null;
          state.isAuthenticated = false;
        }
      },
    }
  )
);

// Discard immediately if already populated in memory on startup
try {
  const currentToken = useAuthStore.getState().token;
  if (isFakeToken(currentToken)) {
    useAuthStore.getState().logout();
  }
} catch {
  // Ignore in SSR/testing setup
}
