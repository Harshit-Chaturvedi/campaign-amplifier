import React from 'react';
import renderer, { act } from 'react-test-renderer';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock @expo/vector-icons
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Ionicons: (props: any) => React.createElement(View, { testID: 'mock-icon', ...props }),
  };
});

import { filterAndBucketCreatorCampaigns } from '../src/hooks/useCreatorCampaigns';
import { AdminConsoleScreen } from '../src/screens/admin/AdminConsoleScreen';
import { AdminReviewDetailScreen } from '../src/screens/admin/AdminReviewDetailScreen';
import { ProfileScreen } from '../src/screens/profile/ProfileScreen';
import { useAuthStore } from '../src/store/useAuthStore';
import { useCampaignStore } from '../src/store/useCampaignStore';
import { useDraftStore } from '../src/store/useDraftStore';
import { apiClient } from '../src/api/client';

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
};

describe('Admin and Creator Consistency Suite', () => {
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    act(() => {
      useAuthStore.setState({ user: null, isAuthenticated: false, token: null });
      useDraftStore.setState({ drafts: {}, activeDraftId: null });
    });
  });

  afterEach(() => {
    if (tree) {
      act(() => {
        tree?.unmount();
      });
      tree = null;
    }
  });

  describe('1. filterAndBucketCreatorCampaigns selector consistency', () => {
    const testCampaigns = [
      { id: 'c1', owner_id: 'creator-1', status: 'submitted', title: 'Camp 1' },
      { id: 'c2', owner_id: 'creator-1', status: 'available_for_funding', title: 'Camp 2' },
      { id: 'c3', owner_id: 'creator-1', status: 'goal_reached', title: 'Camp 3' },
      { id: 'c4', owner_id: 'creator-1', status: 'promoting', title: 'Camp 4' },
      { id: 'c5', owner_id: 'creator-1', status: 'completed', title: 'Camp 5' },
      { id: 'c6', owner_id: 'creator-1', status: 'changes_requested', title: 'Camp 6' },
      { id: 'c7', owner_id: 'other-user', status: 'submitted', title: 'Camp 7' },
      { id: 'c8', owner_id: null, status: 'available_for_funding', title: 'Camp 8' },
    ];

    const testDrafts = [
      { id: 'd1', title: 'Draft 1', step: 1, updatedAt: '2026-10-18T00:00:00Z' },
      { id: 'd2', title: 'Draft 2', step: 2, updatedAt: '2026-10-19T00:00:00Z' },
    ];

    it('asserts counts == list lengths for a creator', () => {
      const buckets = filterAndBucketCreatorCampaigns(testCampaigns, 'creator-1', testDrafts);

      expect(buckets.counts.drafts).toBe(buckets.drafts.length);
      expect(buckets.counts.under_review).toBe(buckets.under_review.length);
      expect(buckets.counts.published).toBe(buckets.published.length);
      expect(buckets.counts.promoting).toBe(buckets.promoting.length);
      expect(buckets.counts.completed).toBe(buckets.completed.length);
      expect(buckets.counts.requires_action).toBe(buckets.requires_action.length);

      expect(buckets.counts.drafts).toBe(2);
      expect(buckets.counts.under_review).toBe(1);
      expect(buckets.counts.published).toBe(2); // available_for_funding + goal_reached
      expect(buckets.counts.promoting).toBe(1);
      expect(buckets.counts.completed).toBe(1);
      expect(buckets.counts.requires_action).toBe(1);
    });

    it('returns 0/0/0 counts and empty lists for a user with no campaigns', () => {
      const buckets = filterAndBucketCreatorCampaigns(testCampaigns, 'usr-admin', []);

      expect(buckets.counts.drafts).toBe(0);
      expect(buckets.counts.under_review).toBe(0);
      expect(buckets.counts.published).toBe(0);
      expect(buckets.counts.promoting).toBe(0);
      expect(buckets.counts.completed).toBe(0);
      expect(buckets.counts.requires_action).toBe(0);

      expect(buckets.all).toEqual([]);
      expect(buckets.under_review).toEqual([]);
      expect(buckets.published).toEqual([]);
    });

    it('returns safe empty bucket for null/undefined user id without matching unowned campaigns', () => {
      const buckets = filterAndBucketCreatorCampaigns(testCampaigns, null, []);

      expect(buckets.counts.under_review).toBe(0);
      expect(buckets.counts.published).toBe(0);
      expect(buckets.all).toEqual([]);
    });
  });

  describe('2. Mobile Admin area guards and visibility', () => {
    it('guards AdminConsoleScreen against non-admin users', () => {
      useAuthStore.setState({
        user: {
          uid: 'user-standard',
          name: 'Regular User',
          email: 'user@example.com',
          username: 'regular',
          role: 'user',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        token: 'valid-token',
      });

      act(() => {
        tree = renderer.create(<AdminConsoleScreen navigation={mockNavigation} />);
      });

      const textNodes = tree!.root.findAllByType('Text' as any);
      const textContent = textNodes.map((n) => n.props.children).join(' ');

      expect(textContent).toContain('Admin Access Required');
      expect(textContent).not.toContain('Review Queue');
    });

    it('renders AdminConsoleScreen cleanly for admin users', async () => {
      useAuthStore.setState({
        user: {
          uid: 'usr-admin',
          name: 'Platform Moderator',
          email: 'admin@demo.org',
          username: 'admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        token: 'valid-admin-token',
      });

      const mockQueue = [
        {
          id: 'cmp-mod-1',
          title: 'Lead pipe removal push',
          category: 'health',
          creator_name: 'Dr. Jane',
          created_at: new Date().toISOString(),
          funding_goal: 10000,
          amount_raised: 0,
          status: 'submitted',
          backer_count: 0,
        },
      ];

      jest.spyOn(apiClient, 'getAdminReviewQueue').mockResolvedValueOnce(mockQueue);

      await act(async () => {
        tree = renderer.create(<AdminConsoleScreen navigation={mockNavigation} />);
      });

      const textNodes = tree!.root.findAllByType('Text' as any);
      const textContent = textNodes.map((n) => n.props.children).join(' ');

      expect(textContent).toContain('Admin Console');
      expect(textContent).toContain('Review Queue');
      expect(textContent).toContain('Lead pipe removal push');
    });

    it('renders empty state "No submissions waiting" when queue is empty', async () => {
      useAuthStore.setState({
        user: {
          uid: 'usr-admin',
          name: 'Platform Moderator',
          email: 'admin@demo.org',
          username: 'admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        token: 'valid-admin-token',
      });

      jest.spyOn(apiClient, 'getAdminReviewQueue').mockResolvedValueOnce([]);

      await act(async () => {
        tree = renderer.create(<AdminConsoleScreen navigation={mockNavigation} />);
      });

      const textNodes = tree!.root.findAllByType('Text' as any);
      const textContent = textNodes.map((n) => n.props.children).join(' ');

      expect(textContent).toContain('No submissions waiting');
    });

    it('renders error state with Retry when queue fetch fails', async () => {
      useAuthStore.setState({
        user: {
          uid: 'usr-admin',
          name: 'Platform Moderator',
          email: 'admin@demo.org',
          username: 'admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        token: 'valid-admin-token',
      });

      jest.spyOn(apiClient, 'getAdminReviewQueue').mockRejectedValueOnce(new Error('Network connectivity issue'));

      await act(async () => {
        tree = renderer.create(<AdminConsoleScreen navigation={mockNavigation} />);
      });

      const textNodes = tree!.root.findAllByType('Text' as any);
      const textContent = textNodes.map((n) => n.props.children).join(' ');

      expect(textContent).toContain('Failed to load queue');
      expect(textContent).toContain('Retry');
    });
  });

  describe('3. Profile screen Admin row and role-based visibility', () => {
    it('shows Admin console entry with pending badge for admin; hides Creator Dashboard and Your Campaigns', async () => {
      useAuthStore.setState({
        user: {
          uid: 'usr-admin',
          name: 'Platform Moderator',
          email: 'admin@demo.org',
          username: 'admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        token: 'valid-admin-token',
      });

      jest.spyOn(apiClient, 'getAdminReviewQueue').mockResolvedValueOnce([
        { id: 'c1', status: 'submitted' },
        { id: 'c2', status: 'changes_requested' },
      ]);

      await act(async () => {
        tree = renderer.create(<ProfileScreen navigation={mockNavigation} />);
      });

      const textNodes = tree!.root.findAllByType('Text' as any);
      const textContent = textNodes.map((n) => n.props.children).join(' ');

      // Must show Admin console
      expect(textContent).toContain('Admin Console');
      expect(textContent).toContain('2 Pending');

      // Must NOT show Creator Dashboard or "Your Campaigns" card
      expect(textContent).not.toContain('Your Campaigns');
      expect(textContent).not.toContain('Local Drafts');
    });

    it('never shows Admin console entry for non-admin creator', async () => {
      useAuthStore.setState({
        user: {
          uid: 'usr-creator',
          name: 'Community Organizer',
          email: 'creator@demo.org',
          username: 'creator',
          role: 'creator',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        token: 'valid-creator-token',
      });

      await act(async () => {
        tree = renderer.create(<ProfileScreen navigation={mockNavigation} />);
      });

      const textNodes = tree!.root.findAllByType('Text' as any);
      const textContent = textNodes.map((n) => n.props.children).join(' ');

      expect(textContent).not.toContain('Admin Console');
      expect(textContent).toContain('Your Campaigns');
      expect(textContent).toContain('Dashboard');
    });
  });

  describe('4. Refetch Freshness', () => {
    it('refetches and displays newly submitted campaign in the review queue', async () => {
      useAuthStore.setState({
        user: {
          uid: 'usr-admin',
          name: 'Platform Moderator',
          email: 'admin@demo.org',
          username: 'admin',
          role: 'admin',
          createdAt: new Date().toISOString(),
        },
        isAuthenticated: true,
        token: 'valid-admin-token',
      });

      // Initial empty queue
      const getQueueSpy = jest.spyOn(apiClient, 'getAdminReviewQueue');
      getQueueSpy.mockResolvedValueOnce([]);

      await act(async () => {
        tree = renderer.create(<AdminConsoleScreen navigation={mockNavigation} />);
      });

      let textContent = tree!.root.findAllByType('Text' as any).map((n) => n.props.children).join(' ');
      expect(textContent).toContain('No submissions waiting');

      // Next fetch returns newly submitted campaign
      getQueueSpy.mockResolvedValueOnce([
        {
          id: 'cmp-new-1',
          title: 'Brand New Submitted Campaign',
          category: 'environment',
          creator_name: 'Eco Activist',
          created_at: new Date().toISOString(),
          funding_goal: 5000,
          amount_raised: 0,
          status: 'submitted',
          backer_count: 0,
        },
      ]);

      // Trigger refresh by finding refresh button
      const refreshBtn = tree!.root.findByProps({ accessibilityLabel: 'Refresh queue' });
      await act(async () => {
        refreshBtn.props.onPress();
      });

      textContent = tree!.root.findAllByType('Text' as any).map((n) => n.props.children).join(' ');
      expect(textContent).toContain('Brand New Submitted Campaign');
      expect(textContent).not.toContain('No submissions waiting');
    });
  });
});
