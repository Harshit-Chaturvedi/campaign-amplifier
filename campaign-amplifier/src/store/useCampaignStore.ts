import { create } from 'zustand';
import type { Campaign, Contribution, CampaignCategory } from '../types/campaign';
import { seedCampaigns, seedContributions } from '../data/seedData';
import { generateId } from '../utils/formatting';

interface CampaignState {
  campaigns: Campaign[];
  contributions: Contribution[];
  isLoading: boolean;

  // Getters
  getCampaign: (idOrSlug: string) => Campaign | undefined;
  getApprovedCampaigns: () => Campaign[];
  getPendingCampaigns: () => Campaign[];
  getCompletedCampaigns: () => Campaign[];
  getCampaignsByCategory: (cat: CampaignCategory) => Campaign[];
  getCampaignContributions: (campaignId: string) => Contribution[];
  getUserContributions: (uid: string) => Contribution[];
  getUserCampaigns: (uid: string) => Campaign[];
  getFeaturedCampaigns: () => Campaign[];
  getClosingSoonCampaigns: () => Campaign[];

  // Actions
  createCampaign: (data: Partial<Campaign> & { title: string; funding_goal: number }, userId: string) => Campaign;
  updateCampaign: (id: string, updates: Partial<Campaign>) => void;
  approveCampaign: (id: string) => void;
  rejectCampaign: (id: string) => void;
  addContribution: (campaignId: string, amountCents: number, uid: string, name: string) => Contribution;
  searchCampaigns: (query: string) => Campaign[];
}

export const useCampaignStore = create<CampaignState>((set, get) => ({
  campaigns: [...seedCampaigns],
  contributions: [...seedContributions],
  isLoading: false,

  getCampaign: (idOrSlug: string) => {
    const decoded = decodeURIComponent(idOrSlug);
    return get().campaigns.find((c) => c.id === decoded || c.slug === decoded);
  },

  getApprovedCampaigns: () =>
    get()
      .campaigns.filter((c) => c.status === 'Approved')
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),

  getPendingCampaigns: () => get().campaigns.filter((c) => c.status === 'Pending'),

  getCompletedCampaigns: () => get().campaigns.filter((c) => c.status === 'Completed'),

  getCampaignsByCategory: (cat: CampaignCategory) =>
    get().campaigns.filter((c) => c.category === cat && c.status === 'Approved'),

  getCampaignContributions: (campaignId: string) =>
    get().contributions.filter((c) => c.campaignId === campaignId),

  getUserContributions: (uid: string) => get().contributions.filter((c) => c.uid === uid),

  getUserCampaigns: (uid: string) => get().campaigns.filter((c) => c.created_by === uid),

  getFeaturedCampaigns: () => {
    const ids = ['cmp-clean-water', 'cmp-transit-map', 'cmp-open-science'];
    return get().campaigns.filter((c) => ids.includes(c.id));
  },

  getClosingSoonCampaigns: () => {
    return get()
      .campaigns.filter((c) => c.status === 'Approved' && c.percent_funded >= 80)
      .sort((a, b) => b.percent_funded - a.percent_funded);
  },

  createCampaign: (data, userId) => {
    const id = 'cmp-' + generateId();
    const campaign: Campaign = {
      id,
      slug: data.slug || id,
      title: data.title,
      tagline: data.tagline || '',
      short_description: data.short_description || '',
      long_description: data.long_description || '',
      why_backers_should_care: data.why_backers_should_care || '',
      category: data.category || 'public_policy',
      status: 'Pending',
      currency: 'usd',
      funding_goal: data.funding_goal,
      funding_current: 0,
      amount_raised: 0,
      percent_funded: 0,
      thumbnail_url: data.thumbnail_url || '',
      ad_image_url: data.ad_image_url || '',
      ad_headline: data.ad_headline || '',
      ad_primary_text: data.ad_primary_text || '',
      ad_image_prompt: data.ad_image_prompt || '',
      target_audience: data.target_audience || '',
      creator_name: data.creator_name || 'Demo User',
      created_by: userId,
      created_at: new Date().toISOString(),
      campaign_starts_at: new Date().toISOString(),
      launched_at: new Date().toISOString(),
      duration_days: data.duration_days || 30,
      evergreen: data.evergreen || false,
      show_countdown: true,
      campaign_sources: data.campaign_sources || [],
      ad_platforms: data.ad_platforms || ['facebook', 'instagram'],
      milestones: [],
      hero_slideshow: [],
      stripe_product_id: '',
      slides: data.slides || [],
    };
    set((state) => ({ campaigns: [campaign, ...state.campaigns] }));
    return campaign;
  },

  updateCampaign: (id, updates) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }));
  },

  approveCampaign: (id) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              status: 'Approved' as const,
              stripe_product_id: 'prod_demo_' + id,
            }
          : c
      ),
    }));
  },

  rejectCampaign: (id) => {
    set((state) => ({
      campaigns: state.campaigns.map((c) =>
        c.id === id ? { ...c, status: 'Rejected' as const } : c
      ),
    }));
  },

  addContribution: (campaignId, amountCents, uid, name) => {
    const contribution: Contribution = {
      id: 'con-' + generateId(),
      campaignId,
      uid,
      email: null,
      name,
      amount_cents: amountCents,
      amount_dollars: amountCents / 100,
      net_cents: Math.round(amountCents * 0.8),
      created_at: new Date().toISOString(),
      sessionId: null,
    };
    set((state) => {
      const newContribs = [...state.contributions, contribution];
      const dollars = amountCents / 100;
      const campaigns = state.campaigns.map((c) => {
        if (c.id !== campaignId) return c;
        const newCurrent = Number(((c.funding_current || 0) + dollars).toFixed(2));
        return {
          ...c,
          funding_current: newCurrent,
          amount_raised: newCurrent,
          percent_funded: c.funding_goal ? Math.round((newCurrent / c.funding_goal) * 100) : 0,
        };
      });
      return { contributions: newContribs, campaigns };
    });
    return contribution;
  },

  searchCampaigns: (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return get().getApprovedCampaigns();
    return get().campaigns.filter(
      (c) =>
        c.status === 'Approved' &&
        (c.title.toLowerCase().includes(q) ||
          c.tagline.toLowerCase().includes(q) ||
          c.short_description.toLowerCase().includes(q) ||
          c.category.includes(q))
    );
  },
}));
