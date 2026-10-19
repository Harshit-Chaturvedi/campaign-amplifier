export const colors = {
  // Fintech-meets-civic calm, high-trust palette
  background: '#F7F8FA', // Off-white clean background
  paper: '#F7F8FA',
  surface: '#FFFFFF', // Pure white card surface
  surfaceSecondary: '#F3F4F6', // Soft secondary surface
  paperSecondary: '#F3F4F6',
  surfaceMuted: '#E5E7EB', // Subtle neutral

  ink: '#111827', // Primary typography
  inkSecondary: '#6B7280', // Secondary typography
  inkMuted: '#9CA3AF', // Muted text / tertiary
  mutedInk: '#6B7280',
  text: '#111827',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  inkInverse: '#FFFFFF',

  border: '#E5E7EB', // 1px subtle card/divider border
  borderHairline: '#E5E7EB',
  hairline: '#E5E7EB',
  borderDark: '#D1D5DB',
  hairlineDark: '#D1D5DB',
  secondaryCaption: '#9CA3AF',

  accent: '#4338CA', // Deep indigo - strictly for primary actions, links, and progress
  accentFaint: '#EEF2FF',
  accentDark: '#3730A3',
  primary: '#4338CA',

  positive: '#059669', // Calm emerald
  positiveFaint: '#ECFDF5',

  warning: '#D97706', // Muted amber
  warningFaint: '#FFFBEB',

  danger: '#DC2626', // Clean crimson
  dangerFaint: '#FEF2F2',

  // Category labels with disciplined accents
  category: {
    environment: '#059669',
    health: '#DC2626',
    science: '#2563EB',
    education: '#2563EB',
    public_policy: '#4338CA',
    economic_policy: '#0D9488',
    community: '#7C3AED',
    arts_culture: '#D97706',
    business: '#4B5563',
    other: '#6B7280',
  } as Record<string, string>,
} as const;

// Inter only across the entire application — strict hierarchy (700 bold, 600 semibold, 500 medium, 400 regular)
export const fonts = {
  serifRegular: 'Inter_400Regular',
  serifMedium: 'Inter_500Medium',
  serifSemiBold: 'Inter_600SemiBold',
  serifBold: 'Inter_700Bold',
  serifItalic: 'Inter_400Regular',

  sansRegular: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemiBold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export const tokens = {
  colors,
  fonts,
  spacing: {
    xxs: 2,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
    huge: 48,
  },
  radii: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  radius: {
    none: 0,
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    full: 9999,
  },
  borders: {
    hairline: 1,
    subtle: 1,
    accent: 2,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  typeScale: {
    hero: { fontSize: 28, lineHeight: 34, fontFamily: fonts.sansBold },
    h1: { fontSize: 24, lineHeight: 30, fontFamily: fonts.sansBold },
    h2: { fontSize: 20, lineHeight: 26, fontFamily: fonts.sansSemiBold },
    h3: { fontSize: 17, lineHeight: 22, fontFamily: fonts.sansSemiBold },
    headline: { fontSize: 16, lineHeight: 22, fontFamily: fonts.sansSemiBold },
    subhead: { fontSize: 14, lineHeight: 20, fontFamily: fonts.sansMedium },
    bodyLarge: { fontSize: 15, lineHeight: 22, fontFamily: fonts.sansRegular },
    body: { fontSize: 14, lineHeight: 20, fontFamily: fonts.sansRegular },
    bodyBold: { fontSize: 14, lineHeight: 20, fontFamily: fonts.sansSemiBold },
    caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.sansRegular },
    captionBold: { fontSize: 12, lineHeight: 16, fontFamily: fonts.sansSemiBold },
    statLarge: { fontSize: 28, lineHeight: 32, fontFamily: fonts.sansBold },
    statMedium: { fontSize: 22, lineHeight: 26, fontFamily: fonts.sansBold },
    smallCaps: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fonts.sansSemiBold,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
    metaLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: fonts.sansSemiBold,
      letterSpacing: 0.6,
      textTransform: 'uppercase' as const,
    },
  },
} as const;

export const getCategoryColor = (cat: string): string => {
  return colors.category[cat] || colors.accent;
};
