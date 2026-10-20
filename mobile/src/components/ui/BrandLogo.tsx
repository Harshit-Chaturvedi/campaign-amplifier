import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  StyleProp,
  ViewStyle,
  TouchableOpacity,
} from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';
import { colors, fonts } from '../../theme/tokens';

export interface BrandLogoProps {
  size?: 'sm' | 'md';
  showWordmark?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function BrandLogo({
  size = 'md',
  showWordmark = true,
  onPress,
  style,
}: BrandLogoProps) {
  const isMd = size === 'md';
  const iconSize = isMd ? 32 : 24;

  const content = (
    <View
      style={[styles.container, style]}
      accessibilityRole="image"
      accessibilityLabel="Campaign Amplifier"
    >
      {/* Vector Brand Mark (Megaphone & Amplification Arcs) */}
      <View
        style={[
          styles.iconWrapper,
          {
            width: iconSize,
            height: iconSize,
            borderRadius: isMd ? 8 : 6,
          },
        ]}
      >
        <Svg width={iconSize} height={iconSize} viewBox="0 0 32 32" fill="none">
          {/* Subtle geometric container */}
          <Rect
            x="0.5"
            y="0.5"
            width="31"
            height="31"
            rx="7"
            fill={colors.accentFaint}
            stroke={colors.accent}
            strokeOpacity={0.2}
          />
          {/* Megaphone body */}
          <G fill={colors.accent}>
            {/* Mouthpiece */}
            <Rect x="7.5" y="14" width="2" height="4" rx="0.75" />
            {/* Horn cone */}
            <Path d="M9.5 14.5L16.5 10.5V21.5L9.5 17.5V14.5Z" />
            {/* Handle */}
            <Path d="M10.5 17.5V22C10.5 22.55 10.95 23 11.5 23H12C12.55 23 13 22.55 13 22V17.5H10.5Z" />
          </G>
          {/* Broadcast arcs */}
          <Path
            d="M20 13C21.2 14.2 21.2 17.8 20 19"
            stroke={colors.accent}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <Path
            d="M23 10.5C25.2 12.8 25.2 19.2 23 21.5"
            stroke={colors.accent}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </Svg>
      </View>

      {/* Wordmark and Tagline */}
      {showWordmark && (
        <View style={styles.textWrapper}>
          <Text
            numberOfLines={1}
            style={[
              styles.wordmark,
              {
                fontSize: isMd ? 20 : 15,
                lineHeight: isMd ? 24 : 18,
              },
            ]}
          >
            Campaign Amplifier
          </Text>
          {isMd && (
            <Text numberOfLines={1} style={styles.tagline}>
              Community-Funded Message Distribution
            </Text>
          )}
        </View>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Campaign Amplifier, scroll to top"
        style={style}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    flexShrink: 1,
  },
  iconWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    flexShrink: 0,
  },
  textWrapper: {
    marginLeft: 10,
    justifyContent: 'center',
    flex: 1,
    flexShrink: 1,
  },
  wordmark: {
    fontFamily: fonts.sansBold,
    color: colors.ink,
    letterSpacing: -0.3,
  },
  tagline: {
    fontSize: 10,
    fontFamily: fonts.sansSemiBold,
    color: colors.inkMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 2,
  },
});
