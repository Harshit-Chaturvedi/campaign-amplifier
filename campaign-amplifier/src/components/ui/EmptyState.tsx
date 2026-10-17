import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
          width: 64,
          height: 64,
          borderRadius: 32,
          backgroundColor: '#eef2ff',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Ionicons name={icon} size={32} color="#4f46e5" />
      </View>
      <Text
        style={{
          fontSize: 17,
          fontWeight: '700',
          color: '#0f172a',
          textAlign: 'center',
          marginBottom: 6,
        }}
      >
        {title}
      </Text>
      {message && (
        <Text
          style={{
            fontSize: 14,
            color: '#64748b',
            textAlign: 'center',
            lineHeight: 20,
            maxWidth: 320,
            marginBottom: actionLabel && onAction ? 16 : 0,
          }}
        >
          {message}
        </Text>
      )}
      {actionLabel && onAction && (
        <TouchableOpacity
          onPress={onAction}
          activeOpacity={0.8}
          style={{
            backgroundColor: '#4f46e5',
            paddingHorizontal: 18,
            paddingVertical: 10,
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
            {actionLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
