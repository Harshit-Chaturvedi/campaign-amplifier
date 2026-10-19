import React from 'react';
import { View, Text } from 'react-native';
import { colors, fonts, tokens } from '../../theme/tokens';

interface DemoDataBadgeProps {
  size?: 'sm' | 'md';
}

export function DemoDataBadge({ size = 'sm' }: DemoDataBadgeProps) {
  const isSm = size === 'sm';
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSecondary,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: tokens.radii.xs,
        paddingHorizontal: isSm ? 6 : 8,
        paddingVertical: isSm ? 2 : 4,
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          width: 4,
          height: 4,
          borderRadius: 2,
          backgroundColor: colors.inkMuted,
          marginRight: 4,
        }}
      />
      <Text
        style={{
          fontSize: isSm ? 9 : 10,
          fontFamily: fonts.sansBold,
          color: colors.inkSecondary,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
        }}
      >
        Demo data
      </Text>
    </View>
  );
}
