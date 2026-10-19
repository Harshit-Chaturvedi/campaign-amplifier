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

import { CreateLandingScreen } from '../src/screens/create/CreateLandingScreen';
import { ProfileScreen } from '../src/screens/profile/ProfileScreen';
import { CreatorDashboardScreen } from '../src/screens/profile/CreatorDashboardScreen';
import { useDraftStore, CampaignDraft } from '../src/store/useDraftStore';
import { useAuthStore } from '../src/store/useAuthStore';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(() => () => {}),
};

const draft1: CampaignDraft = {
  id: 'draft-1',
  step: 1,
  updatedAt: new Date('2026-10-18T10:00:00Z').toISOString(),
  title: 'Clean Water in Schools',
  category: 'health',
  creatorName: 'Marisol',
  summary: 'Replace lead service lines',
  storyBlocks: [],
  sources: [],
  adImages: [],
  headline: 'Clean water for schools',
  adDescription: 'Help us reach parents',
  cta: 'Learn More',
  locations: ['County District'],
  interests: ['Parents'],
  channels: ['Meta'],
  budgetAllocation: { Meta: 100 },
  durationDays: 30,
};

const draft2: CampaignDraft = {
  id: 'draft-2',
  step: 4,
  updatedAt: new Date('2026-10-19T10:00:00Z').toISOString(),
  title: 'Redraw the Bus Network',
  category: 'public_policy',
  creatorName: 'Devin',
  summary: 'Redesign lines for ring road',
  storyBlocks: [],
  sources: [],
  adImages: [],
  headline: 'Buses where jobs are',
  adDescription: 'Public comment needed',
  cta: 'Learn More',
  locations: ['Metro Area'],
  interests: ['Transit'],
  channels: ['Instagram'],
  budgetAllocation: { Instagram: 100 },
  durationDays: 14,
};

describe('Render Stability and Selector Regression Suite', () => {
  let consoleErrorSpy: jest.SpyInstance;
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    act(() => {
      useDraftStore.setState({ drafts: {}, activeDraftId: null });
      useAuthStore.setState({ user: null, isAuthenticated: false, isLoading: false });
    });

    // Catch any React maximum update depth exceeded warnings or errors
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args: any[]) => {
      const message = args.join(' ');
      if (message.includes('Maximum update depth exceeded')) {
        throw new Error(message);
      }
    });
  });

  afterEach(() => {
    if (tree) {
      act(() => {
        tree?.unmount();
      });
      tree = null;
    }
    consoleErrorSpy.mockRestore();
  });

  describe('CreateLandingScreen', () => {
    it('renders cleanly without infinite loops when draft store is empty', () => {
      expect(() => {
        act(() => {
          tree = renderer.create(<CreateLandingScreen navigation={mockNavigation} />);
        });
      }).not.toThrow();

      expect(tree).toBeDefined();
      expect(tree!.toJSON()).toBeTruthy();
    });

    it('renders cleanly without infinite loops when draft store has multiple drafts', () => {
      act(() => {
        useDraftStore.setState({
          drafts: {
            [draft1.id]: draft1,
            [draft2.id]: draft2,
          },
        });
      });

      expect(() => {
        act(() => {
          tree = renderer.create(<CreateLandingScreen navigation={mockNavigation} />);
        });
      }).not.toThrow();

      expect(tree).toBeDefined();
      expect(tree!.toJSON()).toBeTruthy();
    });
  });

  describe('ProfileScreen', () => {
    it('renders cleanly without infinite loops when draft store is empty', () => {
      expect(() => {
        act(() => {
          tree = renderer.create(<ProfileScreen navigation={mockNavigation} />);
        });
      }).not.toThrow();

      expect(tree).toBeDefined();
      expect(tree!.toJSON()).toBeTruthy();
    });

    it('renders cleanly without infinite loops when draft store has multiple drafts', () => {
      act(() => {
        useDraftStore.setState({
          drafts: {
            [draft1.id]: draft1,
            [draft2.id]: draft2,
          },
        });
      });

      expect(() => {
        act(() => {
          tree = renderer.create(<ProfileScreen navigation={mockNavigation} />);
        });
      }).not.toThrow();

      expect(tree).toBeDefined();
      expect(tree!.toJSON()).toBeTruthy();
    });
  });

  describe('CreatorDashboardScreen', () => {
    it('renders cleanly without infinite loops when draft store is empty', () => {
      expect(() => {
        act(() => {
          tree = renderer.create(
            <CreatorDashboardScreen
              route={{ params: { initialTab: 'drafts' } }}
              navigation={mockNavigation}
            />
          );
        });
      }).not.toThrow();

      expect(tree).toBeDefined();
      expect(tree!.toJSON()).toBeTruthy();
    });

    it('renders cleanly without infinite loops when draft store has multiple drafts', () => {
      act(() => {
        useDraftStore.setState({
          drafts: {
            [draft1.id]: draft1,
            [draft2.id]: draft2,
          },
        });
      });

      expect(() => {
        act(() => {
          tree = renderer.create(
            <CreatorDashboardScreen
              route={{ params: { initialTab: 'drafts' } }}
              navigation={mockNavigation}
            />
          );
        });
      }).not.toThrow();

      expect(tree).toBeDefined();
      expect(tree!.toJSON()).toBeTruthy();
    });
  });
});
