import type { Contribution, Campaign, CampaignCategory } from '../types/campaign';
import { estimateReach, estimateReachPerDollar } from './reach';

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
  contributedDollars: number;
  peopleReached: number;
}

export interface ImpactData {
  totalContributedDollars: number;
  personalReach: number;
  personalViews: number;
  personalActions: number;
  totalReach: number;
  totalViews: number;
  totalActions: number;
  peopleReached: number;
  campaignsBacked: number;
  timeSeries: TimeSeriesPoint[];
  campaignSummaries: CampaignImpactSummary[];
}

export function calculateContributionStats(contributions: Contribution[]) {
  const dollars = contributions.reduce((s, c) => s + (c.amount || 0), 0);
  const reach = estimateReach(dollars).estimate;
  return { dollars, reach };
}

export function buildTimeSeries(contributions: Contribution[]): TimeSeriesPoint[] {
  const byDate = new Map<string, number>();
  contributions.forEach((c) => {
    const d = (c.createdAt || new Date().toISOString()).slice(0, 10);
    byDate.set(d, (byDate.get(d) || 0) + (c.amount || 0));
  });
  const dates = [...byDate.keys()].sort();
  let cumulative = 0;
  return dates.map((date) => {
    cumulative += byDate.get(date)!;
    const dollars = cumulative;
    const reach = estimateReach(dollars).estimate;
    return {
      date,
      reach,
      views: Math.round(reach * 1.6),
      actions: Math.round(reach * 0.04),
    };
  });
}

export function calculateImpact(
  contributions: Contribution[],
  getCampaign: (id: string) => Campaign | undefined
): ImpactData {
  const { dollars, reach } = calculateContributionStats(contributions);
  const campaignIds = [...new Set(contributions.map((c) => c.campaignId))];
  const campaigns = campaignIds.map(getCampaign).filter(Boolean) as Campaign[];

  const summaries: CampaignImpactSummary[] = campaigns.map((camp) => {
    const campContribs = contributions.filter((c) => c.campaignId === camp.id);
    const stats = calculateContributionStats(campContribs);
    return {
      id: camp.id,
      slug: camp.slug,
      title: camp.title,
      category: camp.category,
      thumbnail_url: camp.adAssets?.coverUrl || '',
      contributedDollars: stats.dollars,
      peopleReached: stats.reach,
    };
  });

  return {
    totalContributedDollars: dollars,
    personalReach: reach,
    personalViews: Math.round(reach * 1.6),
    personalActions: Math.round(reach * 0.016),
    totalReach: reach,
    totalViews: Math.round(reach * 1.6),
    totalActions: Math.round(reach * 0.016),
    peopleReached: reach,
    campaignsBacked: campaignIds.length,
    timeSeries: buildTimeSeries(contributions),
    campaignSummaries: summaries,
  };
}
