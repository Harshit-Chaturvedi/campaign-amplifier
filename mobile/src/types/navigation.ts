export type RootStackParamList = {
  Main: undefined;
  Login: undefined;
  Register: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
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
};

export type CreateStackParamList = {
  CreateLanding: undefined;
  CreateFlow: { draftId: string; step?: number };
  VoiceDraft: undefined;
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
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyContributions: undefined;
  MyCampaigns: undefined;
  Settings: undefined;
};
