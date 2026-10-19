import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';
import { colors, fonts, tokens } from '../../theme/tokens';
import { SmallCapsLabel, MetaLabel } from '../ui/Typography';

interface FeedPreviewProps {
  headline: string;
  description: string;
  imageUrl?: string;
  cta?: string;
  creatorName?: string;
}

export function FeedPlacementPreview({
  headline,
  description,
  imageUrl,
  cta = 'Learn More',
  creatorName = 'Campaign Organizer',
}: FeedPreviewProps) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: colors.surface }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: tokens.radius.xs,
            backgroundColor: colors.paperSecondary,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Ionicons name="megaphone-outline" size={16} color={colors.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }} numberOfLines={1}>
            {creatorName}
          </Text>
          <MetaLabel>Sponsored • Social Feed Placement</MetaLabel>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color={colors.secondaryCaption} />
      </View>

      {/* Description text */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 10, backgroundColor: colors.surface }}>
        <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.mutedInk, lineHeight: 18 }} numberOfLines={3}>
          {description || 'Your campaign primary copy will appear here across audience news feeds.'}
        </Text>
      </View>

      {/* Creative Image */}
      <View style={{ height: 180, backgroundColor: colors.paperSecondary, width: '100%', overflow: 'hidden' }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={32} color={colors.secondaryCaption} />
            <MetaLabel style={{ marginTop: 4 }}>No creative image selected</MetaLabel>
          </View>
        )}
      </View>

      {/* Bottom Bar / CTA */}
      <View
        style={{
          padding: 12,
          backgroundColor: colors.paperSecondary,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: colors.hairline,
        }}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <SmallCapsLabel style={{ fontSize: 10, color: colors.mutedInk }}>
            CAMPAIGNS.APP
          </SmallCapsLabel>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }} numberOfLines={1}>
            {headline || 'Campaign Headline'}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: tokens.radius.xs,
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.surface }}>{cta}</Text>
        </View>
      </View>
    </Card>
  );
}

interface VerticalStoryPreviewProps {
  headline: string;
  description: string;
  imageUrl?: string;
  cta?: string;
  creatorName?: string;
}

export function VerticalStoryPlacementPreview({
  headline,
  description,
  imageUrl,
  cta = 'Learn More',
  creatorName = 'Campaign Organizer',
}: VerticalStoryPreviewProps) {
  return (
    <View
      style={{
        width: '100%',
        maxWidth: 260,
        height: 380,
        borderRadius: tokens.radius.md,
        overflow: 'hidden',
        backgroundColor: colors.ink,
        alignSelf: 'center',
        position: 'relative',
        borderWidth: 1,
        borderColor: colors.hairlineDark,
      }}
    >
      {/* Background image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%', opacity: 0.8 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: colors.ink,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="phone-portrait-outline" size={40} color={colors.mutedInk} />
          <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.secondaryCaption, marginTop: 8 }}>9:16 Story Preview</Text>
        </View>
      )}

      {/* Top Overlay */}
      <View
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(22, 19, 15, 0.65)',
          paddingHorizontal: 10,
          paddingVertical: 5,
          borderRadius: tokens.radius.xs,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <View
          style={{
            width: 22,
            height: 22,
            borderRadius: 11,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Ionicons name="megaphone" size={11} color="#fff" />
        </View>
        <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: '#fff', flex: 1 }} numberOfLines={1}>
          {creatorName}
        </Text>
        <Text style={{ fontSize: 10, fontFamily: fonts.sansRegular, color: 'rgba(255,255,255,0.7)' }}>Sponsored</Text>
      </View>

      {/* Bottom Content Card */}
      <View
        style={{
          position: 'absolute',
          bottom: 14,
          left: 12,
          right: 12,
          backgroundColor: 'rgba(22, 19, 15, 0.88)',
          borderRadius: tokens.radius.sm,
          padding: 12,
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.1)',
        }}
      >
        <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: '#fff', marginBottom: 4 }} numberOfLines={2}>
          {headline || 'Campaign Headline'}
        </Text>
        <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.border, lineHeight: 15, marginBottom: 10 }} numberOfLines={2}>
          {description || 'Swipe up to read the public citations and help reach residents.'}
        </Text>
        <View
          style={{
            backgroundColor: colors.accent,
            borderRadius: tokens.radius.xs,
            paddingVertical: 7,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: '#fff', marginRight: 4 }}>
            {cta}
          </Text>
          <Ionicons name="chevron-up" size={14} color="#fff" />
        </View>
      </View>
    </View>
  );
}

interface TextOnlyPreviewProps {
  headline: string;
  description: string;
  cta?: string;
}

export function TextOnlyPlacementPreview({
  headline,
  description,
  cta = 'Learn More',
}: TextOnlyPreviewProps) {
  return (
    <Card style={{ padding: 14, borderWidth: 1, borderColor: colors.hairline, backgroundColor: colors.surface }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View
          style={{
            backgroundColor: colors.paperSecondary,
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: tokens.radius.xs,
            borderWidth: 1,
            borderColor: colors.hairline,
            marginRight: 8,
          }}
        >
          <SmallCapsLabel style={{ fontSize: 9, color: colors.mutedInk }}>PROMOTED</SmallCapsLabel>
        </View>
        <MetaLabel>r/community • Search & text channels</MetaLabel>
      </View>
      <Text style={{ fontSize: 15, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 6 }} numberOfLines={2}>
        {headline || 'Campaign Headline'}
      </Text>
      <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.mutedInk, lineHeight: 19, marginBottom: 10 }} numberOfLines={3}>
        {description || 'Summary of the public issue with citations.'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.accent }}>campaigns.app/read</Text>
        <View
          style={{
            backgroundColor: colors.paperSecondary,
            borderWidth: 1,
            borderColor: colors.hairline,
            paddingHorizontal: 12,
            paddingVertical: 5,
            borderRadius: tokens.radius.xs,
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.ink }}>{cta}</Text>
        </View>
      </View>
    </Card>
  );
}
