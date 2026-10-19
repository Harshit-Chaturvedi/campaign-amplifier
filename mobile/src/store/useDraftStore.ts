import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CampaignCategory } from '../types/campaign';

export interface CampaignDraft {
  id: string;
  step: number; // 1 to 5
  updatedAt: string;
  // Step 1: Basics
  title: string;
  category: CampaignCategory;
  creatorName: string;
  summary: string;
  coverUrl?: string;
  // Step 2: Story
  storyBlocks: any[];
  sources: { id: string; title: string; url: string }[];
  // Step 3: Visuals
  adImages: string[];
  headline: string;
  adDescription: string;
  cta: string;
  videoUrl?: string;
  // Step 4: Reach
  locations: string[];
  interests: string[];
  channels: string[];
  budgetAllocation: Record<string, number>;
  durationDays: number;
  // Step 5: Goal
  fundingGoal?: number;
  isDemoSample?: boolean;
  demo_mode?: boolean;
}

interface DraftState {
  drafts: Record<string, CampaignDraft>;
  activeDraftId: string | null;

  saveDraft: (draft: Partial<CampaignDraft> & { id: string }) => void;
  getDraft: (id: string) => CampaignDraft | undefined;
  deleteDraft: (id: string) => void;
  setActiveDraft: (id: string | null) => void;
  remapDraftId: (oldId: string, newId: string) => void;
  getAllDrafts: () => CampaignDraft[];
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: {},
      activeDraftId: null,

      saveDraft: (draft) => {
        const existing = get().drafts[draft.id] || {
          id: draft.id,
          step: 1,
          updatedAt: new Date().toISOString(),
          title: '',
          category: 'environment',
          creatorName: '',
          summary: '',
          storyBlocks: [],
          sources: [],
          adImages: [],
          headline: '',
          adDescription: '',
          cta: 'Learn More',
          locations: ['United States'],
          interests: ['General Community'],
          channels: ['Meta', 'Instagram'],
          budgetAllocation: { Meta: 60, Instagram: 40 },
          durationDays: 30,
        };

        const updated: CampaignDraft = {
          ...existing,
          ...draft,
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          drafts: {
            ...state.drafts,
            [draft.id]: updated,
          },
        }));
      },

      getDraft: (id: string) => {
        return get().drafts[id];
      },

      deleteDraft: (id: string) => {
        set((state) => {
          const rest = { ...state.drafts };
          delete rest[id];
          return {
            drafts: rest,
            activeDraftId: state.activeDraftId === id ? null : state.activeDraftId,
          };
        });
      },

      setActiveDraft: (id: string | null) => {
        set({ activeDraftId: id });
      },

      remapDraftId: (oldId: string, newId: string) => {
        set((state) => {
          const existing = state.drafts[oldId];
          if (!existing) return state;
          const rest = { ...state.drafts };
          delete rest[oldId];
          rest[newId] = { ...existing, id: newId, updatedAt: new Date().toISOString() };
          return {
            drafts: rest,
            activeDraftId: state.activeDraftId === oldId ? newId : state.activeDraftId,
          };
        });
      },

      getAllDrafts: () => {
        return Object.values(get().drafts).sort(
          (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      },
    }),
    {
      name: 'campaign-drafts-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
