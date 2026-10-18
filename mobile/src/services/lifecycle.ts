import type { Campaign, CampaignStatus } from '../types/campaign';
import { demoConfig } from '../config/demoConfig';

export type UserLifecycleRole = 'creator' | 'reviewer' | 'admin' | 'system';

export interface TransitionRule {
  from: CampaignStatus;
  to: CampaignStatus;
  allowedRoles: UserLifecycleRole[];
  description: string;
  checkPreconditions?: (campaign: Campaign) => { ok: boolean; reason?: string };
}

export const LIFECYCLE_TRANSITIONS: TransitionRule[] = [
  // 1. Creator submits draft
  {
    from: 'draft',
    to: 'submitted',
    allowedRoles: ['creator', 'admin'],
    description: 'Submit campaign draft for editorial and advertising review',
    checkPreconditions: (c) => {
      if (!c.title || c.title.trim().length === 0) return { ok: false, reason: 'Title is required' };
      if (!c.fundingGoal || c.fundingGoal < demoConfig.minGoal) {
        return { ok: false, reason: `Funding goal must be at least $${demoConfig.minGoal}` };
      }
      if (!c.category) return { ok: false, reason: 'Category is required' };
      return { ok: true };
    },
  },

  // 2. Reviewer decisions
  {
    from: 'submitted',
    to: 'approved',
    allowedRoles: ['reviewer', 'admin'],
    description: 'Approve campaign story, claims, sources, and ad creatives',
  },
  {
    from: 'submitted',
    to: 'changes_requested',
    allowedRoles: ['reviewer', 'admin'],
    description: 'Request revisions to claims, sources, or advertising copy',
  },
  {
    from: 'submitted',
    to: 'rejected',
    allowedRoles: ['reviewer', 'admin'],
    description: 'Reject submission that fails community guidelines or ad policies',
  },

  // 3. Creator resubmits after requested changes
  {
    from: 'changes_requested',
    to: 'submitted',
    allowedRoles: ['creator', 'admin'],
    description: 'Resubmit revised campaign for review',
  },

  // 4. Publishing approved campaign for backing
  {
    from: 'approved',
    to: 'available_for_funding',
    allowedRoles: ['creator', 'reviewer', 'admin', 'system'],
    description: 'Open campaign for community amplification contributions',
  },

  // 5. Funding milestones (NOTE: goal_reached NEVER auto-promotes!)
  {
    from: 'available_for_funding',
    to: 'goal_reached',
    allowedRoles: ['system', 'admin'],
    description: '100% of funding goal reached by community backers',
    checkPreconditions: (c) => ({
      ok: c.amountRaised >= c.fundingGoal,
      reason: 'Funding raised must meet or exceed the goal',
    }),
  },
  {
    from: 'available_for_funding',
    to: 'funding_ended',
    allowedRoles: ['system', 'admin', 'creator'],
    description: 'Funding duration completed',
  },

  // 6. Preparing advertising distribution
  {
    from: 'goal_reached',
    to: 'distribution_preparation',
    allowedRoles: ['reviewer', 'admin', 'system'],
    description: 'Ad ops prepares audience targeting, assets, and channel placements',
  },
  {
    from: 'funding_ended',
    to: 'distribution_preparation',
    allowedRoles: ['reviewer', 'admin', 'system'],
    description: 'Ad ops prepares distribution with funded budget',
  },

  // 7. Launching advertising (requires canStartPromotion)
  {
    from: 'distribution_preparation',
    to: 'promoting',
    allowedRoles: ['reviewer', 'admin'],
    description: 'Deploy sponsored advertising campaigns across selected channels',
    checkPreconditions: (c) => {
      const check = canStartPromotion(c);
      return { ok: check.canStart, reason: check.reasons.join(', ') };
    },
  },

  // 8. Completing advertising run and delivering final report
  {
    from: 'promoting',
    to: 'completed',
    allowedRoles: ['reviewer', 'admin', 'system'],
    description: 'Complete advertising schedule and publish final distribution report',
  },

  // 9. Exceptional cancellations & refunds
  {
    from: 'available_for_funding',
    to: 'refund_pending',
    allowedRoles: ['admin', 'system'],
    description: 'Campaign cancelled while funded; initiate backer refunds',
  },
  {
    from: 'refund_pending',
    to: 'failed',
    allowedRoles: ['admin', 'system'],
    description: 'All refunds successfully processed',
  },
  {
    from: 'draft',
    to: 'cancelled',
    allowedRoles: ['creator', 'admin'],
    description: 'Creator cancelled draft',
  },
  {
    from: 'changes_requested',
    to: 'cancelled',
    allowedRoles: ['creator', 'admin'],
    description: 'Creator closed campaign instead of revising',
  },
];

/**
 * Checks all conditions required before a campaign can transition to 'promoting'.
 * Non-negotiable brief rule:
 * Distribution begins only when required approval, payment, budget, and advertising setup conditions are met.
 */
export function canStartPromotion(campaign: Campaign): { canStart: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Condition 1: Must be previously approved
  if (!campaign.approvedAt && campaign.status !== 'approved' && campaign.status !== 'distribution_preparation') {
    reasons.push('Campaign must have editorial review approval');
  }

  // Condition 2: Payments settled (amountRaised > 0)
  if (campaign.amountRaised <= 0) {
    reasons.push('Community funding contributions must be received and settled');
  }

  // Condition 3: Budget and targeting configured
  if (
    !campaign.reachSettings ||
    !campaign.reachSettings.channels ||
    campaign.reachSettings.channels.length === 0
  ) {
    reasons.push('At least one advertising channel must be selected in reach settings');
  }

  // Condition 4: Advertising creative assets complete
  if (!campaign.adAssets?.coverUrl) {
    reasons.push('Campaign ad creative requires a primary cover visual');
  }
  if (!campaign.adAssets?.headline || campaign.adAssets.headline.trim().length === 0) {
    reasons.push('Advertising headline is required');
  }
  if (!campaign.adAssets?.description || campaign.adAssets.description.trim().length === 0) {
    reasons.push('Advertising copy/description is required');
  }

  return {
    canStart: reasons.length === 0,
    reasons,
  };
}

/**
 * Determines if a transition is valid for a given role and campaign state.
 */
export function canTransition(
  campaign: Campaign,
  toStatus: CampaignStatus,
  role: UserLifecycleRole = 'creator'
): { allowed: boolean; reason?: string } {
  const rule = LIFECYCLE_TRANSITIONS.find(
    (t) => t.from === campaign.status && t.to === toStatus
  );

  if (!rule) {
    return {
      allowed: false,
      reason: `Transition from ${campaign.status} to ${toStatus} is not permitted by lifecycle rules`,
    };
  }

  if (!rule.allowedRoles.includes(role) && role !== 'admin') {
    return {
      allowed: false,
      reason: `Role '${role}' is not authorized to transition to ${toStatus}`,
    };
  }

  if (rule.checkPreconditions) {
    const pre = rule.checkPreconditions(campaign);
    if (!pre.ok) {
      return { allowed: false, reason: pre.reason };
    }
  }

  return { allowed: true };
}

/**
 * Returns allowed next statuses for a campaign given the user's role.
 */
export function getAllowedNextStatuses(
  campaign: Campaign,
  role: UserLifecycleRole = 'creator'
): CampaignStatus[] {
  return LIFECYCLE_TRANSITIONS.filter((t) => {
    if (t.from !== campaign.status) return false;
    if (!t.allowedRoles.includes(role) && role !== 'admin') return false;
    if (t.checkPreconditions && !t.checkPreconditions(campaign).ok) return false;
    return true;
  }).map((t) => t.to);
}

export interface StatusMetadata {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  icon: string;
  description: string;
}

/**
 * Visual styling and metadata for all 14 lifecycle states.
 */
export function getStatusMetadata(status: CampaignStatus): StatusMetadata {
  switch (status) {
    case 'draft':
      return {
        label: 'Draft',
        badgeBg: '#f1f5f9',
        badgeText: '#475569',
        badgeBorder: '#cbd5e1',
        dotColor: '#94a3b8',
        icon: 'document-outline',
        description: 'Saved draft in progress; editable by creator',
      };
    case 'submitted':
      return {
        label: 'Under Review',
        badgeBg: '#eff6ff',
        badgeText: '#1d4ed8',
        badgeBorder: '#bfdbfe',
        dotColor: '#3b82f6',
        icon: 'time-outline',
        description: 'Content and sources are being reviewed by platform reviewers',
      };
    case 'changes_requested':
      return {
        label: 'Changes Requested',
        badgeBg: '#fffbeb',
        badgeText: '#b45309',
        badgeBorder: '#fde68a',
        dotColor: '#f59e0b',
        icon: 'alert-circle-outline',
        description: 'Revisions to claims, sources, or targeting are required',
      };
    case 'approved':
      return {
        label: 'Approved',
        badgeBg: '#f0fdf4',
        badgeText: '#15803d',
        badgeBorder: '#bbf7d0',
        dotColor: '#22c55e',
        icon: 'checkmark-circle-outline',
        description: 'Approved and eligible to open for community funding',
      };
    case 'available_for_funding':
      return {
        label: 'Funding Open',
        badgeBg: '#eef2ff',
        badgeText: '#4338ca',
        badgeBorder: '#c7d2fe',
        dotColor: '#6366f1',
        icon: 'megaphone-outline',
        description: 'Open for backer amplification contributions',
      };
    case 'goal_reached':
      return {
        label: 'Goal Reached',
        badgeBg: '#ecfdf5',
        badgeText: '#047857',
        badgeBorder: '#a7f3d0',
        dotColor: '#10b981',
        icon: 'trophy-outline',
        description: '100% funded! Preparing advertising queue',
      };
    case 'funding_ended':
      return {
        label: 'Funding Closed',
        badgeBg: '#f8fafc',
        badgeText: '#334155',
        badgeBorder: '#e2e8f0',
        dotColor: '#64748b',
        icon: 'calendar-outline',
        description: 'Funding window ended; distribution will be evaluated',
      };
    case 'distribution_preparation':
      return {
        label: 'Preparing Ads',
        badgeBg: '#fdf4ff',
        badgeText: '#86198f',
        badgeBorder: '#f5d0fe',
        dotColor: '#d946ef',
        icon: 'settings-outline',
        description: 'Configuring advertising accounts, creatives, and inventory',
      };
    case 'promoting':
      return {
        label: 'Ads Active',
        badgeBg: '#f0fdfa',
        badgeText: '#0f766e',
        badgeBorder: '#99f6e4',
        dotColor: '#14b8a6',
        icon: 'radio-outline',
        description: 'Advertising is actively running across distribution channels',
      };
    case 'completed':
      return {
        label: 'Completed',
        badgeBg: '#f1f5f9',
        badgeText: '#0f172a',
        badgeBorder: '#cbd5e1',
        dotColor: '#0f172a',
        icon: 'checkbox-outline',
        description: 'Advertising run completed; final distribution report published',
      };
    case 'rejected':
      return {
        label: 'Ineligible',
        badgeBg: '#fef2f2',
        badgeText: '#b91c1c',
        badgeBorder: '#fecaca',
        dotColor: '#ef4444',
        icon: 'close-circle-outline',
        description: 'Submission does not meet advertising safety or evidence guidelines',
      };
    case 'cancelled':
      return {
        label: 'Cancelled',
        badgeBg: '#f8fafc',
        badgeText: '#64748b',
        badgeBorder: '#e2e8f0',
        dotColor: '#94a3b8',
        icon: 'ban-outline',
        description: 'Campaign was cancelled by creator or platform administrator',
      };
    case 'refund_pending':
      return {
        label: 'Refund Pending',
        badgeBg: '#fff7ed',
        badgeText: '#c2410c',
        badgeBorder: '#ffedd5',
        dotColor: '#f97316',
        icon: 'refresh-outline',
        description: 'Backer contributions are being refunded to original payment methods',
      };
    case 'failed':
      return {
        label: 'Failed',
        badgeBg: '#fef2f2',
        badgeText: '#991b1b',
        badgeBorder: '#fee2e2',
        dotColor: '#dc2626',
        icon: 'warning-outline',
        description: 'Campaign halted and refunded',
      };
    default:
      return {
        label: status,
        badgeBg: '#f1f5f9',
        badgeText: '#475569',
        badgeBorder: '#cbd5e1',
        dotColor: '#94a3b8',
        icon: 'information-circle-outline',
        description: '',
      };
  }
}
