import { demoConfig, DemoConfig } from '../config/demoConfig';

export interface ReachEstimateResult {
  estimate: number;
  adBudget: number;
  impressions: number;
  assumptions: {
    cpmUsd: number;
    avgFrequency: number;
    platformFeePct: number;
  };
  label: 'Estimate';
}

/**
 * Calculates estimated reach from a contribution or campaign goal.
 * Formula:
 * 1. adBudget = amount * (1 - platformFeePct)
 * 2. impressions = (adBudget / cpmUsd) * 1000
 * 3. estimate = Math.round(impressions / avgFrequency)
 */
export function estimateReach(
  amount: number,
  config: DemoConfig = demoConfig
): ReachEstimateResult {
  const safeAmount = Math.max(0, amount);
  const adBudget = Number((safeAmount * (1 - config.platformFeePct)).toFixed(2));
  const impressions = Math.round((adBudget / config.cpmUsd) * 1000);
  const estimate = Math.round(impressions / config.avgFrequency);

  return {
    estimate,
    adBudget,
    impressions,
    assumptions: {
      cpmUsd: config.cpmUsd,
      avgFrequency: config.avgFrequency,
      platformFeePct: config.platformFeePct,
    },
    label: 'Estimate',
  };
}

/**
 * Calculates estimated reach per $1 of contribution.
 */
export function estimateReachPerDollar(config: DemoConfig = demoConfig): number {
  return estimateReach(1, config).estimate;
}

/**
 * Calculates backer transaction fees (platform + payment processor).
 */
export function calculateBackerFee(
  amount: number,
  config: DemoConfig = demoConfig
): { fee: number; total: number } {
  const fee = Number((amount * config.paymentFeePct + config.paymentFeeFixed).toFixed(2));
  const total = Number((amount + fee).toFixed(2));
  return { fee, total };
}
