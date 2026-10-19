import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tokens } from '../../theme/tokens';
import { Headline, BodyText, MetaLabel } from './Typography';

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'search-outline',
  title,
  message,
  actionLabel,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View
      style={[
        {
          alignItems: 'center',
          justifyContent: 'center',
          paddingVertical: 36,
          paddingHorizontal: 24,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: tokens.radius.xs,
          backgroundColor: colors.paperSecondary,
          borderWidth: 1,
          borderColor: colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Ionicons name={icon} size={24} color={colors.mutedInk} />
      </View>
      <Headline
        style={{
          fontSize: 17,
          color: colors.ink,
          textAlign: 'center',
          marginBottom: 4,
        }}
      >
        {title}
      </Headline>
      {message && (
        <BodyText
          style={{
            fontSize: 13,
            color: colors.mutedInk,
            textAlign: 'center',
            lineHeight: 18,
            maxWidth: 320,
            marginBottom: actionLabel && onAction ? 16 : 0,
          }}
        >
          {message}
        </BodyText>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={{
            backgroundColor: colors.accent,
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: tokens.radius.xs,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.surface }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
