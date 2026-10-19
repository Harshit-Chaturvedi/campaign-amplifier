import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tokens } from '../../theme/tokens';

interface ToastProps {
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
  onDismiss?: () => void;
  style?: StyleProp<ViewStyle>;
}

export function Toast({
  message,
  variant = 'info',
  onDismiss,
  style,
}: ToastProps) {
  const configs = {
    info: {
      bg: colors.paperSecondary,
      border: colors.hairline,
      text: colors.ink,
      icon: 'information-circle-outline' as const,
      iconColor: colors.accent,
    },
    success: {
      bg: colors.paperSecondary,
      border: colors.hairline,
      text: colors.positive,
      icon: 'checkmark-circle-outline' as const,
      iconColor: colors.positive,
    },
    warning: {
      bg: colors.warningFaint,
      border: colors.border,
      text: colors.warning,
      icon: 'alert-circle-outline' as const,
      iconColor: colors.warning,
    },
    error: {
      bg: colors.dangerFaint,
      border: colors.border,
      text: colors.danger,
      icon: 'close-circle-outline' as const,
      iconColor: colors.danger,
    },
  };

  const config = configs[variant];

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: config.bg,
          borderColor: config.border,
          borderWidth: 1,
          borderRadius: tokens.radius.xs,
          paddingVertical: 10,
          paddingHorizontal: 12,
          marginVertical: 6,
        },
        style,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={16}
        color={config.iconColor}
        style={{ marginRight: 8 }}
      />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          fontFamily: fonts.sansMedium,
          color: config.text,
          lineHeight: 18,
        }}
      >
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={{ marginLeft: 8 }}
        >
          <Ionicons name="close" size={15} color={config.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}
