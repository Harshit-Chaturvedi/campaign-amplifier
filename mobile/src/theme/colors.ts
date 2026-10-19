import { colors as tokenColors } from './tokens';

export const colors = {
  primary: tokenColors.accent,
  primaryDark: tokenColors.accentDark,
  primaryLight: '#5750DF',
  primaryFaint: tokenColors.accentFaint,

  background: tokenColors.background,
  surface: tokenColors.surface,
  surfaceSecondary: tokenColors.surfaceSecondary,
  surfaceMuted: tokenColors.surfaceMuted,
  border: tokenColors.border,
  borderLight: '#EFEAE1',

  text: tokenColors.ink,
  textSecondary: tokenColors.inkSecondary,
  textMuted: tokenColors.inkMuted,
  textInverse: tokenColors.inkInverse,

  success: tokenColors.positive,
  successLight: tokenColors.positiveFaint,
  warning: tokenColors.warning,
  warningLight: tokenColors.warningFaint,
  error: tokenColors.danger,
  errorLight: tokenColors.dangerFaint,
  info: '#1D4ED8',
  infoLight: '#EFF6FF',

  // Trust/review colors
  trustHigh: tokenColors.positive,
  trustMedium: tokenColors.warning,
  trustLow: tokenColors.danger,

  // 10 Brief categories
  category: tokenColors.category,

  // Dark mode fallback
  dark: {
    background: '#16130F',
    surface: '#231F1A',
    surfaceSecondary: '#2E2923',
    border: '#453E35',
    text: '#FAF7F2',
    textSecondary: '#C5BCB0',
    textMuted: '#8C8275',
  },
} as const;

export const getCategoryColor = (cat: string): string => {
  return colors.category[cat] || colors.primary;
};
