import { Platform } from 'react-native';
import { create } from 'zustand';
import type {
  Campaign,
  CampaignCategory,
  CampaignStatus,
  CreatorType,
  StoryBlock,
  Source,
  AdAssets,
  ReachSettings,
  Report,
} from '../types/campaign';
import { seedCampaigns } from '../data/seedData';
import { useAuthStore } from '../store/useAuthStore';

interface ServerStatusState {
  isWakingUp: boolean;
  setIsWakingUp: (waking: boolean) => void;
}

export const useServerStatusStore = create<ServerStatusState>((set) => ({
  isWakingUp: false,
  setIsWakingUp: (waking) => set({ isWakingUp: waking }),
}));

// Use EXPO_PUBLIC_API_URL when set; only use localhost / 10.0.2.2 when missing in development
function resolveApiUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (envUrl && envUrl.length > 0) {
    if (Platform.OS === 'android' && envUrl.includes('localhost')) {
      return envUrl.replace('localhost', '10.0.2.2');
    }
    return envUrl;
  }
  return Platform.OS === 'android'
    ? 'http://10.0.2.2:8000/api/v1'
    : 'http://localhost:8000/api/v1';
}

export const API_BASE_URL = resolveApiUrl();

export interface ApiError {
  status: number;
  message: string;
  detail?: any;
}

export interface CampaignsQueryParams {
  q?: string;
  category?: string;
  sort?: string;
  status?: string;
  fundingPct?: string; // 'under50' | '50to99' | '100plus'
  page?: number;
  limit?: number;
}

export interface CampaignsResult {
  items: Campaign[];
  total: number;
  isOffline: boolean;
}

export interface CampaignResult {
  campaign: Campaign;
  isOffline: boolean;
}

// Normalizer: transforms backend snake_case campaign object into camelCase Campaign
export function normalizeCampaign(raw: any): Campaign {
  if (!raw) throw new Error('Cannot normalize null campaign');

  const storyBlocks: StoryBlock[] = Array.isArray(raw.story_blocks)
    ? raw.story_blocks.map((b: any) => ({
        type: b.type,
        text: b.text || b.content?.text || '',
        level: b.level || b.content?.level,
        url: b.url || b.content?.url || '',
        caption: b.caption || b.content?.caption,
        credit: b.credit || b.content?.credit,
        value: b.value || b.content?.value || '',
        label: b.label || b.content?.label || '',
        quote: b.quote || b.content?.quote || '',
        attribution: b.attribution || b.content?.attribution,
        title: b.title || b.content?.title || '',
        description: b.description || b.content?.description || '',
      }))
    : raw.storyBlocks || [];

  const sources: Source[] = Array.isArray(raw.sources)
    ? raw.sources.map((s: any, idx: number) => ({
        id: s.id || `src-${idx}`,
        title: s.title || '',
        url: s.url || '',
      }))
    : raw.sources || [];

  const adAssets: AdAssets = {
    coverUrl: raw.cover_url || raw.adAssets?.coverUrl || '',
    adImages: raw.ad_images || raw.adAssets?.adImages || [],
    videoUrl: raw.video_url || raw.adAssets?.videoUrl,
    headline: raw.headline || raw.adAssets?.headline || raw.title?.slice(0, 60) || '',
    description: raw.ad_description || raw.adAssets?.description || raw.summary || '',
    cta: raw.cta || raw.adAssets?.cta || 'Learn More',
  };

  const reachSettings: ReachSettings = {
    locations: raw.reach?.locations || raw.reachSettings?.locations || ['United States'],
    interests: raw.reach?.interests || raw.reachSettings?.interests || ['General Community'],
    channels: raw.reach?.channels || raw.reachSettings?.channels || ['Meta', 'Instagram'],
    budgetAllocation: raw.reach?.budget_allocation || raw.reachSettings?.budgetAllocation || { Meta: 60, Instagram: 40 },
    durationDays: raw.duration_days || raw.reachSettings?.durationDays || 30,
    platformFinalized: raw.reach?.platform_finalized || raw.reachSettings?.platformFinalized,
  };

  const report: Report | undefined = raw.report
    ? {
        fundsRaised: raw.report.funds_raised ?? raw.report.fundsRaised ?? raw.amount_raised,
        adSpend: raw.report.ad_spend ?? raw.report.adSpend ?? Math.round(raw.amount_raised * 0.95),
        impressions: raw.report.impressions ?? 0,
        measuredReach: raw.report.measured_reach ?? raw.report.measuredReach ?? 0,
        clicks: raw.report.clicks ?? 0,
        estimatedReach: raw.report.est_reach ?? raw.report.estimatedReach ?? raw.estimated_reach_at_goal,
        final: raw.report.final ?? false,
      }
    : raw.report;

  return {
    id: raw.id,
    slug: raw.slug || raw.id,
    title: raw.title,
    summary: raw.summary,
    tagline: raw.tagline || '',
    category: raw.category as CampaignCategory,
    creatorType: (raw.creator_type || raw.creatorType || 'nonprofit') as CreatorType,
    creatorName: raw.creator_name || raw.creatorName || 'Campaign Organizer',
    creatorId: raw.owner_id || raw.creator_id || raw.creatorId || null,
    status: raw.status as CampaignStatus,
    currency: raw.currency || 'USD',
    fundingGoal: raw.funding_goal ?? raw.fundingGoal ?? 5000,
    amountRaised: raw.amount_raised ?? raw.amountRaised ?? 0,
    percentFunded:
      raw.percent_funded ??
      raw.percentFunded ??
      (raw.funding_goal ? Math.round(((raw.amount_raised ?? 0) / raw.funding_goal) * 100) : 0),
    backerCount: raw.backer_count ?? raw.backerCount ?? 0,
    estimatedReachAtGoal: raw.estimated_reach_at_goal ?? raw.estimatedReachAtGoal ?? 0,
    durationDays: raw.duration_days ?? raw.durationDays ?? 30,
    createdAt: raw.created_at || raw.createdAt || new Date().toISOString(),
    publishedAt: raw.published_at || raw.publishedAt,
    submittedAt: raw.submitted_at || raw.submittedAt,
    deadline: raw.deadline || raw.deadline,
    storyBlocks,
    sources,
    adAssets,
    reachSettings,
    report,
  };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 65000,
  retries = 1
): Promise<Response> {
  // If request takes longer than 2.5s (free tier cold start), flag UI
  const wakeUpTimer = setTimeout(() => {
    useServerStatusStore.getState().setIsWakingUp(true);
  }, 2500);

  try {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);

      const token = useAuthStore.getState().token;
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(options.headers as Record<string, string>),
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers,
          signal: controller.signal,
        });
        clearTimeout(id);
        return response;
      } catch (err: any) {
        clearTimeout(id);
        if (attempt < retries) {
          useServerStatusStore.getState().setIsWakingUp(true);
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }
        throw err;
      }
    }
    throw new Error('Request failed after retries');
  } finally {
    clearTimeout(wakeUpTimer);
    useServerStatusStore.getState().setIsWakingUp(false);
  }
}

// Client methods with graceful seed data fallback
export const apiClient = {
  async getCampaigns(params: CampaignsQueryParams = {}): Promise<CampaignsResult> {
    try {
      const queryParts: string[] = [];
      if (params.q) queryParts.push(`q=${encodeURIComponent(params.q)}`);
      if (params.category && params.category !== 'all') queryParts.push(`category=${encodeURIComponent(params.category)}`);
      if (params.sort) queryParts.push(`sort=${encodeURIComponent(params.sort)}`);
      if (params.status && params.status !== 'all') queryParts.push(`status=${encodeURIComponent(params.status)}`);
      if (params.page) queryParts.push(`page=${params.page}`);
      if (params.limit) queryParts.push(`limit=${params.limit}`);

      const qs = queryParts.length ? `?${queryParts.join('&')}` : '';
      const url = `${API_BASE_URL}/campaigns${qs}`;

      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      const rawList = Array.isArray(data) ? data : data.items || [];
      let items = rawList.map(normalizeCampaign);

      // Apply funding % filter client-side if specified
      if (params.fundingPct) {
        if (params.fundingPct === 'under50') {
          items = items.filter((c: Campaign) => (c.percentFunded ?? 0) < 50);
        } else if (params.fundingPct === '50to99') {
          items = items.filter((c: Campaign) => (c.percentFunded ?? 0) >= 50 && (c.percentFunded ?? 0) < 100);
        } else if (params.fundingPct === '100plus') {
          items = items.filter((c: Campaign) => (c.percentFunded ?? 0) >= 100);
        }
      }

      return {
        items,
        total: items.length,
        isOffline: false,
      };
    } catch {
      // Fallback to bundled seed data
      let filtered = [...seedCampaigns];

      if (params.status && params.status !== 'all') {
        filtered = filtered.filter((c) => c.status === params.status);
      } else {
        filtered = filtered.filter((c) =>
          ['available_for_funding', 'goal_reached', 'distribution_preparation', 'promoting', 'completed'].includes(c.status)
        );
      }

      if (params.category && params.category !== 'all') {
        filtered = filtered.filter((c) => c.category === params.category);
      }

      if (params.q) {
        const query = params.q.toLowerCase().trim();
        filtered = filtered.filter(
          (c) =>
            c.title.toLowerCase().includes(query) ||
            c.summary.toLowerCase().includes(query) ||
            c.creatorName.toLowerCase().includes(query) ||
            c.category.toLowerCase().includes(query)
        );
      }

      if (params.fundingPct) {
        if (params.fundingPct === 'under50') {
          filtered = filtered.filter((c) => (c.percentFunded ?? 0) < 50);
        } else if (params.fundingPct === '50to99') {
          filtered = filtered.filter((c) => (c.percentFunded ?? 0) >= 50 && (c.percentFunded ?? 0) < 100);
        } else if (params.fundingPct === '100plus') {
          filtered = filtered.filter((c) => (c.percentFunded ?? 0) >= 100);
        }
      }

      // Sort
      if (params.sort === 'newest') {
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (params.sort === 'most_funded') {
        filtered.sort((a, b) => (b.amountRaised || 0) - (a.amountRaised || 0));
      } else if (params.sort === 'ending_soon') {
        filtered.sort((a, b) => (a.durationDays || 30) - (b.durationDays || 30));
      } else if (params.sort === 'closest_to_goal') {
        filtered.sort((a, b) => (b.percentFunded || 0) - (a.percentFunded || 0));
      } else {
        // Trending
        filtered.sort((a, b) => (b.backerCount || 0) - (a.backerCount || 0));
      }

      return {
        items: filtered,
        total: filtered.length,
        isOffline: true,
      };
    }
  },

  async getCampaign(idOrSlug: string): Promise<CampaignResult> {
    try {
      const url = `${API_BASE_URL}/campaigns/${encodeURIComponent(idOrSlug)}`;
      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      const data = await res.json();
      return {
        campaign: normalizeCampaign(data),
        isOffline: false,
      };
    } catch {
      const decoded = decodeURIComponent(idOrSlug).toLowerCase();
      const match = seedCampaigns.find(
        (c) => c.id.toLowerCase() === decoded || c.slug.toLowerCase() === decoded
      );
      if (match) {
        return {
          campaign: match,
          isOffline: true,
        };
      }
      throw new Error('Campaign not found');
    }
  },

  async submitFeedback(
    campaignId: string,
    feedback: { visualsKeptReading: string; changedMind: string }
  ): Promise<{ success: boolean; isOffline: boolean }> {
    try {
      const url = `${API_BASE_URL}/campaigns/${campaignId}/feedback`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({
          visuals_kept_reading: feedback.visualsKeptReading,
          changed_mind: feedback.changedMind,
        }),
      });
      return {
        success: res.ok,
        isOffline: false,
      };
    } catch {
      return {
        success: true,
        isOffline: true,
      };
    }
  },
};
