import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { getCategoryColor } from '../../theme/colors';
import type { CampaignCategory } from '../../types/campaign';

const CATEGORIES: { key: CampaignCategory | 'all'; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'all', label: 'All', icon: 'grid-outline' },
  { key: 'environment', label: 'Environment', icon: 'leaf-outline' },
  { key: 'health', label: 'Health', icon: 'heart-outline' },
  { key: 'science', label: 'Science', icon: 'flask-outline' },
  { key: 'education', label: 'Education', icon: 'school-outline' },
  { key: 'public_policy', label: 'Public Policy', icon: 'flag-outline' },
  { key: 'economic_policy', label: 'Economic Policy', icon: 'trending-up-outline' },
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'arts_culture', label: 'Arts & Culture', icon: 'color-palette-outline' },
  { key: 'business', label: 'Business', icon: 'briefcase-outline' },
  { key: 'other', label: 'Other', icon: 'layers-outline' },
];

export function ExploreScreen({ navigation }: any) {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<CampaignCategory | 'all'>('all');

  const searchCampaigns = useCampaignStore((s) => s.searchCampaigns);
  const getCampaignsByCategory = useCampaignStore((s) => s.getCampaignsByCategory);
  const getPublicCampaigns = useCampaignStore((s) => s.getPublicCampaigns);

  const results = search
    ? searchCampaigns(search)
    : category === 'all'
    ? getPublicCampaigns()
    : getCampaignsByCategory(category);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>Explore</Text>

        {/* Search */}
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', borderRadius: 12, paddingHorizontal: 14, height: 44 }}>
          <Ionicons name="search" size={18} color="#94a3b8" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search campaigns by title, keywords..."
            placeholderTextColor="#94a3b8"
            style={{ flex: 1, fontSize: 15, color: '#0f172a', marginLeft: 10 }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94a3b8" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Category Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
        {CATEGORIES.map((cat) => {
          const selected = category === cat.key;
          const color = cat.key === 'all' ? '#4f46e5' : getCategoryColor(cat.key);
          return (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setCategory(cat.key)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                marginRight: 8,
                backgroundColor: selected ? color : '#fff',
                borderWidth: 1,
                borderColor: selected ? color : '#e2e8f0',
              }}
            >
              <Ionicons name={cat.icon} size={14} color={selected ? '#fff' : color} />
              <Text style={{ fontSize: 13, fontWeight: '600', marginLeft: 6, color: selected ? '#fff' : '#334155' }}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Results */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}>
        <Text style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
          {results.length} campaign{results.length !== 1 ? 's' : ''} available
        </Text>
        {results.map((c) => (
          <CampaignCard
            key={c.id}
            campaign={c}
            onPress={() => navigation.navigate('CampaignDetail', { campaignId: c.id })}
          />
        ))}
        {results.length === 0 && (
          <View style={{ alignItems: 'center', paddingTop: 60 }}>
            <Ionicons name="search-outline" size={48} color="#94a3b8" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 12 }}>
              No campaigns found
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>
              Try a different keyword or category filter
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
