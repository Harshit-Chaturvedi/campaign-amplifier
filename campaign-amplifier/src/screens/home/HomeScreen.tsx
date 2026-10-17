import React from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { formatNumber } from '../../utils/formatting';
import type { Campaign } from '../../types/campaign';

export function HomeScreen({ navigation }: any) {
  const featured = useCampaignStore((s) => s.getFeaturedCampaigns());
  const approved = useCampaignStore((s) => s.getApprovedCampaigns());
  const closingSoon = useCampaignStore((s) => s.getClosingSoonCampaigns());
  const contributions = useCampaignStore((s) => s.contributions);

  const totalRaised = approved.reduce((s, c) => s + c.funding_current, 0);
  const totalReach = Math.round(totalRaised * 27);

  const goToDetail = (id: string) => navigation.navigate('CampaignDetail', { campaignId: id });

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ paddingTop: 52, paddingBottom: 16, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>Campaigns</Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>Community-funded advocacy</Text>
          </View>
          <TouchableOpacity style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="notifications-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Banner */}
        <View style={{ flexDirection: 'row', marginHorizontal: 20, marginTop: 16, backgroundColor: '#4f46e5', borderRadius: 16, padding: 16 }}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{approved.length}</Text>
            <Text style={{ fontSize: 11, color: '#c7d2fe', marginTop: 2 }}>Active</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#6366f1', marginVertical: 4 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>${formatNumber(totalRaised)}</Text>
            <Text style={{ fontSize: 11, color: '#c7d2fe', marginTop: 2 }}>Raised</Text>
          </View>
          <View style={{ width: 1, backgroundColor: '#6366f1', marginVertical: 4 }} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#fff' }}>{formatNumber(totalReach)}</Text>
            <Text style={{ fontSize: 11, color: '#c7d2fe', marginTop: 2 }}>People Reached</Text>
          </View>
        </View>

        {/* Featured */}
        <View style={{ marginTop: 24 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12 }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>Featured</Text>
            <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#4f46e5' }}>See all</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingLeft: 20, paddingRight: 4 }}
            data={featured}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CampaignCard campaign={item} onPress={() => goToDetail(item.id)} variant="featured" />
            )}
          />
        </View>

        {/* Closing Soon */}
        {closingSoon.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flame" size={18} color="#f59e0b" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginLeft: 6 }}>Almost There</Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 20 }}>
              {closingSoon.slice(0, 3).map((item) => (
                <CampaignCard key={item.id} campaign={item} onPress={() => goToDetail(item.id)} variant="compact" />
              ))}
            </View>
          </View>
        )}

        {/* All Campaigns */}
        <View style={{ marginTop: 24, paddingHorizontal: 20, paddingBottom: 100 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>All Campaigns</Text>
          {approved.map((item) => (
            <CampaignCard key={item.id} campaign={item} onPress={() => goToDetail(item.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
