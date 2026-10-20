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
