import React from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';
import { DemoDataBadge } from '../ui/DemoDataBadge';
import type { Campaign } from '../../types/campaign';

const { width: SCREEN_W } = Dimensions.get('window');

const catIcons: Record<string, keyof typeof Ionicons.glyphMap> = {
  environment: 'leaf-outline',
  health: 'heart-outline',
  science: 'flask-outline',
  education: 'school-outline',
  public_policy: 'flag-outline',
  economic_policy: 'trending-up-outline',
  community: 'people-outline',
  arts_culture: 'color-palette-outline',
  business: 'briefcase-outline',
  other: 'grid-outline',
};

const catLabels: Record<string, string> = {
  environment: 'Environment',
  health: 'Health',
  science: 'Science',
  education: 'Education',
  public_policy: 'Public Policy',
  economic_policy: 'Economic Policy',
  community: 'Community',
  arts_culture: 'Arts & Culture',
  business: 'Business',
  other: 'Other',
};

interface CampaignCardProps {
  campaign: Campaign;
  onPress: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export function CampaignCard({ campaign, onPress, variant = 'default' }: CampaignCardProps) {
  const catColor = getCategoryColor(campaign.category);
  const pct = campaign.percent_funded;
  const barColor = pct >= 100 ? '#22c55e' : '#4f46e5';
  const displayCategory = catLabels[campaign.category] || campaign.category;

  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          backgroundColor: '#fff',
          borderRadius: 14,
          borderWidth: 1,
          borderColor: '#f1f5f9',
          padding: 12,
          marginBottom: 10,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            backgroundColor: catColor + '15',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name={catIcons[campaign.category] || 'megaphone-outline'} size={24} color={catColor} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }} numberOfLines={1}>
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{campaign.creator_name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <View style={{ flex: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, marginRight: 8 }}>
              <View style={{ width: `${Math.min(100, pct)}%`, height: 4, backgroundColor: barColor, borderRadius: 2 }} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>{pct}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  if (variant === 'featured') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.85}
        style={{
          width: SCREEN_W * 0.82,
          backgroundColor: '#fff',
          borderRadius: 18,
          marginRight: 16,
          overflow: 'hidden',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 4,
          borderWidth: 1,
          borderColor: '#f1f5f9',
        }}
      >
        <View style={{ height: 160, backgroundColor: catColor + '15', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name={catIcons[campaign.category] || 'megaphone'} size={40} color={catColor} />
          <View
            style={{
              position: 'absolute',
              top: 12,
              left: 12,
              backgroundColor: catColor + '20',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 4,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>{displayCategory}</Text>
          </View>
          <View style={{ position: 'absolute', top: 12, right: 12 }}>
            <DemoDataBadge size="sm" />
          </View>
        </View>
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 }} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }} numberOfLines={1}>
            {campaign.tagline}
          </Text>
          <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 }}>
            <View style={{ width: `${Math.min(100, pct)}%`, height: 6, backgroundColor: barColor, borderRadius: 3 }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
              {formatCurrency(campaign.funding_current)} raised
            </Text>
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>of {formatCurrency(campaign.funding_goal)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 2,
      }}
    >
      <View style={{ height: 150, backgroundColor: catColor + '12', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name={catIcons[campaign.category] || 'megaphone-outline'} size={36} color={catColor} />
        <Text style={{ fontSize: 13, color: catColor, marginTop: 8, fontWeight: '600' }}>{displayCategory}</Text>
        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: catColor + '20',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '600', color: catColor }}>{displayCategory}</Text>
        </View>
        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <DemoDataBadge size="sm" />
        </View>
      </View>
      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4 }} numberOfLines={2}>
          {campaign.title}
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 2 }} numberOfLines={1}>
          {campaign.tagline}
        </Text>
        <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 12 }}>by {campaign.creator_name}</Text>
        <View style={{ height: 6, backgroundColor: '#e2e8f0', borderRadius: 3 }}>
          <View style={{ width: `${Math.min(100, pct)}%`, height: 6, backgroundColor: barColor, borderRadius: 3 }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
            {formatCurrency(campaign.funding_current)}
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            {pct}% of {formatCurrency(campaign.funding_goal)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
