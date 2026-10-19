import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { CampaignStatus } from '../../types/campaign';
import { getStatusMetadata } from '../../services/lifecycle';
import { fonts, tokens } from '../../theme/tokens';

interface StatusBadgeProps {
  status: CampaignStatus;
  amountRaised?: number;
  fundingGoal?: number;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export function StatusBadge({
  status,
  amountRaised,
  fundingGoal,
  size = 'sm',
  showIcon = true,
}: StatusBadgeProps) {
  let effectiveStatus = status;
  if (
    amountRaised !== undefined &&
    fundingGoal !== undefined &&
    fundingGoal > 0 &&
    amountRaised >= fundingGoal &&
    (status === 'available_for_funding' || status === 'approved')
  ) {
    effectiveStatus = 'goal_reached';
  }

  const meta = getStatusMetadata(effectiveStatus);

  const paddingClasses =
    size === 'sm'
      ? { paddingHorizontal: 7, paddingVertical: 2, borderRadius: tokens.radius.xs }
      : size === 'md'
      ? { paddingHorizontal: 9, paddingVertical: 4, borderRadius: tokens.radius.xs }
      : { paddingHorizontal: 12, paddingVertical: 6, borderRadius: tokens.radius.sm };

  const textSize = size === 'sm' ? 10 : size === 'md' ? 11 : 13;
  const iconSize = size === 'sm' ? 11 : size === 'md' ? 13 : 15;
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
          fontFamily: fonts.sansBold,
          color: meta.badgeText,
          letterSpacing: 0.5,
          textTransform: 'uppercase',
        }}
      >
        {meta.label}
      </Text>
    </View>
  );
}
