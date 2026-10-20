import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { BackHandler } from 'react-native';

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

import { ThankYouScreen } from '../src/screens/funding/FundingScreens';
import { calculateBackerFee, estimateReach } from '../src/services/reach';
import { formatMoney, formatCurrency } from '../src/utils/formatting';

describe('ThankYouScreen Navigation and Receipt Precision', () => {
  let mockParentNavigation: any;
  let mockNavigation: any;
  let backHandlerCallbacks: Array<() => boolean> = [];
  let tree: renderer.ReactTestRenderer | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    backHandlerCallbacks = [];
    tree = null;
    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event: any, handler: any) => {
      if (event === 'hardwareBackPress') {
        backHandlerCallbacks.push(handler);
      }
      return {
        remove: () => {
          backHandlerCallbacks = backHandlerCallbacks.filter((h) => h !== handler);
        },
      } as any;
    });

    mockParentNavigation = {
      navigate: jest.fn(),
    };

    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      popToTop: jest.fn(),
      getParent: jest.fn(() => mockParentNavigation),
    };
  });

  afterEach(() => {
    if (tree) {
      act(() => {
        tree?.unmount();
      });
      tree = null;
    }
    jest.restoreAllMocks();
  });

  test('return to home button pops ExploreStack and navigates to HomeTab', () => {
    const route = {
      params: {
        campaignId: 'cmp-clean-water',
        amount: 25,
        receiptNo: 'REC-TEST-001',
        estimatedReach: 600,
        fee: 1.03,
        total: 26.03,
      },
    };

    act(() => {
      tree = renderer.create(<ThankYouScreen route={route} navigation={mockNavigation} />);
    });

    // Find "Return to Home Feed" button
    const returnHomeButton = tree!.root.findByProps({ accessibilityLabel: 'Return to Home Feed' });
    expect(returnHomeButton).toBeDefined();

    act(() => {
      returnHomeButton.props.onPress();
    });

    expect(mockNavigation.popToTop).toHaveBeenCalledTimes(1);
    expect(mockParentNavigation.navigate).toHaveBeenCalledWith('HomeTab', { screen: 'Home' });
  });

  test('close button on receipt pops ExploreStack and navigates to HomeTab', () => {
    const route = {
      params: {
        campaignId: 'cmp-clean-water',
        amount: 50,
        receiptNo: 'REC-TEST-002',
        fee: 1.75,
        total: 51.75,
      },
    };

    act(() => {
      tree = renderer.create(<ThankYouScreen route={route} navigation={mockNavigation} />);
    });

    const closeButton = tree!.root.findByProps({ accessibilityLabel: 'Close and return to Home' });
    expect(closeButton).toBeDefined();

    act(() => {
      closeButton.props.onPress();
    });

    expect(mockNavigation.popToTop).toHaveBeenCalledTimes(1);
    expect(mockParentNavigation.navigate).toHaveBeenCalledWith('HomeTab', { screen: 'Home' });
  });

  test('hardware back press triggers handleReturnHome and returns true', () => {
    const route = {
      params: {
        campaignId: 'cmp-clean-water',
        amount: 25,
      },
    };

    act(() => {
      tree = renderer.create(<ThankYouScreen route={route} navigation={mockNavigation} />);
    });

    expect(backHandlerCallbacks.length).toBeGreaterThan(0);
    let handled = false;
    act(() => {
      handled = backHandlerCallbacks[0]();
    });

    expect(handled).toBe(true);
    expect(mockNavigation.popToTop).toHaveBeenCalledTimes(1);
    expect(mockParentNavigation.navigate).toHaveBeenCalledWith('HomeTab', { screen: 'Home' });
  });

  test('fee and total calculation and formatMoney render exact 2-decimal cents', () => {
    const calc = calculateBackerFee(25);
    expect(calc.fee).toBe(1.03);
    expect(calc.total).toBe(26.03);

    expect(formatMoney(calc.fee)).toBe('$1.03');
    expect(formatMoney(calc.total)).toBe('$26.03');
    expect(formatCurrency(25)).toBe('$25');

    const reach = estimateReach(25);
    expect(reach.estimate).toBeGreaterThan(0);
  });
});
