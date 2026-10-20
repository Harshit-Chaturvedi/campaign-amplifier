// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Image } = require('react-native');
  return {
    __esModule: true,
    default: {
      View,
      Text,
      Image,
      createAnimatedComponent: (c) => c,
    },
    useSharedValue: (init) => ({ value: init }),
    useAnimatedStyle: (fn) => fn(),
    withTiming: (toValue) => toValue,
    withSpring: (toValue) => toValue,
    Easing: {
      out: (fn) => fn,
      cubic: (t) => t,
    },
    FadeIn: { duration: () => ({}) },
    FadeOut: { duration: () => ({}) },
  };
});

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: jest.fn(),
      goBack: jest.fn(),
      setOptions: jest.fn(),
      addListener: jest.fn(() => () => {}),
      canGoBack: jest.fn(() => true),
    }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: (cb) => {
      const { useEffect } = require('react');
      useEffect(() => {
        return cb();
      }, [cb]);
    },
  };
});
