import { colors } from './colors';

export const tokens = {
  colors,
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  radii: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  typography: {
    h1: { fontSize: 26, fontWeight: '800' as const, lineHeight: 32 },
    h2: { fontSize: 20, fontWeight: '700' as const, lineHeight: 26 },
    h3: { fontSize: 17, fontWeight: '700' as const, lineHeight: 22 },
    body: { fontSize: 15, fontWeight: '400' as const, lineHeight: 22 },
    bodyBold: { fontSize: 15, fontWeight: '600' as const, lineHeight: 22 },
    caption: { fontSize: 13, fontWeight: '400' as const, lineHeight: 18 },
    small: { fontSize: 11, fontWeight: '500' as const, lineHeight: 14 },
  },
  shadows: {
    sm: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 3,
      elevation: 2,
    },
    md: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 4,
    },
  },
};
