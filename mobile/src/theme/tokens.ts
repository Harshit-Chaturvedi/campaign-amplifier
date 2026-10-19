export const colors = {
  // Editorial palette
  background: '#FAF7F2', // Paper background
  paper: '#FAF7F2',
  surface: '#FFFFFF', // Card/sheet surface
  surfaceSecondary: '#F4EFE6', // Warm parchment secondary
  paperSecondary: '#F4EFE6',
  surfaceMuted: '#EFEAE1', // Soft muted paper

  ink: '#16130F', // Primary typography
  inkSecondary: '#5C564D', // Muted ink
  inkMuted: '#8C8275', // Secondary caption
  mutedInk: '#5C564D',
  text: '#16130F',
  textSecondary: '#5C564D',
  textMuted: '#8C8275',
  inkInverse: '#FFFFFF',

  border: '#E4DDD0', // Hairline 1px border
  borderHairline: '#E4DDD0',
  hairline: '#E4DDD0',
  borderDark: '#CCC2B0',
  hairlineDark: '#CCC2B0',
  secondaryCaption: '#8C8275',

  accent: '#3B34C4', // Action only deep indigo
  accentFaint: '#EEEDFA',
  accentDark: '#2C269E',
  primary: '#3B34C4',

  positive: '#1F7A4D', // Editorial positive green
  positiveFaint: '#E9F5EF',

  warning: '#B45309', // Warm amber
  warningFaint: '#FEF3C7',

  danger: '#B42318', // Editorial crimson
  dangerFaint: '#FDF2F2',

  // Category accents for editorial labels
  category: {
    environment: '#1F7A4D',
    health: '#B42318',
    science: '#1D4ED8',
    education: '#2563EB',
    public_policy: '#3B34C4',
    economic_policy: '#0F766E',
    community: '#7E22CE',
    arts_culture: '#B45309',
    business: '#4B5563',
    other: '#5C564D',
  } as Record<string, string>,
} as const;

export const fonts = {
  serifRegular: 'Newsreader_400Regular',
  serifMedium: 'Newsreader_500Medium',
  serifSemiBold: 'Newsreader_600SemiBold',
  serifBold: 'Newsreader_700Bold',
  serifItalic: 'Newsreader_400Regular_Italic',

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
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
    full: 9999,
  },
  radius: {
    none: 0,
    xs: 2,
    sm: 4,
    md: 6,
    lg: 8,
    xl: 12,
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
    borderColor: '#E4DDD0',
    borderRadius: 8,
  },
  typeScale: {
    hero: { fontSize: 32, lineHeight: 38, fontFamily: fonts.serifBold },
    h1: { fontSize: 26, lineHeight: 32, fontFamily: fonts.serifSemiBold },
    h2: { fontSize: 21, lineHeight: 28, fontFamily: fonts.serifSemiBold },
    h3: { fontSize: 18, lineHeight: 24, fontFamily: fonts.serifMedium },
    headline: { fontSize: 17, lineHeight: 22, fontFamily: fonts.serifMedium },
    subhead: { fontSize: 15, lineHeight: 20, fontFamily: fonts.sansMedium },
    bodyLarge: { fontSize: 16, lineHeight: 24, fontFamily: fonts.sansRegular },
    body: { fontSize: 14, lineHeight: 21, fontFamily: fonts.sansRegular },
    bodyBold: { fontSize: 14, lineHeight: 21, fontFamily: fonts.sansSemiBold },
    caption: { fontSize: 12, lineHeight: 16, fontFamily: fonts.sansRegular },
    captionBold: { fontSize: 12, lineHeight: 16, fontFamily: fonts.sansSemiBold },
    statLarge: { fontSize: 32, lineHeight: 36, fontFamily: fonts.serifBold },
    statMedium: { fontSize: 24, lineHeight: 28, fontFamily: fonts.serifBold },
    smallCaps: {
      fontSize: 11,
      lineHeight: 14,
      fontFamily: fonts.sansSemiBold,
      letterSpacing: 0.8,
      textTransform: 'uppercase' as const,
    },
    metaLabel: {
      fontSize: 10,
      lineHeight: 12,
      fontFamily: fonts.sansBold,
      letterSpacing: 0.9,
      textTransform: 'uppercase' as const,
    },
  },
} as const;

export const getCategoryColor = (cat: string): string => {
  return colors.category[cat] || colors.accent;
};
