import React from 'react';
import { View, Text } from 'react-native';

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
        backgroundColor: '#f1f5f9',
        borderWidth: 1,
        borderColor: '#e2e8f0',
        borderRadius: 12,
        paddingHorizontal: isSm ? 6 : 8,
        paddingVertical: isSm ? 2 : 4,
        alignSelf: 'flex-start',
      }}
    >
      <View
        style={{
          width: 5,
          height: 5,
          borderRadius: 2.5,
          backgroundColor: '#94a3b8',
          marginRight: 4,
        }}
      />
      <Text
        style={{
          fontSize: isSm ? 10 : 11,
          fontWeight: '600',
          color: '#64748b',
          letterSpacing: 0.2,
          textTransform: 'uppercase',
        }}
      >
        Demo data
      </Text>
    </View>
  );
}
