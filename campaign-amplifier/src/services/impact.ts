import type { Contribution, ImpactData, Campaign, TimeSeriesPoint, CampaignImpactSummary } from '../types/campaign';
import { fnvHash } from '../utils/hash';

const REACH_PER_DOLLAR = 27;

export function calculateContributionStats(contributions: Contribution[]) {
  const totalCents = contributions.reduce((s, c) => s + c.amount_cents, 0);
  const dollars = totalCents / 100;
  const reach = Math.round(dollars * REACH_PER_DOLLAR);
  return { totalCents, dollars, reach };
}

export function buildTimeSeries(contributions: Contribution[]): TimeSeriesPoint[] {
  const byDate = new Map<string, number>();
  contributions.forEach((c) => {
    const d = c.created_at.slice(0, 10);
    byDate.set(d, (byDate.get(d) || 0) + c.amount_cents);
  });
  const dates = [...byDate.keys()].sort();
  let cumulative = 0;
  return dates.map((date) => {
    cumulative += byDate.get(date)!;
    const dollars = cumulative / 100;
    return {
      date,
      reach: Math.round(dollars * REACH_PER_DOLLAR),
      views: Math.round(dollars * REACH_PER_DOLLAR * 1.6),
      actions: Math.round(dollars * 0.42),
    };
  });
}

export function calculateImpact(
  contributions: Contribution[],
  getCampaign: (id: string) => Campaign | undefined
): ImpactData {
  const { totalCents, reach } = calculateContributionStats(contributions);
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
      thumbnail_url: camp.thumbnail_url || '',
      trust_score: camp.trust_score,
      contributedCents: stats.totalCents,
      peopleReached: stats.reach,
    };
  });

  return {
    totalContributedCents: totalCents,
    personalReach: reach,
    personalViews: Math.round(reach * 1.6),
    personalActions: Math.round(reach * 0.016),
    totalReach: reach,
    totalViews: Math.round(reach * 1.6),
    totalActions: Math.round(reach * 0.016),
    peopleReached: reach,
    campaignsBacked: campaignIds.length,
    avgTrustScore: campaigns.length
      ? Math.round(campaigns.reduce((s, c) => s + (c.trust_score || 80), 0) / campaigns.length)
      : 0,
    estimatedPerceptionShift: 7.4,
    timeSeries: buildTimeSeries(contributions),
    campaignSummaries: summaries,
  };
}
