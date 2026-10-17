import React from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: '#fee2e2',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 14,
        }}
      >
        <Ionicons name="alert-circle-outline" size={30} color="#ef4444" />
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
      <Text
        style={{
          fontSize: 14,
          color: '#64748b',
          textAlign: 'center',
          lineHeight: 20,
          maxWidth: 300,
          marginBottom: onRetry ? 16 : 0,
        }}
      >
        {message}
      </Text>
      {onRetry && (
        <TouchableOpacity
          onPress={onRetry}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#4f46e5',
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderRadius: 12,
            marginTop: 8,
          }}
        >
          <Ionicons name="refresh" size={16} color="#fff" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
            {retryLabel}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
