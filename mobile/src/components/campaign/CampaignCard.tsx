import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { colors, fonts, tokens } from '../../theme/tokens';
import { DemoDataBadge } from '../ui/DemoDataBadge';
import { StatusBadge } from '../ui/StatusBadge';
import { ProgressBar } from '../ui/ProgressBar';
import { Button } from '../ui/Button';
import { GeneratedCover } from '../ui/GeneratedCover';
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
  const catColor = colors.category[campaign.category] || colors.accent;
  const pct = campaign.percentFunded ?? 0;
  const displayCategory = catLabels[campaign.category] || campaign.category;
  const coverUrl = campaign.adAssets?.coverUrl;
  const isBackable = campaign.status === 'available_for_funding';
  const [imageError, setImageError] = useState(false);

  // Compact variant
  if (variant === 'compact') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderRadius: tokens.radii.sm,
          borderWidth: 1,
          borderColor: colors.border,
          padding: 12,
          marginBottom: 10,
        }}
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
            <StatusBadge status={campaign.status} size="sm" showIcon={false} />
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
      </TouchableOpacity>
    );
  }

  // Featured variant
  if (variant === 'featured') {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.88}
        style={{
          width: Math.min(SCREEN_W * 0.82, 330),
          backgroundColor: colors.surface,
          borderRadius: tokens.radii.md,
          marginRight: 16,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: colors.border,
        }}
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
            <StatusBadge status={campaign.status} size="sm" />
          </View>
        </View>

        <View style={{ padding: 14 }}>
          <Text
            style={{
              fontSize: 16,
              fontFamily: fonts.serifSemiBold,
              color: colors.ink,
              marginBottom: 4,
              lineHeight: 22,
            }}
            numberOfLines={2}
          >
            {campaign.title}
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sansRegular,
              color: colors.inkSecondary,
              marginBottom: 10,
              lineHeight: 16,
            }}
            numberOfLines={1}
          >
            {campaign.summary || campaign.tagline}
          </Text>

          {/* Newspaper graphic stat heroes */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              paddingVertical: 8,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              marginBottom: 8,
            }}
          >
            <View>
              <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.ink }}>
                {formatCurrency(campaign.amountRaised)}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: fonts.sansBold,
                  color: colors.inkMuted,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                RAISED
              </Text>
            </View>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.accent }}>
                {pct}%
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: fonts.sansBold,
                  color: colors.inkMuted,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                FUNDED
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.ink }}>
                {formatCurrency(campaign.fundingGoal)}
              </Text>
              <Text
                style={{
                  fontSize: 9,
                  fontFamily: fonts.sansBold,
                  color: colors.inkMuted,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                }}
              >
                GOAL
              </Text>
            </View>
          </View>

          <ProgressBar progress={pct} color={colors.accent} height={3} style={{ marginBottom: 8 }} />

          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
              Est. reach: <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{formatNumber(campaign.estimatedReachAtGoal)}</Text>
            </Text>
            <DemoDataBadge size="sm" />
          </View>

          {isBackable && (
            <View style={{ marginTop: 10 }}>
              <Button
                title="Back This Campaign"
                size="sm"
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
        backgroundColor: colors.surface,
        borderRadius: tokens.radii.md,
        borderWidth: 1,
        borderColor: colors.border,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      {/* 16:9 Real Photo - No Gradient Overlay */}
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
          <StatusBadge status={campaign.status} size="sm" />
        </View>
      </View>

      {/* Body */}
      <View style={{ padding: 16 }}>
        <Text
          style={{
            fontSize: 18,
            fontFamily: fonts.serifSemiBold,
            color: colors.ink,
            marginBottom: 4,
            lineHeight: 24,
          }}
          numberOfLines={2}
        >
          {campaign.title}
        </Text>

        <Text
          style={{
            fontSize: 12,
            fontFamily: fonts.sansRegular,
            color: colors.inkMuted,
            marginBottom: 6,
          }}
        >
          by {campaign.creatorName}
        </Text>

        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.sansRegular,
            color: colors.inkSecondary,
            lineHeight: 19,
            marginBottom: 14,
          }}
          numberOfLines={2}
        >
          {campaign.summary || campaign.tagline}
        </Text>

        {/* Hero Numbers Block - Newspaper Graphic Style */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingVertical: 10,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            marginBottom: 10,
            backgroundColor: colors.surfaceSecondary,
            paddingHorizontal: 12,
            borderRadius: tokens.radii.xs,
          }}
        >
          <View>
            <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.ink }}>
              {formatCurrency(campaign.amountRaised)}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.inkMuted,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              RAISED
            </Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.accent }}>
              {pct}%
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.inkMuted,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              FUNDED
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.ink }}>
              {formatCurrency(campaign.fundingGoal)}
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.inkMuted,
                letterSpacing: 0.8,
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              GOAL
            </Text>
          </View>
        </View>

        {/* Thin Progress Bar */}
        <ProgressBar progress={pct} color={colors.accent} height={3} style={{ marginBottom: 10 }} />

        {/* Reach metadata */}
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 4,
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
            Est. reach: <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{formatNumber(campaign.estimatedReachAtGoal)} people</Text>
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
    </TouchableOpacity>
  );
}
