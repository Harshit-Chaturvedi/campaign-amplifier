/**
 * Media resolution helpers for campaigns and ad assets.
 */

export function getCoverUrl(campaign: any): string | null {
  if (!campaign) return null;
  const url =
    campaign.adAssets?.coverUrl ||
    campaign.coverUrl ||
    campaign.thumbnailUrl;

  if (typeof url === 'string' && url.trim().length > 0) {
    return url.trim();
  }
  return null;
}
