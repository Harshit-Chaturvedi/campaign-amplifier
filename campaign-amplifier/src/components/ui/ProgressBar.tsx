import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';

interface ProgressBarProps {
  progress: number; // 0 to 100+
  color?: string;
  bgColor?: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
}

export function ProgressBar({
  progress,
  color = '#4f46e5',
  bgColor = '#e2e8f0',
  height = 6,
  style,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, progress));

  return (
    <View
      style={[
        {
          height,
          backgroundColor: bgColor,
          borderRadius: height / 2,
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
          borderRadius: height / 2,
        }}
      />
    </View>
  );
}
