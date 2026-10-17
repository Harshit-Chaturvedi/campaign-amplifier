export const colors = {
  primary: '#4f46e5',
  primaryDark: '#3730a3',
  primaryLight: '#818cf8',
  primaryFaint: '#eef2ff',

  background: '#f8fafc',
  surface: '#ffffff',
  surfaceSecondary: '#f1f5f9',
  border: '#e2e8f0',
  borderLight: '#f1f5f9',

  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  textInverse: '#ffffff',

  success: '#22c55e',
  successLight: '#dcfce7',
  warning: '#f59e0b',
  warningLight: '#fef3c7',
  error: '#ef4444',
  errorLight: '#fef2f2',
  info: '#3b82f6',
  infoLight: '#eff6ff',

  // Trust score colors
  trustHigh: '#22c55e',
  trustMedium: '#f59e0b',
  trustLow: '#ef4444',

  // Category colors
  category: {
    environment: '#22c55e',
    health: '#ef4444',
    education: '#3b82f6',
    consumer: '#f59e0b',
    community: '#a855f7',
    civic: '#6366f1',
  } as Record<string, string>,

  // Dark mode
  dark: {
    background: '#0b1120',
    surface: '#1e293b',
    surfaceSecondary: '#1a2332',
    border: '#334155',
    text: '#f1f5f9',
    textSecondary: '#94a3b8',
    textMuted: '#64748b',
  },
} as const;

export const getCategoryColor = (cat: string): string => {
  return colors.category[cat] || colors.primary;
};

export const getTrustColor = (score: number | null): string => {
  if (score === null) return colors.textMuted;
  if (score >= 70) return colors.trustHigh;
  if (score >= 55) return colors.trustMedium;
  return colors.trustLow;
};
