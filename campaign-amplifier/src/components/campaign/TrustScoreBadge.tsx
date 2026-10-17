import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTrustColor } from '../../theme/colors';

interface TrustScoreBadgeProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function TrustScoreBadge({ score, size = 'md', showLabel = false }: TrustScoreBadgeProps) {
  if (score === null) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 4 }}>
        <Ionicons name="time-outline" size={14} color="#94a3b8" />
        <Text style={{ fontSize: 11, color: '#94a3b8', marginLeft: 4 }}>Pending</Text>
      </View>
    );
  }

  const color = getTrustColor(score);
  const label = score >= 70 ? 'Verified' : score >= 55 ? 'Under Review' : 'Flagged';
  const icon = score >= 70 ? 'shield-checkmark' : score >= 55 ? 'alert-circle' : 'warning';

  const sizes = {
    sm: { px: 8, py: 3, icon: 12, text: 11 },
    md: { px: 10, py: 5, icon: 16, text: 13 },
    lg: { px: 14, py: 7, icon: 20, text: 15 },
  };
  const s = sizes[size];

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 20,
        paddingHorizontal: s.px,
        paddingVertical: s.py,
        backgroundColor: color + '20',
      }}
    >
      <Ionicons name={icon as any} size={s.icon} color={color} />
      <Text style={{ fontWeight: '700', marginLeft: 4, fontSize: s.text, color }}>{score}</Text>
      {showLabel && (
        <Text style={{ marginLeft: 4, fontWeight: '500', fontSize: s.text, color }}>{label}</Text>
      )}
    </View>
  );
}
