import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CampaignStatus } from '../../types/campaign';
import { getStatusMetadata } from '../../services/lifecycle';

interface StatusBadgeProps {
  status: CampaignStatus;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  size = 'sm',
  showIcon = true,
}: StatusBadgeProps) {
  const meta = getStatusMetadata(status);

  const paddingClasses =
    size === 'sm'
      ? { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }
      : size === 'md'
      ? { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }
      : { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 12 };

  const textSize = size === 'sm' ? 11 : size === 'md' ? 12 : 14;
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16;
  const dotSize = size === 'sm' ? 5 : size === 'md' ? 6 : 8;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: meta.badgeBg,
        borderColor: meta.badgeBorder,
        borderWidth: 1,
        ...paddingClasses,
      }}
    >
      {showIcon ? (
        <Ionicons
          name={meta.icon as any}
          size={iconSize}
          color={meta.badgeText}
          style={{ marginRight: 4 }}
        />
      ) : (
        <View
          style={{
            width: dotSize,
            height: dotSize,
            borderRadius: dotSize / 2,
            backgroundColor: meta.dotColor,
            marginRight: 5,
          }}
        />
      )}
      <Text
        style={{
          fontSize: textSize,
          fontWeight: '700',
          color: meta.badgeText,
          letterSpacing: 0.2,
        }}
      >
        {meta.label}
      </Text>
    </View>
  );
}
