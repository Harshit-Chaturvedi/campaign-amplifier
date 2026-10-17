export type CampaignCategory = 'environment' | 'health' | 'education' | 'consumer' | 'community' | 'civic';

export type CampaignStatus = 'Approved' | 'Pending' | 'Rejected' | 'Completed';

export type ReviewDecision = 'accepted' | 'on_hold' | 'rejected' | null;

export interface TrustScore {
  composite: number;
  fact_check: number;
  communication_integrity: number;
  shared_reality: number;
  decision: ReviewDecision;
  summary: string;
  sources_checked: number;
  model: string;
}

export interface CampaignSlide {
  description: string;
  image_url?: string;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  tagline: string;
  short_description: string;
  long_description: string;
  why_backers_should_care: string;
  category: CampaignCategory;
  status: CampaignStatus;
  currency: string;
  funding_goal: number;
  funding_current: number;
  amount_raised: number;
  percent_funded: number;
  thumbnail_url: string;
  ad_image_url: string;
  ad_headline: string;
  ad_primary_text: string;
  ad_image_prompt: string;
  target_audience: string;
  creator_name: string;
  created_by: string | null;
  created_at: string;
  campaign_starts_at: string;
  launched_at: string;
  delivered_at?: string;
  duration_days: number;
  evergreen: boolean;
  show_countdown: boolean;
  trust_score: number | null;
  uuts_review_decision: ReviewDecision;
  campaign_sources: string[];
  ad_platforms: string[];
  milestones: string[];
  hero_slideshow: CampaignSlide[];
  stripe_product_id: string;
  slides: CampaignSlide[];
  slideshowSupportTitle?: string;
  slideshowBackButtonText?: string;
}

export interface Contribution {
  id: string;
  campaignId: string;
  uid: string | null;
  email: string | null;
  name: string;
  amount_cents: number;
  amount_dollars: number;
  net_cents: number;
  created_at: string;
  sessionId: string | null;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  username: string;
  usernameLower: string;
  photoURL: string;
  bio: string;
  created_at: string;
}

export interface ImpactData {
  totalContributedCents: number;
  personalReach: number;
  personalViews: number;
  personalActions: number;
  totalReach: number;
  totalViews: number;
  totalActions: number;
  peopleReached: number;
  campaignsBacked: number;
  avgTrustScore: number;
  estimatedPerceptionShift: number;
  timeSeries: TimeSeriesPoint[];
  campaignSummaries: CampaignImpactSummary[];
}

export interface TimeSeriesPoint {
  date: string;
  reach: number;
  views: number;
  actions: number;
}

export interface CampaignImpactSummary {
  id: string;
  slug: string;
  title: string;
  category: CampaignCategory;
  thumbnail_url: string;
  trust_score: number | null;
  contributedCents: number;
  peopleReached: number;
}

export interface AdPlatform {
  key: string;
  label: string;
  configured: boolean;
}

export interface GeneratedCampaignContent {
  title: string;
  category: CampaignCategory;
  tagline: string;
  descriptionHtml: string;
  whyBackersShouldCareHtml: string;
  targetAudience: string;
  adHeadline: string;
  adPrimaryText: string;
  adImagePrompt: string;
  slides: CampaignSlide[];
  slideshowSupportTitle: string;
  slideshowBackButtonText: string;
  sources: string[];
}
