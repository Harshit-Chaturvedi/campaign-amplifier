export type CampaignCategory =
  | 'environment'
  | 'health'
  | 'science'
  | 'education'
  | 'public_policy'
  | 'economic_policy'
  | 'community'
  | 'arts_culture'
  | 'business'
  | 'other';

export type CreatorType = 'individual' | 'creator' | 'nonprofit' | 'business' | 'community_group';

export type CampaignStatus =
  | 'draft'
  | 'submitted'
  | 'changes_requested'
  | 'approved'
  | 'available_for_funding'
  | 'goal_reached'
  | 'funding_ended'
  | 'distribution_preparation'
  | 'promoting'
  | 'completed'
  | 'rejected'
  | 'cancelled'
  | 'refund_pending'
  | 'failed';

export type StoryBlock =
  | { type: 'heading'; text: string; level?: 1 | 2 | 3 }
  | { type: 'paragraph'; text: string }
  | { type: 'image'; url: string; caption?: string; credit?: string }
  | { type: 'statistic'; value: string; label: string }
  | { type: 'quote'; quote: string; attribution?: string }
  | { type: 'action'; title: string; description: string; url?: string };

export interface Source {
  id: string;
  title: string;
  url: string;
}

export interface AdAssets {
  coverUrl: string;
  adImages: string[];
  videoUrl?: string;
  headline: string;
  description: string;
  cta: string;
}

export interface ReachSettings {
  locations: string[];
  interests: string[];
  channels: string[];
  budgetAllocation: Record<string, number>;
  durationDays: number;
  platformFinalized?: boolean;
}

export interface Report {
  fundsRaised: number;
  adSpend: number;
  impressions: number;
  measuredReach: number;
  clicks: number;
  estimatedReach: number;
  final: boolean;
  completedAt?: string;
  summaryNotes?: string;
}

export interface MeasuredDelivery {
  impressions: number;
  measuredReach: number;
  clicks: number;
  adSpend: number;
  lastUpdated: string;
}

export interface Campaign {
  id: string;
  slug: string;
  title: string;
  summary: string;
  tagline?: string;
  category: CampaignCategory;
  creatorType: CreatorType;
  creatorName: string;
  creatorId: string | null;
  status: CampaignStatus;
  currency: string;

  // Funding details (goal entered by creator in Step 5)
  fundingGoal: number;
  amountRaised: number;
  percentFunded: number;
  backerCount: number;

  // Editorial story & sources
  storyBlocks: StoryBlock[];
  sources: Source[];

  // Ad distribution assets & reach parameters
  adAssets: AdAssets;
  reachSettings: ReachSettings;

  // Reach figures
  estimatedReachAtGoal: number;
  durationDays?: number;
  measuredDelivery?: MeasuredDelivery;
  report?: Report;

  // Moderation & audit
  moderationFeedback?: string;
  draftStep?: number; // 1 to 5 for draft progress

  // Lifecycle timestamps
  createdAt: string;
  updatedAt?: string;
  submittedAt?: string;
  approvedAt?: string;
  publishedAt?: string;
  deadline?: string;
  promotingAt?: string;
  completedAt?: string;
}

export type ContributionStatus =
  | 'pending'
  | 'succeeded'
  | 'failed'
  | 'cancelled'
  | 'rejected'
  | 'refunded';

export interface Contribution {
  id: string;
  campaignId: string;
  userId?: string | null;
  guestEmail?: string | null;
  amount: number; // dollars
  fee: number;    // dollars
  total: number;  // dollars
  status: ContributionStatus;
  showName: boolean; // default false
  backerName: string; // "Anonymous" if showName is false
  receiptNo: string;
  createdAt: string;
  estimatedReach?: number;
}

export interface CampaignUpdate {
  id: string;
  campaignId: string;
  title: string;
  body: string;
  createdAt: string;
  authorName: string;
}

export interface ModerationEvent {
  id: string;
  campaignId: string;
  actorId: string;
  actorRole: 'creator' | 'reviewer' | 'admin' | 'system';
  fromStatus: CampaignStatus;
  toStatus: CampaignStatus;
  note?: string;
  createdAt: string;
}

export type NotificationType =
  | 'submission_received'
  | 'review_decision'
  | 'funding_milestone'
  | 'deadline_approaching'
  | 'contribution_status'
  | 'contribution'
  | 'promotion_started'
  | 'distribution_progress'
  | 'campaign_completed'
  | 'final_report'
  | 'update';

export interface AppNotification {
  id: string;
  userId?: string;
  type: NotificationType;
  campaignId?: string;
  campaignTitle?: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  username: string;
  usernameLower?: string;
  role?: 'user' | 'creator' | 'admin';
  photoURL?: string;
  bio?: string;
  createdAt: string;
}

export interface AdPlatform {
  key: string;
  label: string;
  configured: boolean;
  icon?: string;
}

export interface GeneratedCampaignContent {
  title: string;
  category: CampaignCategory;
  tagline: string;
  summary: string;
  storyBlocks: StoryBlock[];
  targetAudience: string;
  adHeadline: string;
  adPrimaryText: string;
  adImagePrompt: string;
  sources: Source[];
}
