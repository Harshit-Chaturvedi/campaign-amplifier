import { create } from 'zustand';
import type {
  Campaign,
  Contribution,
  CampaignCategory,
  CampaignStatus,
  AppNotification,
  CampaignUpdate,
} from '../types/campaign';
import {
  seedCampaigns,
  seedContributions,
  seedNotifications,
  seedUpdates,
} from '../data/seedData';
import { generateId } from '../utils/formatting';
import { canTransition, UserLifecycleRole } from '../services/lifecycle';
import { estimateReach, calculateBackerFee } from '../services/reach';

interface CampaignState {
  campaigns: Campaign[];
  contributions: Contribution[];
  notifications: AppNotification[];
  updates: CampaignUpdate[];
  isLoading: boolean;

  // Getters
  getCampaign: (idOrSlug: string) => Campaign | undefined;
  getPublicCampaigns: () => Campaign[];
  getCampaignsByCategory: (cat: CampaignCategory) => Campaign[];
  getFeaturedCampaigns: () => Campaign[];
  getCampaignContributions: (campaignId: string) => Contribution[];
  getUserContributions: (uid: string) => Contribution[];
  getUserCampaigns: (uid: string) => Campaign[];
  getCampaignUpdates: (campaignId: string) => CampaignUpdate[];
  getNotifications: (userId?: string) => AppNotification[];

  // Actions
  createCampaign: (
    data: Partial<Campaign> & { title: string; fundingGoal: number },
    userId: string
  ) => Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  transitionCampaign: (
    id: string,
    toStatus: CampaignStatus,
    role?: UserLifecycleRole,
    note?: string
  ) => { success: boolean; reason?: string };
  addContribution: (params: {
    campaignId: string;
    amount: number;
    userId?: string | null;
    backerName?: string;
    showName?: boolean;
    guestEmail?: string | null;
  }) => Contribution;
  searchCampaigns: (query: string) => Campaign[];
  markNotificationRead: (id: string) => void;
  addNotification: (notification: Omit<AppNotification, 'id' | 'createdAt'>) => void;
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [...seedCampaigns],
  contributions: [...seedContributions],
  notifications: [...seedNotifications],
  updates: [...seedUpdates],
  isLoading: false,

  getCampaign: (idOrSlug: string) => {
    const decoded = decodeURIComponent(idOrSlug).toLowerCase();
    return get().campaigns.find(
      (c) => c.id.toLowerCase() === decoded || c.slug.toLowerCase() === decoded
    );
  },

  getPublicCampaigns: () =>
    get()
      .campaigns.filter((c) =>
        [
          'available_for_funding',
          'goal_reached',
          'distribution_preparation',
          'promoting',
          'completed',
        ].includes(c.status)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),

  getCampaignsByCategory: (cat: CampaignCategory) =>
    get().getPublicCampaigns().filter((c) => c.category === cat),

  getCampaignContributions: (campaignId: string) =>
    get().contributions.filter((c) => c.campaignId === campaignId),

  getUserContributions: (uid: string) =>
    get().contributions.filter((c) => c.userId === uid),

  getUserCampaigns: (uid: string) =>
    get().campaigns.filter((c) => c.creatorId === uid),

  getFeaturedCampaigns: () => {
    const ids = ['cmp-clean-water', 'cmp-tree-canopy', 'cmp-repair-right', 'cmp-night-shelter'];
    const matched = get().campaigns.filter((c) => ids.includes(c.id));
    return matched.length > 0 ? matched : get().getPublicCampaigns().slice(0, 3);
  },

  getCampaignUpdates: (campaignId: string) =>
    get().updates.filter((u) => u.campaignId === campaignId),

  getNotifications: (userId?: string) => {
    if (!userId) return get().notifications;
    return get().notifications.filter((n) => !n.userId || n.userId === userId);
  },

  createCampaign: (data, userId) => {
    const id = 'cmp-' + generateId();
    const fundingGoal = data.fundingGoal || 5000;
    const estimatedReachAtGoal = estimateReach(fundingGoal).estimate;

    const campaign: Campaign = {
      id,
      slug: data.slug || id,
      title: data.title,
      summary: data.summary || '',
      tagline: data.tagline || '',
      category: data.category || 'public_policy',
      creatorType: data.creatorType || 'creator',
      creatorName: data.creatorName || 'Demo Creator',
      creatorId: userId,
      status: 'submitted',
      currency: 'usd',
      fundingGoal,
      amountRaised: 0,
      percentFunded: 0,
      backerCount: 0,
      estimatedReachAtGoal,
      storyBlocks: data.storyBlocks || [
        { type: 'paragraph', text: data.summary || '' },
      ],
      sources: data.sources || [],
      adAssets: data.adAssets || {
        coverUrl: 'https://picsum.photos/seed/' + id + '/800/500',
        adImages: [],
        headline: data.title.slice(0, 60),
        description: data.summary || '',
        cta: 'Learn More',
      },
      reachSettings: data.reachSettings || {
        locations: ['Metro Area'],
        interests: ['Community Awareness'],
        channels: ['Meta', 'Instagram'],
        budgetAllocation: { Meta: 60, Instagram: 40 },
        durationDays: 30,
      },
      createdAt: new Date().toISOString(),
      submittedAt: new Date().toISOString(),
    };

    set((state) => ({ campaigns: [campaign, ...state.campaigns] }));

    // Trigger notification
    get().addNotification({
      type: 'submission_received',
      campaignId: campaign.id,
      campaignTitle: campaign.title,
      title: 'Campaign Submitted for Review',
      body: `"${campaign.title}" was submitted. Reviewers will check content and sources within 24 hours.`,
      read: false,
    });

    return campaign;
  },

  updateCampaign: (id, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
      ),
    }));
  },

  transitionCampaign: (id, toStatus, role = 'admin', note) => {
    const campaign = get().getCampaign(id);
    if (!campaign) return { success: false, reason: 'Campaign not found' };

    const check = canTransition(campaign, toStatus, role);
    if (!check.allowed) {
      return { success: false, reason: check.reason };
    }

    const now = new Date().toISOString();
    const statusTimestamps: Partial<Campaign> = {};
    if (toStatus === 'approved') statusTimestamps.approvedAt = now;
    if (toStatus === 'available_for_funding') statusTimestamps.publishedAt = now;
    if (toStatus === 'promoting') statusTimestamps.promotingAt = now;
    if (toStatus === 'completed') statusTimestamps.completedAt = now;

    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              status: toStatus,
              moderationFeedback: note || c.moderationFeedback,
              ...statusTimestamps,
            }
          : c
      ),
    }));

    return { success: true };
  },

  addContribution: ({ campaignId, amount, userId, backerName, showName = false, guestEmail }) => {
    const { fee, total } = calculateBackerFee(amount);
    const estimatedReachResult = estimateReach(amount);

    const contribution: Contribution = {
      id: 'con-' + generateId(),
      campaignId,
      userId: userId || null,
      guestEmail: guestEmail || null,
      amount,
      fee,
      total,
      status: 'succeeded',
      showName,
      backerName: showName && backerName ? backerName : 'Anonymous',
      receiptNo: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      createdAt: new Date().toISOString(),
      estimatedReach: estimatedReachResult.estimate,
    };

    set((state) => {
      const newContribs = [contribution, ...state.contributions];
      const campaigns = state.campaigns.map((c) => {
        if (c.id !== campaignId) return c;
        const newRaised = Number(((c.amountRaised || 0) + amount).toFixed(2));
        const newPercent = c.fundingGoal
          ? Math.min(100, Math.round((newRaised / c.fundingGoal) * 100))
          : 0;
        const newBackerCount = (c.backerCount || 0) + 1;

        // Auto milestone transition if goal reached
        let newStatus = c.status;
        if (newRaised >= c.fundingGoal && c.status === 'available_for_funding') {
          newStatus = 'goal_reached';
        }

        return {
          ...c,
          amountRaised: newRaised,
          percentFunded: newPercent,
          backerCount: newBackerCount,
          status: newStatus,
        };
      });

      return { contributions: newContribs, campaigns };
    });

    return contribution;
  },

  searchCampaigns: (query: string) => {
    const q = query.toLowerCase().trim();
    const publicCamps = get().getPublicCampaigns();
    if (!q) return publicCamps;

    return publicCamps.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.tagline && c.tagline.toLowerCase().includes(q)) ||
        c.summary.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.creatorName.toLowerCase().includes(q)
    );
  },

  markNotificationRead: (id: string) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },

  addNotification: (notification) => {
    const notif: AppNotification = {
      ...notification,
      id: 'notif-' + generateId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ notifications: [notif, ...state.notifications] }));
  },
}));
