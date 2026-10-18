import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Source } from '../../types/campaign';

interface SourceItemProps {
  source: Source;
  index?: number;
  style?: StyleProp<ViewStyle>;
}

export function SourceItem({ source, index, style }: SourceItemProps) {
  const handleOpen = () => {
    if (source.url) {
      Linking.openURL(source.url).catch(() => {});
    }
  };

  // Clean domain display
  let domain = '';
  try {
    const urlObj = new URL(source.url);
    domain = urlObj.hostname.replace(/^www\./, '');
  } catch {
    domain = source.url.replace(/^https?:\/\//, '').split('/')[0];
  }

  return (
    <TouchableOpacity
      onPress={handleOpen}
      activeOpacity={0.7}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#f8fafc',
          borderWidth: 1,
          borderColor: '#e2e8f0',
          borderRadius: 12,
          padding: 12,
          marginBottom: 8,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: '#eef2ff',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Ionicons name="document-text-outline" size={18} color="#4f46e5" />
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: '#0f172a',
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {source.title || `Source ${index !== undefined ? index + 1 : ''}`}
        </Text>
        <Text
          style={{
            fontSize: 12,
            color: '#64748b',
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {domain || source.url}
        </Text>
      </View>
      <Ionicons name="open-outline" size={16} color="#64748b" />
    </TouchableOpacity>
  );
}
