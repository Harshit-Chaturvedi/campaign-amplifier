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
import { useDraftStore } from '../store/useDraftStore';
import { calculateBackerFee } from '../services/reach';
import { navigateToLogin } from '../navigation/navigationRef';

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

    const fundingGoal = raw.funding_goal ?? raw.fundingGoal ?? 5000;
    const amountRaised = raw.amount_raised ?? raw.amountRaised ?? 0;
    let status = raw.status as CampaignStatus;
    if (amountRaised >= fundingGoal && fundingGoal > 0 && (status === 'available_for_funding' || status === 'approved')) {
      status = 'goal_reached';
    }

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
      status,
      currency: raw.currency || 'USD',
      fundingGoal,
      amountRaised,
      percentFunded:
        raw.percent_funded ??
        raw.percentFunded ??
        (fundingGoal ? Math.round((amountRaised / fundingGoal) * 100) : 0),
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
      const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
      const headers: Record<string, string> = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(options.headers as Record<string, string>),
      };
      if (isFormData) {
        delete headers['Content-Type'];
      }
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
        if (response.status === 401 && token) {
          useAuthStore.getState().logout();
          navigateToLogin('Please sign in again');
        }
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

  async createDraft(payload: {
    title?: string;
    category?: string;
    creator_name?: string;
    summary?: string;
    funding_goal?: number;
  }): Promise<{ draft: any; isOffline: boolean }> {
    try {
      const url = `${API_BASE_URL}/drafts`;
      const res = await fetchWithTimeout(
        url,
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        20000, // 20s first request timeout
        0
      );
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const detail = errJson.detail || `Server returned ${res.status}`;
        const err: any = new Error(detail);
        err.status = res.status;
        err.detail = detail;
        err.isHttpError = true;
        if (res.status === 401) {
          err.isAuthError = true;
        }
        throw err;
      }
      const data = await res.json();
      return { draft: data, isOffline: false };
    } catch (err: any) {
      if (err.isAuthError || err.status === 401) {
        throw err;
      }
      if (err.isHttpError || err.status) {
        throw err;
      }
      const netErr: any = new Error("Can't reach the server. Retry.");
      netErr.isTimeout = true;
      netErr.isNetworkError = true;
      throw netErr;
    }
  },

  async patchDraft(id: string, patch: any): Promise<{ draft: any; isOffline: boolean }> {
    try {
      const url = `${API_BASE_URL}/drafts/${id}`;
      const res = await fetchWithTimeout(url, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const detail = errJson.detail || `Server returned ${res.status}`;
        const err: any = new Error(detail);
        err.status = res.status;
        err.detail = detail;
        err.isHttpError = true;
        throw err;
      }
      const data = await res.json();
      return { draft: data, isOffline: false };
    } catch (err: any) {
      if (err.isHttpError || err.status || (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && !err.message.includes('Failed to fetch') && !err.message.includes('timed out') && !err.message.includes('abort'))) {
        throw err;
      }
      return { draft: null, isOffline: true };
    }
  },

  async suggestFromText(text: string): Promise<{
    title: string;
    category: string;
    summary: string;
    tagline: string;
    target_audience: string;
    ad_headline: string;
    ad_description: string;
    suggested_sources: string[];
    demo_mode: boolean;
  }> {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Sign in required to request AI suggestions');
    }
    try {
      const url = `${API_BASE_URL}/ai/draft-from-text`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      // Local fallback - only extract URLs explicitly present in text, never invent sources
      const rawUrls = text.match(/https?:\/\/[^\s,;'\"<>]+|www\.[^\s,;'\"<>]+/g) || [];
      const sources = rawUrls.map((u) => (u.startsWith('http') ? u : `https://${u}`));
      return {
        title: text.slice(0, 50).trim() || 'A Local Initiative That Needs Action',
        category: 'community',
        summary: text.slice(0, 140).trim() || 'This campaign raises public awareness for community-level reform.',
        tagline: 'Amplifying real community priorities to decision makers.',
        target_audience: 'Residents, civic leaders, and local voters.',
        ad_headline: text.slice(0, 50).trim() || 'What the community records show.',
        ad_description: 'Read the documented sources and join our awareness campaign.',
        suggested_sources: sources,
        demo_mode: true,
      };
    }
  },

  async generateVoiceDraft(transcript: string): Promise<{
    title: string;
    category: string;
    summary: string;
    tagline: string;
    target_audience: string;
    ad_headline: string;
    ad_description: string;
    suggested_sources: string[];
    suggested_channels: string[];
    demo_mode: boolean;
  }> {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Sign in required to generate voice drafts');
    }
    try {
      const url = `${API_BASE_URL}/ai/voice-draft`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      // Local fallback - only extract URLs explicitly present in transcript, never invent sources
      const rawUrls = transcript.match(/https?:\/\/[^\s,;'\"<>]+|www\.[^\s,;'\"<>]+/g) || [];
      const sources = rawUrls.map((u) => (u.startsWith('http') ? u : `https://${u}`));
      return {
        title: 'Clean Drinking Water for Every Public School',
        category: 'health',
        summary: 'Elevated lead was documented across 11 county public schools. State replacement funds are active but require immediate district application.',
        tagline: 'Fixing school drinking water with existing state infrastructure grants.',
        target_audience: 'Parents, teachers, and municipal voters in the school district.',
        ad_headline: 'Eleven schools. Elevated lead. One deadline.',
        ad_description: 'The state will pay to replace the pipes, but only if the district applies. See the water test results.',
        suggested_sources: sources,
        suggested_channels: ['Meta', 'Instagram', 'Reddit'],
        demo_mode: true,
      };
    }
  },

  async transcribeAudio(audioUri: string): Promise<{ transcript: string }> {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Sign in required to transcribe audio');
    }

    const formData = new FormData();
    const fileExt = audioUri ? audioUri.split('.').pop()?.toLowerCase() || 'm4a' : 'm4a';
    const mimeType =
      fileExt === 'wav'
        ? 'audio/wav'
        : fileExt === 'mp3'
        ? 'audio/mpeg'
        : fileExt === 'ogg'
        ? 'audio/ogg'
        : fileExt === 'webm'
        ? 'audio/webm'
        : 'audio/mp4';

    if (Platform.OS === 'web' && audioUri.startsWith('blob:')) {
      try {
        const resp = await fetch(audioUri);
        const blob = await resp.blob();
        formData.append('file', blob, `recording.${fileExt}`);
      } catch {
        formData.append('file', {
          uri: audioUri,
          name: `recording.${fileExt}`,
          type: mimeType,
        } as any);
      }
    } else {
      formData.append('file', {
        uri: audioUri,
        name: `recording.${fileExt}`,
        type: mimeType,
      } as any);
    }

    const url = `${API_BASE_URL}/ai/transcribe`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Transcription failed with status ${res.status}`);
    }

    return await res.json();
  },

  async uploadFile(fileUri: string, filename = 'upload.jpg', mimeType = 'image/jpeg'): Promise<{ url: string; filename: string }> {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw new Error('Sign in required to upload files');
    }

    const formData = new FormData();
    if (Platform.OS === 'web' && fileUri.startsWith('blob:')) {
      try {
        const resp = await fetch(fileUri);
        const blob = await resp.blob();
        formData.append('file', blob, filename);
      } catch {
        formData.append('file', {
          uri: fileUri,
          name: filename,
          type: mimeType,
        } as any);
      }
    } else {
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    const url = `${API_BASE_URL}/uploads`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Upload failed with status ${res.status}`);
    }

    return await res.json();
  },

  async submitDraft(id: string): Promise<{ success: boolean; isOffline: boolean; campaignStatus?: string }> {
    try {
      const url = `${API_BASE_URL}/drafts/${id}/submit`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        const detail = errJson.detail || `Server returned ${res.status}`;
        const err: any = new Error(detail);
        err.status = res.status;
        err.detail = detail;
        err.isHttpError = true;
        throw err;
      }
      const data = await res.json();
      return {
        success: true,
        isOffline: false,
        campaignStatus: data.campaign_status || 'submitted',
      };
    } catch (err: any) {
      if (err.isHttpError || err.status || (err.message && !err.message.includes('fetch') && !err.message.includes('Network') && !err.message.includes('Failed to fetch') && !err.message.includes('timed out') && !err.message.includes('abort'))) {
        throw err;
      }
      throw new Error('You are offline. Your draft is saved on this device. Reconnect to submit.');
    }
  },

  async getMyCampaigns(status?: string): Promise<{ items: Campaign[]; isOffline: boolean }> {
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}` : '';
      const url = `${API_BASE_URL}/me/campaigns${qs}`;
      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const rawList = Array.isArray(data) ? data : data.items || [];
      const items = rawList.map(normalizeCampaign);
      return { items, isOffline: false };
    } catch {
      // Offline fallback: gather from useDraftStore and seed
      const allDrafts = Object.values(useDraftStore.getState().drafts);
      const convertedDrafts: Campaign[] = allDrafts.map((d) =>
        normalizeCampaign({
          id: d.id,
          slug: d.id,
          title: d.title || 'Untitled Draft',
          category: d.category || 'community',
          creator_name: d.creatorName || 'Organizer',
          creator_type: 'individual',
          summary: d.summary || '',
          tagline: d.headline || '',
          cover_url: d.coverUrl || '',
          status: d.step === 5 && d.fundingGoal ? 'submitted' : 'draft',
          funding_goal: d.fundingGoal || 1000,
          amount_raised: 0,
          percent_funded: 0,
          backer_count: 0,
          estimated_reach_at_goal: d.fundingGoal ? Math.round((d.fundingGoal * 0.95 / 14.5) * 1000 / 2.2) : 0,
          duration_days: d.durationDays || 30,
          created_at: d.updatedAt || new Date().toISOString(),
        })
      );
      let items = convertedDrafts;
      if (status) {
        items = items.filter((c) => c.status === status);
      }
      return { items, isOffline: true };
    }
  },

  async register(name: string, email: string, password = 'demo123'): Promise<{ token: string; user: any; isOffline: boolean }> {
    const url = `${API_BASE_URL}/auth/register`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify({ name, email: email.toLowerCase(), password, role: 'user' }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const detail = errJson.detail || `Registration failed (${res.status})`;
      const err: any = new Error(detail);
      err.status = res.status;
      err.detail = detail;
      throw err;
    }
    const data = await res.json();
    return { token: data.access_token, user: data.user, isOffline: false };
  },

  async login(email: string, password = 'demo123'): Promise<{ token: string; user: any; isOffline: boolean }> {
    const url = `${API_BASE_URL}/auth/login`;
    const res = await fetchWithTimeout(url, {
      method: 'POST',
      body: JSON.stringify({ email: email.toLowerCase(), password }),
    });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      const detail = errJson.detail || 'Invalid email or password';
      const err: any = new Error(detail);
      err.status = res.status;
      err.detail = detail;
      if (res.status === 401) err.isAuthError = true;
      throw err;
    }
    const data = await res.json();
    return { token: data.access_token, user: data.user, isOffline: false };
  },

  async createContribution(params: {
    campaignId: string;
    amount: number;
    showName?: boolean;
    guestEmail?: string | null;
  }): Promise<{
    id: string;
    campaignId: string;
    amount: number;
    fee: number;
    total: number;
    status: string;
    showName: boolean;
    receiptNo: string;
    createdAt: string;
    backerName?: string;
    isOffline: boolean;
  }> {
    try {
      const url = `${API_BASE_URL}/contributions`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: params.campaignId,
          amount: params.amount,
          show_name: !!params.showName,
          guest_email: params.guestEmail?.trim() || undefined,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      return {
        id: data.id,
        campaignId: data.campaign_id,
        amount: data.amount,
        fee: data.fee,
        total: data.total,
        status: data.status,
        showName: data.show_name,
        receiptNo: data.receipt_no,
        createdAt: data.created_at,
        backerName: data.backer_name,
        isOffline: false,
      };
    } catch (err: any) {
      if (
        err.message &&
        !err.message.includes('fetch') &&
        !err.message.includes('Network') &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('timed out')
      ) {
        throw err;
      }
      // Offline fallback
      const { fee, total } = calculateBackerFee(params.amount);
      const contribId = `con-${Math.random().toString(36).slice(2, 10)}`;
      const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
      return {
        id: contribId,
        campaignId: params.campaignId,
        amount: params.amount,
        fee,
        total,
        status: 'pending',
        showName: !!params.showName,
        receiptNo,
        createdAt: new Date().toISOString(),
        backerName: params.showName ? 'Community Backer' : 'Anonymous',
        isOffline: true,
      };
    }
  },

  async simulatePayment(params: {
    contributionId: string;
    outcome: 'success' | 'pending' | 'failed' | 'cancelled' | 'rejected';
  }): Promise<{
    status: string;
    contributionId: string;
    paymentStatus: string;
    receiptNo: string;
    amount: number;
    campaignAmountRaised?: number;
    campaignStatus?: string;
    isOffline: boolean;
  }> {
    try {
      const url = `${API_BASE_URL}/payments/simulate`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({
          contribution_id: params.contributionId,
          outcome: params.outcome,
        }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.detail || `Server error: ${res.status}`);
      }
      const data = await res.json();
      return {
        status: data.status,
        contributionId: data.contribution_id,
        paymentStatus: data.payment_status,
        receiptNo: data.receipt_no,
        amount: data.amount,
        campaignAmountRaised: data.campaign_amount_raised,
        campaignStatus: data.campaign_status,
        isOffline: false,
      };
    } catch (err: any) {
      if (
        err.message &&
        !err.message.includes('fetch') &&
        !err.message.includes('Network') &&
        !err.message.includes('Failed to fetch') &&
        !err.message.includes('timed out')
      ) {
        throw err;
      }
      return {
        status: 'ok',
        contributionId: params.contributionId,
        paymentStatus: params.outcome === 'success' ? 'succeeded' : params.outcome,
        receiptNo: `REC-${new Date().getFullYear()}-OFFLINE`,
        amount: 50,
        isOffline: true,
      };
    }
  },

  async getReceipt(receiptNoOrId: string): Promise<any> {
    try {
      const url = `${API_BASE_URL}/receipts/${encodeURIComponent(receiptNoOrId)}`;
      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return null;
    }
  },

  async getNotifications(tab = 'all'): Promise<{ items: any[]; isOffline: boolean }> {
    try {
      const url = `${API_BASE_URL}/notifications?tab=${encodeURIComponent(tab)}`;
      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { items: Array.isArray(data) ? data : data.items || [], isOffline: false };
    } catch {
      return { items: [], isOffline: true };
    }
  },

  async markNotificationRead(id: string): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/notifications/${encodeURIComponent(id)}/read`;
      const res = await fetchWithTimeout(url, { method: 'PATCH' });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getNotificationPrefs(): Promise<any> {
    try {
      const url = `${API_BASE_URL}/notification-prefs`;
      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch {
      return {
        funding_milestones: true,
        campaign_updates: true,
        delivery_reports: true,
        marketing: false,
      };
    }
  },

  async updateNotificationPrefs(prefs: any): Promise<boolean> {
    try {
      const url = `${API_BASE_URL}/notification-prefs`;
      const res = await fetchWithTimeout(url, {
        method: 'PUT',
        body: JSON.stringify(prefs),
      });
      return res.ok;
    } catch {
      return true;
    }
  },

  async getCampaignAnalytics(id: string): Promise<{ data: any; isOffline: boolean }> {
    try {
      const url = `${API_BASE_URL}/campaigns/${encodeURIComponent(id)}/analytics`;
      const res = await fetchWithTimeout(url, { method: 'GET' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { data, isOffline: false };
    } catch {
      // Local fallback
      return {
        data: {
          campaign_id: id,
          title: 'Amplification Campaign',
          status: 'available_for_funding',
          funding: {
            amount_raised: 5340,
            funding_goal: 8000,
            percent_funded: 67,
            backer_count: 4,
          },
          budget: {
            total_raised: 5340,
            ad_budget: 5073,
            platform_fee: 267,
            spent: 0,
          },
          delivery: {
            estimated: {
              reach: 156000,
              impressions: 343310,
              label: 'Estimate',
            },
            measured: null,
          },
        },
        isOffline: true,
      };
    }
  },

  async postCampaignUpdate(id: string, title: string, body: string): Promise<{ success: boolean; update?: any }> {
    try {
      const url = `${API_BASE_URL}/campaigns/${encodeURIComponent(id)}/updates`;
      const res = await fetchWithTimeout(url, {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, update: data };
    } catch (err: any) {
      return {
        success: true,
        update: {
          id: `up-${Date.now()}`,
          campaign_id: id,
          title,
          body,
          created_at: new Date().toISOString(),
        },
      };
    }
  },

  async respondToReview(id: string): Promise<{ success: boolean; status?: string }> {
    try {
      const url = `${API_BASE_URL}/campaigns/${encodeURIComponent(id)}/respond`;
      const res = await fetchWithTimeout(url, { method: 'POST' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return { success: true, status: data.status };
    } catch (err: any) {
      return { success: true, status: 'submitted' };
    }
  },
};
