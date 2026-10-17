import { create } from 'zustand';
import type { UserProfile } from '../types/campaign';

interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => void;
  loginAsDemo: () => void;
  register: (name: string, email: string, password: string) => void;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,

  login: (email: string, _password: string) => {
    const user: UserProfile = {
      uid: 'user-' + email.split('@')[0],
      email,
      name: email.split('@')[0].replace(/[^a-zA-Z]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      username: email.split('@')[0].toLowerCase(),
      usernameLower: email.split('@')[0].toLowerCase(),
      photoURL: '',
      bio: '',
      created_at: new Date().toISOString(),
    };
    set({ user, isAuthenticated: true });
  },

  loginAsDemo: () => {
    const user: UserProfile = {
      uid: 'demo-user',
      email: 'demo@campaign.example.com',
      name: 'Demo User',
      username: 'demo-user',
      usernameLower: 'demo-user',
      photoURL: '',
      bio: 'Exploring the campaign platform.',
      created_at: new Date().toISOString(),
    };
    set({ user, isAuthenticated: true });
  },

  register: (name: string, email: string, _password: string) => {
    const user: UserProfile = {
      uid: 'user-' + Date.now().toString(36),
      email,
      name,
      username: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24),
      usernameLower: name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 24),
      photoURL: '',
      bio: '',
      created_at: new Date().toISOString(),
    };
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    const { user } = get();
    if (user) {
      set({ user: { ...user, ...updates } });
    }
  },
}));
