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

  // 10 Brief categories
  category: {
    environment: '#16a34a',
    health: '#dc2626',
    science: '#0284c7',
    education: '#2563eb',
    public_policy: '#4f46e5',
    economic_policy: '#0d9488',
    community: '#9333ea',
    arts_culture: '#d97706',
    business: '#475569',
    other: '#64748b',
  } as Record<string, string>,

  // Dark mode tokens
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
