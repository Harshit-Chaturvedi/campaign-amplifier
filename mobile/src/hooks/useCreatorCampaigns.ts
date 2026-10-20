import { useMemo } from 'react';

export interface CreatorCampaignBuckets {
  all: any[];
  drafts: any[];
  under_review: any[];
  published: any[];
  promoting: any[];
  completed: any[];
  requires_action: any[];
  counts: {
    drafts: number;
    under_review: number;
    published: number;
    promoting: number;
    completed: number;
    requires_action: number;
  };
}

/**
 * Pure selector that computes categorized campaigns and exact counts for a creator.
 * Guarantees strict ownership filtering: unowned campaigns (e.g. undefined/null owner)
 * are NEVER attributed to any user.
 */
export function filterAndBucketCreatorCampaigns(
  campaigns: any[],
  userId: string | null | undefined,
  drafts: any[] = []
): CreatorCampaignBuckets {
  const safeDrafts = Array.isArray(drafts) ? drafts : [];

  if (!userId || typeof userId !== 'string' || userId.trim() === '') {
    return {
      all: [],
      drafts: safeDrafts,
      under_review: [],
      published: [],
      promoting: [],
      completed: [],
      requires_action: [],
      counts: {
        drafts: safeDrafts.length,
        under_review: 0,
        published: 0,
        promoting: 0,
        completed: 0,
        requires_action: 0,
      },
    };
  }

  const trimmedUid = userId.trim();

  // Strict ownership check — owner property must be explicitly present and equal to trimmedUid
  const userCampaigns = (campaigns || []).filter((c) => {
    if (!c) return false;
    const owner = c.owner_id || c.ownerId || c.creatorId || c.created_by;
    return typeof owner === 'string' && owner.trim() === trimmedUid;
  });

  const under_review = userCampaigns.filter((c) =>
    ['submitted', 'in_review', 'under_review'].includes(c.status)
  );
  const published = userCampaigns.filter((c) =>
    ['approved', 'available_for_funding', 'goal_reached'].includes(c.status)
  );
  const promoting = userCampaigns.filter((c) =>
    ['distribution_preparation', 'promoting'].includes(c.status)
  );
  const completed = userCampaigns.filter((c) => c.status === 'completed');
  const requires_action = userCampaigns.filter((c) =>
    ['changes_requested', 'rejected', 'failed', 'cancelled'].includes(c.status)
  );

  return {
    all: userCampaigns,
    drafts: safeDrafts,
    under_review,
    published,
    promoting,
    completed,
    requires_action,
    counts: {
      drafts: safeDrafts.length,
      under_review: under_review.length,
      published: published.length,
      promoting: promoting.length,
      completed: completed.length,
      requires_action: requires_action.length,
    },
  };
}
