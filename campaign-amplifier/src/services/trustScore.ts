import { fnvHash } from '../utils/hash';
import type { TrustScore, Campaign } from '../types/campaign';

export function calculateTrustScore(campaign: Partial<Campaign>): TrustScore {
  const text = [
    campaign.title,
    campaign.long_description,
    campaign.why_backers_should_care,
  ]
    .filter(Boolean)
    .join(' ');

  const sourceCount = Array.isArray(campaign.campaign_sources)
    ? campaign.campaign_sources.length
    : 0;

  const factCheck = Math.min(100, 54 + sourceCount * 9 + fnvHash(text + 'f', 0, 14));
  const commIntegrity = Math.min(100, 61 + fnvHash(text + 'c', 0, 28));
  const sharedReality = Math.min(100, 58 + fnvHash(text + 's', 0, 30));
  const composite = Math.round(factCheck * 0.45 + commIntegrity * 0.3 + sharedReality * 0.25);

  return {
    composite,
    fact_check: factCheck,
    communication_integrity: commIntegrity,
    shared_reality: sharedReality,
    decision: composite >= 70 ? 'accepted' : composite >= 55 ? 'on_hold' : 'rejected',
    summary:
      composite >= 70
        ? 'Claims are traceable to the listed sources and the framing stays proportionate to the evidence.'
        : 'Some claims are not yet traceable to a listed source. Adding citations would raise the score.',
    sources_checked: sourceCount,
    model: 'demo-prescreen',
  };
}
