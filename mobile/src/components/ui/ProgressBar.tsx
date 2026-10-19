import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { colors } from '../../theme/tokens';

interface ProgressBarProps {
  progress: number; // 0 to 100+
  color?: string;
  bgColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color = colors.accent,
  bgColor = colors.border,
  height = 3,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View
      style={[
        {
          height,
          backgroundColor: bgColor,
          borderRadius: 2,
          overflow: 'hidden',
          width: '100%',
        },
        style,
      ]}
    >
      <View
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: color,
          borderRadius: 2,
        }}
      />
    </View>
  );
}
