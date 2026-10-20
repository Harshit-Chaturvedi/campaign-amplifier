export type RootStackParamList = {
  Main: undefined;
  Login: { message?: string } | undefined;
  Register: undefined;
};

export type AuthStackParamList = {
  Login: { message?: string } | undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  CreateTab: undefined;
  ActivityTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  CampaignDetail: { campaignId: string };
  FundCampaign: { campaignId: string; initialAmount?: number };
  ThankYou: {
    campaignId: string;
    amount: number;
    receiptNo?: string;
    estimatedReach?: number;
    fee?: number;
    total?: number;
    paymentStatus?: string;
  };
  Report: { campaignId: string };
  InfoPage: { slug: string };
};

export type ExploreStackParamList = {
  Explore: undefined;
  CampaignDetail: { campaignId: string };
  FundCampaign: { campaignId: string; initialAmount?: number };
  ThankYou: {
    campaignId: string;
    amount: number;
    receiptNo?: string;
    estimatedReach?: number;
    fee?: number;
    total?: number;
    paymentStatus?: string;
  };
  Report: { campaignId: string };
  InfoPage: { slug: string };
};

export type CreateStackParamList = {
  CreateLanding: undefined;
  CreateFlow: { draftId: string; step?: number };
};

export type ActivityStackParamList = {
  Activity: undefined;
  CampaignDetail: { campaignId: string };
  FundCampaign: { campaignId: string; initialAmount?: number };
  ThankYou: {
    campaignId: string;
    amount: number;
    receiptNo?: string;
    estimatedReach?: number;
    fee?: number;
    total?: number;
    paymentStatus?: string;
  };
  Report: { campaignId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyContributions: undefined;
  MyCampaigns: undefined;
  CreatorDashboard: { initialTab?: string } | undefined;
  CreateFlow: { draftId: string; step?: number };
  Report: { campaignId: string };
  InfoPage: { slug: string };
  CampaignDetail: { campaignId: string };
  FundCampaign: { campaignId: string; initialAmount?: number };
  ThankYou: {
    campaignId: string;
    amount: number;
    receiptNo?: string;
    estimatedReach?: number;
    fee?: number;
    total?: number;
    paymentStatus?: string;
  };
  Settings: undefined;
  AdminConsole: undefined;
  AdminReviewDetail: { campaignId: string };
};
