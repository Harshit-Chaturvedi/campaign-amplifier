import React from 'react';
import { View, Pressable, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import { tokens } from '../../theme/tokens';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style, onPress, padding = 16 }: CardProps) {
  const baseStyle: ViewStyle = {
    ...tokens.card,
    padding,
    ...StyleSheet.flatten(style),
  };

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          baseStyle,
          { transform: [{ scale: pressed ? 0.98 : 1 }] },
        ]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}
