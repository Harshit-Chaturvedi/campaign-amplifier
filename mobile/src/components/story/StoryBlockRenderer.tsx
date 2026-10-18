import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { StoryBlock } from '../../types/campaign';

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
              fontWeight: '800',
              color: '#0f172a',
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
              color: '#334155',
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
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              borderWidth: 1,
              borderColor: '#e2e8f0',
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
              <Ionicons name="image-outline" size={40} color="#94a3b8" />
              <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6 }}>No image URL</Text>
            </View>
          )}
          {(block.caption || block.credit) && (
            <View style={{ padding: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              {block.caption && (
                <Text style={{ fontSize: 13, color: '#475569', fontStyle: 'italic' }}>
                  {block.caption}
                </Text>
              )}
              {block.credit && (
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
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
              backgroundColor: '#eef2ff',
              borderRadius: 16,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#4f46e5',
            },
            style,
          ]}
        >
          <Text style={{ fontSize: 28, fontWeight: '900', color: '#1e1b4b' }}>
            {block.value}
          </Text>
          <Text style={{ fontSize: 13, fontWeight: '600', color: '#4338ca', marginTop: 4 }}>
            {block.label}
          </Text>
        </View>
      );
    case 'quote':
      return (
        <View
          key={index}
          style={[
            {
              marginVertical: 14,
              backgroundColor: '#f8fafc',
              borderRadius: 16,
              padding: 18,
              borderLeftWidth: 4,
              borderLeftColor: '#0284c7',
            },
            style,
          ]}
        >
          <Text style={{ fontSize: 16, fontStyle: 'italic', color: '#1e293b', lineHeight: 24 }}>
            "{block.quote}"
          </Text>
          {block.attribution && (
            <Text style={{ fontSize: 13, color: '#64748b', fontWeight: '600', marginTop: 8 }}>
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
              backgroundColor: '#f0fdf4',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#bbf7d0',
            },
            style,
          ]}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
            <Ionicons name="checkbox-outline" size={18} color="#16a34a" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#14532d' }}>
              {block.title}
            </Text>
          </View>
          <Text style={{ fontSize: 13, color: '#166534', lineHeight: 19 }}>
            {block.description}
          </Text>
          {block.url && (
            <TouchableOpacity
              onPress={() => Linking.openURL(block.url!).catch(() => {})}
              style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
            >
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a', marginRight: 4 }}>
                Take action
              </Text>
              <Ionicons name="open-outline" size={14} color="#16a34a" />
            </TouchableOpacity>
          )}
        </View>
      );
    default:
      return null;
  }
}
