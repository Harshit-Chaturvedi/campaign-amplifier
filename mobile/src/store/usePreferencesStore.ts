import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PreferencesState {
  savedCampaignIds: string[];
  followedCampaignIds: string[];
  notificationPrefs: {
    fundingMilestones: boolean;
    campaignUpdates: boolean;
    deliveryReports: boolean;
    marketing: boolean;
  };

  // Actions
  toggleSaveCampaign: (id: string) => boolean;
  isSaved: (id: string) => boolean;
  toggleFollowCampaign: (id: string) => boolean;
  isFollowed: (id: string) => boolean;
  setNotificationPref: (key: string, value: boolean) => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set, get) => ({
      savedCampaignIds: [],
      followedCampaignIds: [],
      notificationPrefs: {
        fundingMilestones: true,
        campaignUpdates: true,
        deliveryReports: true,
        marketing: false,
      },

      toggleSaveCampaign: (id: string) => {
        const { savedCampaignIds } = get();
        const exists = savedCampaignIds.includes(id);
        const updated = exists
          ? savedCampaignIds.filter((item) => item !== id)
          : [...savedCampaignIds, id];
        set({ savedCampaignIds: updated });
        return !exists;
      },

      isSaved: (id: string) => {
        return get().savedCampaignIds.includes(id);
      },

      toggleFollowCampaign: (id: string) => {
        const { followedCampaignIds } = get();
        const exists = followedCampaignIds.includes(id);
        const updated = exists
          ? followedCampaignIds.filter((item) => item !== id)
          : [...followedCampaignIds, id];
        set({ followedCampaignIds: updated });
        return !exists;
      },

      isFollowed: (id: string) => {
        return get().followedCampaignIds.includes(id);
      },

      setNotificationPref: (key: string, value: boolean) => {
        set((state) => ({
          notificationPrefs: {
            ...state.notificationPrefs,
            [key]: value,
          },
        }));
      },
    }),
    {
      name: 'campaign-preferences-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
