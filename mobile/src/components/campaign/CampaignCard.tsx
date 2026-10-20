import React, { useState } from 'react';
import { View, Text, Pressable, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { colors, fonts, tokens, getCategoryColor } from '../../theme/tokens';
import { DemoDataBadge } from '../ui/DemoDataBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { GeneratedCover } from '../ui/GeneratedCover';
import { getCoverUrl } from '../../utils/media';
import { estimateReach } from '../../services/reach';
import type { Campaign } from '../../types/campaign';

const { width: SCREEN_W } = Dimensions.get('window');

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
  const displayCategory = catLabels[campaign.category] || campaign.category;
  const coverUrl = getCoverUrl(campaign);
  const isGoalReached = (campaign.fundingGoal > 0) && (campaign.amountRaised >= campaign.fundingGoal);
  const effectiveStatus = (isGoalReached && (campaign.status === 'available_for_funding' || campaign.status === 'approved'))
    ? 'goal_reached'
    : campaign.status;
  const isBackable = effectiveStatus === 'available_for_funding';
  const reachAtGoal = campaign.estimatedReachAtGoal || estimateReach(campaign.fundingGoal).estimate;
  const [imageError, setImageError] = useState(false);

  // Compact variant
  if (variant === 'compact') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
          marginBottom: 10,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View
          style={{
            width: 60,
            height: 60,
            borderRadius: tokens.radii.xs,
            backgroundColor: colors.surfaceSecondary,
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
            <GeneratedCover category={campaign.category} title={campaign.title} height={60} />
          )}
        </View>
        <View style={{ flex: 1, justifyContent: 'center' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 14,
                fontFamily: fonts.serifSemiBold,
                color: colors.ink,
                flex: 1,
                marginRight: 6,
              }}
              numberOfLines={1}
            >
              {campaign.title}
            </Text>
            <StatusBadge status={effectiveStatus} amountRaised={campaign.amountRaised} fundingGoal={campaign.fundingGoal} size="sm" showIcon={false} />
          </View>
          <Text
            style={{
              fontSize: 10,
              fontFamily: fonts.sansBold,
              color: catColor,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
              marginTop: 2,
            }}
          >
            {displayCategory}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <ProgressBar progress={pct} color={colors.accent} height={3} />
            </View>
            <Text style={{ fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.inkSecondary }}>
              {pct}%
            </Text>
          </View>
        </View>
      </Pressable>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: Math.min(SCREEN_W * 0.82, 330),
          backgroundColor: colors.surface,
          borderRadius: 16,
          marginRight: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.04,
          shadowRadius: 2,
          elevation: 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        })}
      >
        <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' }}>
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
              top: 8,
              left: 8,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: tokens.radii.xs,
              paddingHorizontal: 7,
              paddingVertical: 2,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: catColor,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              {displayCategory}
            </Text>
          </View>
          <View style={{ position: 'absolute', top: 8, right: 8 }}>
            <StatusBadge status={effectiveStatus} amountRaised={campaign.amountRaised} fundingGoal={campaign.fundingGoal} size="sm" />
          </View>
        </View>

        <View style={{ padding: 16 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: fonts.sansSemiBold,
              color: colors.ink,
              marginBottom: 8,
              lineHeight: 22,
            }}
            numberOfLines={2}
          >
            {campaign.title}
          </Text>

          <ProgressBar progress={pct} color={colors.accent} height={4} style={{ marginBottom: 8 }} />

          <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.ink, marginBottom: 4 }}>
            {formatCurrency(campaign.amountRaised)} of {formatCurrency(campaign.fundingGoal)}{' '}
            <Text style={{ color: colors.inkSecondary, fontFamily: fonts.sansRegular }}>
              · {campaign.backerCount ?? 0} backers · {campaign.durationDays ?? 30}d left
            </Text>
          </Text>

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
              Est. reach at goal: <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>~{formatNumber(reachAtGoal)}</Text>
            </Text>
            <DemoDataBadge size="sm" />
          </View>

          {isBackable && (
            <View style={{ marginTop: 12 }}>
              <Button
                title="Back This Campaign"
                size="sm"
                onPress={onBackPress || onPress}
                fullWidth
              />
            </View>
          )}
        </View>
      </Pressable>
    );
  }

  // Default variant (Main feed on Home & Explore)
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: 16,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 2,
        elevation: 1,
        transform: [{ scale: pressed ? 0.98 : 1 }],
      })}
    >
      {/* 16:9 Real Photo */}
      <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' }}>
        {coverUrl && !imageError ? (
          <Image
            source={{ uri: coverUrl }}
            style={{ width: '100%', height: '100%' }}
            resizeMode="cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <GeneratedCover category={campaign.category} title={campaign.title} height={180} />
        )}

        <View
          style={{
            position: 'absolute',
            top: 10,
            left: 10,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: tokens.radii.xs,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontFamily: fonts.sansBold,
              color: catColor,
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            {displayCategory}
          </Text>
        </View>

        <View style={{ position: 'absolute', top: 10, right: 10 }}>
          <StatusBadge status={effectiveStatus} amountRaised={campaign.amountRaised} fundingGoal={campaign.fundingGoal} size="sm" />
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 17,
            fontFamily: fonts.sansSemiBold,
            color: colors.ink,
            marginBottom: 8,
            lineHeight: 23,
          }}
          numberOfLines={2}
        >
          {campaign.title}
        </Text>

        <ProgressBar progress={pct} color={colors.accent} height={4} style={{ marginBottom: 8 }} />

        <Text style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.ink, marginBottom: 4 }}>
          {formatCurrency(campaign.amountRaised)} of {formatCurrency(campaign.fundingGoal)}{' '}
          <Text style={{ color: colors.inkSecondary, fontFamily: fonts.sansRegular }}>
            · {campaign.backerCount ?? 0} backers · {campaign.durationDays ?? 30}d left
          </Text>
        </Text>

        {/* Reach metadata */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
            Est. reach at goal: <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>~{formatNumber(reachAtGoal)}</Text>
          </Text>
          <DemoDataBadge size="sm" />
        </View>

        {/* Clear "Back This Campaign" button */}
        {isBackable && (
          <View style={{ marginTop: 14 }}>
            <Button
              title="Back This Campaign"
              size="md"
              onPress={onBackPress || onPress}
              fullWidth
            />
          </View>
        )}
      </View>
    </Pressable>
  );
}
