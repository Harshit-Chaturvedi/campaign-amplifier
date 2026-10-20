import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { UserProfile } from '../types/campaign';
import { useDraftStore } from './useDraftStore';

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

export function normalizeUserProfile(raw: any): UserProfile {
  if (!raw) {
    return {
      uid: 'user-anonymous',
      email: '',
      name: 'Anonymous',
      username: 'anonymous',
      role: 'user',
      createdAt: new Date().toISOString(),
    };
  }
  const uid = raw.uid || raw.id || (raw.email ? 'user-' + raw.email.split('@')[0].toLowerCase() : 'user-unknown');
  return {
    ...raw,
    uid,
    role: raw.role || 'user',
    name: raw.name || raw.email?.split('@')[0] || 'User',
    email: raw.email || '',
    username: raw.username || raw.email?.split('@')[0] || 'user',
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (rawUser: UserProfile, token: string) => {
        if (!token || isFakeToken(token)) {
          // Never store fake tokens
          set({ user: null, token: null, isAuthenticated: false });
          return;
        }
        const user = normalizeUserProfile(rawUser);
        const currentUser = get().user;
        if (!currentUser || currentUser.uid !== user.uid) {
          useDraftStore.getState().clearAllDrafts();
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
          user = normalizeUserProfile(emailOrUser);
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

        const currentUser = get().user;
        if (!currentUser || currentUser.uid !== user.uid) {
          useDraftStore.getState().clearAllDrafts();
        }

        set({
          user,
          token,
          isAuthenticated: true,
        });
      },

      logout: () => {
        useDraftStore.getState().clearAllDrafts();
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
