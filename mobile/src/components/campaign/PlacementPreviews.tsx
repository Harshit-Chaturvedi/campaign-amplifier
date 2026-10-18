import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../ui/Card';

interface FeedPreviewProps {
  headline: string;
  description: string;
  imageUrl?: string;
  cta?: string;
  creatorName?: string;
}

export function FeedPlacementPreview({
  headline,
  description,
  imageUrl,
  cta = 'Learn More',
  creatorName = 'Campaign Organizer',
}: FeedPreviewProps) {
  return (
    <Card style={{ padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#fff' }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: '#eef2ff',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 10,
          }}
        >
          <Ionicons name="megaphone" size={18} color="#4f46e5" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
            {creatorName}
          </Text>
          <Text style={{ fontSize: 11, color: '#64748b' }}>Sponsored • Social Feed Placement</Text>
        </View>
        <Ionicons name="ellipsis-horizontal" size={16} color="#94a3b8" />
      </View>

      {/* Description text */}
      <View style={{ paddingHorizontal: 12, paddingBottom: 10, backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 13, color: '#334155', lineHeight: 18 }} numberOfLines={3}>
          {description || 'Your campaign primary copy will appear here across audience news feeds.'}
        </Text>
      </View>

      {/* Creative Image */}
      <View style={{ height: 180, backgroundColor: '#f1f5f9', width: '100%', overflow: 'hidden' }}>
        {imageUrl ? (
          <Image source={{ uri: imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="image-outline" size={36} color="#94a3b8" />
            <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>No creative image selected</Text>
          </View>
        )}
      </View>

      {/* Bottom Bar / CTA */}
      <View
        style={{
          padding: 12,
          backgroundColor: '#f8fafc',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
        }}
      >
        <View style={{ flex: 1, marginRight: 10 }}>
          <Text style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>
            campaigns.app
          </Text>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
            {headline || 'Campaign Headline'}
          </Text>
        </View>
        <View
          style={{
            backgroundColor: '#4f46e5',
            paddingHorizontal: 14,
            paddingVertical: 8,
            borderRadius: 8,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>{cta}</Text>
        </View>
      </View>
    </Card>
  );
}

interface VerticalStoryPreviewProps {
  headline: string;
  description: string;
  imageUrl?: string;
  cta?: string;
  creatorName?: string;
}

export function VerticalStoryPlacementPreview({
  headline,
  description,
  imageUrl,
  cta = 'Learn More',
  creatorName = 'Campaign Organizer',
}: VerticalStoryPreviewProps) {
  return (
    <View
      style={{
        width: '100%',
        maxWidth: 260,
        height: 380,
        borderRadius: 20,
        overflow: 'hidden',
        backgroundColor: '#0f172a',
        alignSelf: 'center',
        position: 'relative',
        borderWidth: 2,
        borderColor: '#334155',
      }}
    >
      {/* Background image */}
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: '100%', opacity: 0.8 }}
          resizeMode="cover"
        />
      ) : (
        <View
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#1e293b',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="phone-portrait-outline" size={44} color="#64748b" />
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>9:16 Story Preview</Text>
        </View>
      )}

      {/* Top Overlay */}
      <View
        style={{
          position: 'absolute',
          top: 14,
          left: 14,
          right: 14,
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: 'rgba(0,0,0,0.4)',
          paddingHorizontal: 10,
          paddingVertical: 6,
          borderRadius: 20,
        }}
      >
        <View
          style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#4f46e5',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <Ionicons name="megaphone" size={12} color="#fff" />
        </View>
        <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', flex: 1 }} numberOfLines={1}>
          {creatorName}
        </Text>
        <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>Sponsored</Text>
      </View>

      {/* Bottom Content Card */}
      <View
        style={{
          position: 'absolute',
          bottom: 14,
          left: 12,
          right: 12,
          backgroundColor: 'rgba(15, 23, 42, 0.88)',
          borderRadius: 14,
          padding: 12,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '800', color: '#fff', marginBottom: 4 }} numberOfLines={2}>
          {headline || 'Campaign Headline'}
        </Text>
        <Text style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 15, marginBottom: 10 }} numberOfLines={2}>
          {description || 'Swipe up to read the public citations and help reach residents.'}
        </Text>
        <View
          style={{
            backgroundColor: '#4f46e5',
            borderRadius: 8,
            paddingVertical: 8,
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff', marginRight: 4 }}>
            {cta}
          </Text>
          <Ionicons name="chevron-up" size={14} color="#fff" />
        </View>
      </View>
    </View>
  );
}

interface TextOnlyPreviewProps {
  headline: string;
  description: string;
  cta?: string;
}

export function TextOnlyPlacementPreview({
  headline,
  description,
  cta = 'Learn More',
}: TextOnlyPreviewProps) {
  return (
    <Card style={{ padding: 14, borderWidth: 1, borderColor: '#e2e8f0', backgroundColor: '#fff' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View
          style={{
            backgroundColor: '#f1f5f9',
            paddingHorizontal: 6,
            paddingVertical: 2,
            borderRadius: 4,
            marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b' }}>PROMOTED</Text>
        </View>
        <Text style={{ fontSize: 11, color: '#94a3b8' }}>r/community • Search & text channels</Text>
      </View>
      <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 6 }} numberOfLines={2}>
        {headline || 'Campaign Headline'}
      </Text>
      <Text style={{ fontSize: 13, color: '#475569', lineHeight: 19, marginBottom: 10 }} numberOfLines={3}>
        {description || 'Summary of the public issue with citations.'}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: 11, color: '#4f46e5', fontWeight: '700' }}>campaigns.app/read</Text>
        <View
          style={{
            backgroundColor: '#f1f5f9',
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 6,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>{cta}</Text>
        </View>
      </View>
    </Card>
  );
}
