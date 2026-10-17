import React from 'react';
import { View, TouchableOpacity, ViewStyle } from 'react-native';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: number;
}

export function Card({ children, style, onPress, padding = 16 }: CardProps) {
  const baseStyle: ViewStyle = {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={baseStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={baseStyle}>{children}</View>;
}
