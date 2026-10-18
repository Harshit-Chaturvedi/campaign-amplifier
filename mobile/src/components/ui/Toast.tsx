import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      bg: '#eff6ff',
      border: '#bfdbfe',
      text: '#1e40af',
      icon: 'information-circle' as const,
      iconColor: '#3b82f6',
    },
    success: {
      bg: '#f0fdf4',
      border: '#bbf7d0',
      text: '#166534',
      icon: 'checkmark-circle' as const,
      iconColor: '#22c55e',
    },
    warning: {
      bg: '#fffbeb',
      border: '#fde68a',
      text: '#92400e',
      icon: 'alert-circle' as const,
      iconColor: '#f59e0b',
    },
    error: {
      bg: '#fef2f2',
      border: '#fecaca',
      text: '#991b1b',
      icon: 'close-circle' as const,
      iconColor: '#ef4444',
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
          borderRadius: 12,
          paddingVertical: 10,
          paddingHorizontal: 14,
          marginVertical: 6,
        },
        style,
      ]}
    >
      <Ionicons
        name={config.icon}
        size={18}
        color={config.iconColor}
        style={{ marginRight: 8 }}
      />
      <Text
        style={{
          flex: 1,
          fontSize: 13,
          fontWeight: '500',
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
          <Ionicons name="close" size={16} color={config.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}
