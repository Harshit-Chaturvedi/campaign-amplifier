import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';
import { DemoDataBadge } from '../ui/DemoDataBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { GeneratedCover } from '../ui/GeneratedCover';
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
  onBackPress?: () => void;
  variant?: 'default' | 'compact' | 'featured';
}

export function CampaignCard({
  campaign,
  onPress,
  onBackPress,
  variant = 'default',
}: CampaignCardProps) {
  const catColor = getCategoryColor(campaign.category);
  const pct = campaign.percentFunded ?? 0;
  const barColor = pct >= 100 ? '#22c55e' : '#4f46e5';
  const displayCategory = catLabels[campaign.category] || campaign.category;
  const coverUrl = campaign.adAssets?.coverUrl;
  const isBackable = campaign.status === 'available_for_funding';
  const [imageError, setImageError] = useState(false);

  // Compact variant (used in lists, recent views, or activity)
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
            overflow: 'hidden',
          }}
        >
          {coverUrl && !imageError ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <Ionicons
              name={catIcons[campaign.category] || 'megaphone-outline'}
              size={24}
              color={catColor}
            />
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 6 }}
              numberOfLines={1}
            >
              {campaign.title}
            </Text>
            <StatusBadge status={campaign.status} size="sm" showIcon={false} />
          </View>
          <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{campaign.creatorName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ProgressBar progress={pct} color={barColor} height={4} />
            </View>
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>{pct}%</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  // Featured variant (carousel on Home)
  if (variant === 'featured') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={{
          width: Math.min(SCREEN_W * 0.82, 330),
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
        <View style={{ height: 155, backgroundColor: catColor + '15', overflow: 'hidden' }}>
          {coverUrl && !imageError ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <GeneratedCover category={campaign.category} title={campaign.title} height={155} />
          )}

          <View
            style={{
              position: 'absolute',
              top: 10,
              left: 10,
              backgroundColor: 'rgba(255,255,255,0.92)',
              borderRadius: 20,
              paddingHorizontal: 10,
              paddingVertical: 3,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: catColor }}>{displayCategory}</Text>
          </View>
          <View style={{ position: 'absolute', top: 10, right: 10 }}>
            <StatusBadge status={campaign.status} size="sm" />
          </View>
        </View>

        <View style={{ padding: 15 }}>
          <Text
            style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 4, lineHeight: 20 }}
            numberOfLines={2}
          >
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }} numberOfLines={1}>
            {campaign.summary || campaign.tagline}
          </Text>

          <ProgressBar progress={pct} color={barColor} height={6} style={{ marginBottom: 6 }} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
              {formatCurrency(campaign.amountRaised)}
            </Text>
            <Text style={{ fontSize: 12, color: '#94a3b8' }}>of {formatCurrency(campaign.fundingGoal)} goal</Text>
          </View>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: '#f8fafc',
            }}
          >
            <Text style={{ fontSize: 11, color: '#64748b' }}>
              Est. reach: <Text style={{ fontWeight: '700', color: '#4f46e5' }}>{formatNumber(campaign.estimatedReachAtGoal)}</Text>
            </Text>
            <DemoDataBadge size="sm" />
          </View>

          {isBackable && (
            <View style={{ marginTop: 12 }}>
              <Button
                title="Back This Campaign"
                size="sm"
                icon="megaphone-outline"
                onPress={onBackPress || onPress}
                fullWidth
              />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }

  // Default variant (Main feed on Home & Explore)
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.88}
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 3,
      }}
    >
      {/* Cover Creative */}
      <View style={{ height: 160, backgroundColor: catColor + '12', overflow: 'hidden' }}>
        {coverUrl && !imageError ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <GeneratedCover category={campaign.category} title={campaign.title} height={160} />
        )}

        <View
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            backgroundColor: 'rgba(255,255,255,0.92)',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: catColor }}>{displayCategory}</Text>
        </View>

        <View style={{ position: 'absolute', top: 12, right: 12 }}>
          <StatusBadge status={campaign.status} size="sm" />
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 16 }}>
        <Text
          style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 4, lineHeight: 22 }}
          numberOfLines={2}
        >
          {campaign.title}
        </Text>

        <Text style={{ fontSize: 12, color: '#94a3b8', marginBottom: 6 }}>
          by {campaign.creatorName}
        </Text>

        <Text
          style={{ fontSize: 13, color: '#475569', lineHeight: 18, marginBottom: 12 }}
          numberOfLines={2}
        >
          {campaign.summary || campaign.tagline}
        </Text>

        {/* Funding Progress Bar */}
        <ProgressBar progress={pct} color={barColor} height={6} style={{ marginBottom: 6 }} />

        {/* Raised vs Goal */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
            {formatCurrency(campaign.amountRaised)}{' '}
            <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b' }}>raised</Text>
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8' }}>
            {pct}% of {formatCurrency(campaign.fundingGoal)}
          </Text>
        </View>

        {/* Reach metadata */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 10,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: '#f8fafc',
          }}
        >
          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '500' }}>
            Est. reach at goal: <Text style={{ fontWeight: '700', color: '#4f46e5' }}>{formatNumber(campaign.estimatedReachAtGoal)}</Text>
          </Text>
          <DemoDataBadge size="sm" />
        </View>

        {/* Clear "Back This Campaign" button */}
        {isBackable && (
          <View style={{ marginTop: 14 }}>
            <Button
              title="Back This Campaign"
              icon="megaphone-outline"
              size="md"
              onPress={onBackPress || onPress}
              fullWidth
            />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}
