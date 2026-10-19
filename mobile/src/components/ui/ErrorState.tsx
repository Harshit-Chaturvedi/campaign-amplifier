import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tokens } from '../../theme/tokens';
import { Headline, BodyText } from './Typography';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  retryLabel?: string;
  style?: StyleProp<ViewStyle>;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Unable to connect to the server. Check your connection or try again.',
  onRetry,
  retryLabel = 'Try Again',
  style,
}: ErrorStateProps) {
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
          width: 44,
          height: 44,
          borderRadius: tokens.radius.xs,
          backgroundColor: colors.dangerFaint,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Ionicons name="alert-circle-outline" size={24} color={colors.danger} />
      </View>
      <Headline
        style={{
          fontSize: 17,
          color: colors.ink,
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        {title}
      </Headline>
      <BodyText
        style={{
          fontSize: 13,
          color: colors.mutedInk,
          textAlign: 'center',
          lineHeight: 18,
          maxWidth: 300,
          marginBottom: onRetry ? 16 : 0,
        }}
      >
        {message}
      </BodyText>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.accent,
            paddingHorizontal: 16,
            paddingVertical: 9,
            borderRadius: tokens.radius.xs,
            marginTop: 8,
          }}
        >
          <Ionicons name="refresh" size={15} color={colors.surface} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.surface }}>
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
