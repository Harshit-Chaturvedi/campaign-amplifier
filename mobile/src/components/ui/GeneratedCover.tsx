import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getCategoryColor } from '../../theme/colors';

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
  iconSize = 44,
}: GeneratedCoverProps) {
  const baseColor = getCategoryColor(category);
  const iconName = CATEGORY_ICONS[category] || 'megaphone-outline';

  return (
    <View
      style={[
        styles.container,
        {
          height: height as any,
          backgroundColor: '#0f172a', // Deep dark slate container
        },
      ]}
    >
      {/* Decorative gradient-like accent block */}
      <View
        style={[
          styles.accentGlow,
          {
            backgroundColor: baseColor,
            opacity: 0.22,
          },
        ]}
      />

      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            {
              backgroundColor: baseColor + '25',
              borderColor: baseColor + '50',
            },
          ]}
        >
          <Ionicons name={iconName} size={iconSize} color={baseColor} />
        </View>

        {title ? (
          <Text
            numberOfLines={2}
            style={styles.title}
          >
            {title}
          </Text>
        ) : null}

        <View style={[styles.categoryPill, { backgroundColor: baseColor + '20' }]}>
          <Text style={[styles.categoryText, { color: baseColor }]}>
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
  accentGlow: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -50,
    right: -50,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    zIndex: 2,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 10,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#f8fafc',
    textAlign: 'center',
    marginBottom: 8,
    maxWidth: 280,
  },
  categoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
