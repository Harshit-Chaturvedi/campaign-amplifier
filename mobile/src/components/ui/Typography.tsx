import React from 'react';
import { Text as RNText, TextProps as RNTextProps, StyleSheet, TextStyle } from 'react-native';
import { tokens, colors, fonts } from '../../theme/tokens';

export interface EditorialTextProps extends RNTextProps {
  color?: string;
  muted?: boolean;
  style?: TextStyle | TextStyle[];
}

export function Text({ style, color, muted, ...props }: EditorialTextProps) {
  return (
    <RNText
      {...props}
      style={[
        styles.baseText,
        color ? { color } : muted ? { color: colors.inkSecondary } : null,
        style,
      ]}
    />
  );
}

export interface HeadlineProps extends EditorialTextProps {
  level?: 1 | 2 | 3 | 'hero';
}

export function Headline({ level = 1, style, color, ...props }: HeadlineProps) {
  const fontStyle =
    level === 'hero'
      ? tokens.typeScale.hero
      : level === 2
      ? tokens.typeScale.h2
      : level === 3
      ? tokens.typeScale.h3
      : tokens.typeScale.h1;

  return (
    <RNText
      {...props}
      style={[
        styles.headlineBase,
        fontStyle,
        color ? { color } : null,
        style,
      ]}
    />
  );
}

export function Subheading({ style, color, ...props }: EditorialTextProps) {
  return (
    <RNText
      {...props}
      style={[
        styles.subheadBase,
        tokens.typeScale.subhead,
        color ? { color } : null,
        style,
      ]}
    />
  );
}

export function BodyText({ style, color, muted, ...props }: EditorialTextProps) {
  return (
    <RNText
      {...props}
      style={[
        styles.baseText,
        tokens.typeScale.body,
        color ? { color } : muted ? { color: colors.inkSecondary } : null,
        style,
      ]}
    />
  );
}

export interface StatHeroProps extends EditorialTextProps {
  size?: 'large' | 'medium';
}

export function StatHero({ size = 'large', style, color, ...props }: StatHeroProps) {
  return (
    <RNText
      {...props}
      style={[
        styles.statBase,
        size === 'large' ? tokens.typeScale.statLarge : tokens.typeScale.statMedium,
        color ? { color } : null,
        style,
      ]}
    />
  );
}

export function SmallCapsLabel({ style, color, ...props }: EditorialTextProps) {
  return (
    <RNText
      {...props}
      style={[
        styles.smallCapsBase,
        tokens.typeScale.smallCaps,
        color ? { color } : null,
        style,
      ]}
    />
  );
}

export function MetaLabel({ style, color, ...props }: EditorialTextProps) {
  return (
    <RNText
      {...props}
      style={[
        styles.metaLabelBase,
        tokens.typeScale.metaLabel,
        color ? { color } : null,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  baseText: {
    fontFamily: fonts.sansRegular,
    color: colors.ink,
    fontSize: 14,
    lineHeight: 21,
  },
  headlineBase: {
    fontFamily: fonts.serifSemiBold,
    color: colors.ink,
  },
  subheadBase: {
    fontFamily: fonts.sansMedium,
    color: colors.inkSecondary,
  },
  statBase: {
    fontFamily: fonts.serifBold,
    color: colors.ink,
  },
  smallCapsBase: {
    fontFamily: fonts.sansSemiBold,
    color: colors.inkSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  metaLabelBase: {
    fontFamily: fonts.sansBold,
    color: colors.inkMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
});
