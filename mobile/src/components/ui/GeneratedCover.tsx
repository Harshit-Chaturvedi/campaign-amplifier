import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor } from '../../theme/colors';
import { colors, fonts, tokens } from '../../theme/tokens';

interface GeneratedCoverProps {
  category: string;
  title?: string;
  height?: number | string;
  iconSize?: number;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  environment: 'leaf-outline',
  health: 'heart-outline',
  science: 'flask-outline',
  education: 'school-outline',
  public_policy: 'flag-outline',
  economic_policy: 'trending-up-outline',
  community: 'people-outline',
  arts_culture: 'color-palette-outline',
  business: 'briefcase-outline',
  other: 'layers-outline',
};

export function GeneratedCover({
  category,
  title,
  height = '100%',
  iconSize = 32,
}: GeneratedCoverProps) {
  const iconName = CATEGORY_ICONS[category] || 'megaphone-outline';

  return (
    <View
      style={[
        styles.container,
        {
          height: height as any,
          backgroundColor: colors.paperSecondary,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        },
      ]}
    >
      <View style={styles.content}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: tokens.radius.xs,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <Ionicons name={iconName} size={iconSize} color={colors.accent} />
        </View>

        {title ? (
          <Text
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </Text>
        ) : null}

        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>
            {category.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  title: {
    fontSize: 14,
    fontFamily: fonts.serifBold,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 6,
    maxWidth: 280,
  },
  categoryPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: tokens.radius.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.hairline,
  },
  categoryText: {
    fontSize: 9,
    fontFamily: fonts.sansBold,
    letterSpacing: 0.8,
    color: colors.mutedInk,
  },
});
