import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StoryBlock } from '../../types/campaign';
import { colors, fonts, tokens } from '../../theme/tokens';
import { StatHero, SmallCapsLabel, MetaLabel } from '../ui/Typography';

interface StoryBlockRendererProps {
  block: StoryBlock;
  index: number;
  style?: StyleProp<ViewStyle>;
}

export function StoryBlockRenderer({ block, index, style }: StoryBlockRendererProps) {
  switch (block.type) {
    case 'heading': {
      const level = block.level || 2;
      const fontSize = level === 1 ? 22 : level === 2 ? 18 : 16;
      return (
        <Text
          key={index}
          style={[
            {
              fontSize,
              fontFamily: fonts.serifBold,
              color: colors.ink,
              marginTop: index === 0 ? 0 : 20,
              marginBottom: 10,
              lineHeight: fontSize + 6,
            },
            style,
          ]}
        >
          {block.text}
        </Text>
      );
    }
    case 'paragraph':
      return (
        <Text
          key={index}
          style={[
            {
              fontSize: 15,
              fontFamily: fonts.sansRegular,
              color: colors.ink,
              lineHeight: 24,
              marginBottom: 14,
            },
            style,
          ]}
        >
          {block.text}
        </Text>
      );
    case 'image':
      return (
        <View
          key={index}
          style={[
            {
              marginVertical: 14,
              borderRadius: tokens.radius.sm,
              overflow: 'hidden',
              backgroundColor: colors.paperSecondary,
              borderWidth: 1,
              borderColor: colors.hairline,
            },
            style,
          ]}
        >
          {block.url ? (
            <Image
              source={{ uri: block.url }}
              style={{ width: '100%', height: 210 }}
              resizeMode="cover"
            />
          ) : (
            <View style={{ width: '100%', height: 160, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={36} color={colors.secondaryCaption} />
              <MetaLabel style={{ marginTop: 6 }}>No image URL</MetaLabel>
            </View>
          )}
          {(block.caption || block.credit) && (
            <View style={{ padding: 10, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.hairline }}>
              {block.caption && (
                <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.mutedInk, fontStyle: 'italic' }}>
                  {block.caption}
                </Text>
              )}
              {block.credit && (
                <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.secondaryCaption, marginTop: 2 }}>
                  Credit: {block.credit}
                </Text>
              )}
            </View>
          )}
        </View>
      );
    case 'statistic':
      return (
        <View
          key={index}
          style={[
            {
              marginVertical: 14,
              backgroundColor: colors.paperSecondary,
              borderRadius: tokens.radius.sm,
              padding: tokens.spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: colors.accent,
              borderWidth: 1,
              borderColor: colors.hairline,
            },
            style,
          ]}
        >
          <StatHero style={{ fontSize: 26, color: colors.ink }}>
            {block.value}
          </StatHero>
          <SmallCapsLabel style={{ color: colors.accent, marginTop: 4 }}>
            {block.label}
          </SmallCapsLabel>
        </View>
      );
    case 'quote':
      return (
        <View
          key={index}
          style={[
            {
              marginVertical: 14,
              backgroundColor: colors.paperSecondary,
              borderRadius: tokens.radius.sm,
              padding: tokens.spacing.md,
              borderLeftWidth: 3,
              borderLeftColor: colors.ink,
              borderWidth: 1,
              borderColor: colors.hairline,
            },
            style,
          ]}
        >
          <Text style={{ fontSize: 16, fontFamily: fonts.serifRegular, fontStyle: 'italic', color: colors.ink, lineHeight: 24 }}>
            "{block.quote}"
          </Text>
          {block.attribution && (
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.mutedInk, marginTop: 8 }}>
              — {block.attribution}
            </Text>
          )}
        </View>
      );
    case 'action':
      return (
        <View
          key={index}
          style={[
            {
              marginVertical: 14,
              backgroundColor: colors.paperSecondary,
              borderRadius: tokens.radius.sm,
              padding: tokens.spacing.md,
              borderWidth: 1,
              borderColor: colors.hairline,
            },
            style,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="checkbox-outline" size={16} color={colors.positive} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
              {block.title}
            </Text>
          </View>
          <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.mutedInk, lineHeight: 19 }}>
            {block.description}
          </Text>
          {block.url && (
            <TouchableOpacity
              onPress={() => Linking.openURL(block.url!).catch(() => {})}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
            >
              <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.positive, marginRight: 4 }}>
                Take action
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.positive} />
            </TouchableOpacity>
          )}
        </View>
      );
    default:
      return null;
  }
}
