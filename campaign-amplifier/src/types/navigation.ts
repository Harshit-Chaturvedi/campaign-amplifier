import type { Campaign } from './campaign';

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type MainTabParamList = {
  HomeTab: undefined;
  ExploreTab: undefined;
  CreateTab: undefined;
  ImpactTab: undefined;
  ProfileTab: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  CampaignDetail: { campaignId: string };
  FundCampaign: { campaignId: string };
  ThankYou: { campaignId: string; amount: number };
};

export type ExploreStackParamList = {
  Explore: undefined;
  CampaignDetail: { campaignId: string };
};

export type CreateStackParamList = {
  CreateCampaign: undefined;
};

export type ImpactStackParamList = {
  ImpactDashboard: undefined;
  CampaignImpact: { campaignId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  MyContributions: undefined;
  MyCampaigns: undefined;
  Settings: undefined;
};
