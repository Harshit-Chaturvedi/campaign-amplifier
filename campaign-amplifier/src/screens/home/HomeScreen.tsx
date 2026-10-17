import React from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { formatNumber } from '../../utils/formatting';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { estimateReach, estimateReachPerDollar } from '../../services/reach';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

export function HomeScreen({ navigation }: any) {
  const getFeatured = useCampaignStore((s) => s.getFeaturedCampaigns);
  const getPublicCampaigns = useCampaignStore((s) => s.getPublicCampaigns);
  const campaigns = useCampaignStore((s) => s.campaigns);

  const featured = getFeatured();
  const publicCampaigns = getPublicCampaigns();

  const activeFunding = publicCampaigns.filter((c) => c.status === 'available_for_funding');
  const almostFunded = publicCampaigns.filter(
    (c) => c.status === 'available_for_funding' && c.percentFunded >= 60
  );

  const totalRaised = publicCampaigns.reduce((s, c) => s + (c.amountRaised || 0), 0);
  const totalReach = estimateReach(totalRaised).estimate;
  const reachPerDollar = estimateReachPerDollar();

  const goToDetail = (id: string) => navigation.navigate('CampaignDetail', { campaignId: id });

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>Campaigns</Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Community-funded message amplification
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('ActivityTab')}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications-outline" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Core Hero Section per Brief */}
        <View
          style={{
            marginHorizontal: 20,
            marginTop: 16,
            backgroundColor: '#1e1b4b',
            borderRadius: 20,
            padding: 22,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#c7d2fe' }}>MESSAGE AMPLIFICATION</Text>
            </View>
            <DemoDataBadge size="sm" />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#ffffff', lineHeight: 28 }}>
            Help important messages travel beyond their networks
          </Text>
          <Text style={{ fontSize: 13, color: '#c7d2fe', marginTop: 8, lineHeight: 19 }}>
            Not a donation to causes. Backers pool funds to pay for digital advertising that spreads verified messages to audiences who can act.
          </Text>

          {/* Illustrative Reach per Dollar */}
          <View style={{ backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 12, padding: 12, marginTop: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash-outline" size={16} color="#818cf8" />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#e0e7ff', marginLeft: 6 }}>
                ~{reachPerDollar} people reached per $1 backed
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>
              Estimated from configurable CPM assumptions. Not a delivery guarantee.
            </Text>
          </View>

          {/* Primary Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Explore"
                onPress={() => navigation.navigate('ExploreTab')}
                variant="primary"
                size="sm"
                icon="compass-outline"
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Start Campaign"
                onPress={() => navigation.navigate('CreateTab')}
                variant="secondary"
                size="sm"
                icon="add-circle-outline"
                fullWidth
              />
            </View>
          </View>
        </View>

        {/* Platform Metrics Bar */}
        <View style={{ marginHorizontal: 20, marginTop: 14, backgroundColor: '#4f46e5', borderRadius: 16, padding: 14 }}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{campaigns.length}</Text>
              <Text style={{ fontSize: 11, color: '#c7d2fe', marginTop: 2 }}>Campaigns</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#6366f1', marginVertical: 2 }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>${formatNumber(totalRaised)}</Text>
              <Text style={{ fontSize: 11, color: '#c7d2fe', marginTop: 2 }}>Pooled</Text>
            </View>
            <View style={{ width: 1, backgroundColor: '#6366f1', marginVertical: 2 }} />
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#fff' }}>{formatNumber(totalReach)}</Text>
              <Text style={{ fontSize: 11, color: '#c7d2fe', marginTop: 2 }}>Est. Reach</Text>
            </View>
          </View>
        </View>

        {/* How It Works Sequence per Brief */}
        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 10 }}>
            How It Works
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[
              { step: '1', title: 'Create', desc: 'Craft story with sources and target audience', icon: 'create-outline' },
              { step: '2', title: 'Review', desc: 'Moderators check claims and ad compliance', icon: 'shield-checkmark-outline' },
              { step: '3', title: 'Amplify', desc: 'Community pools ad funds for distribution', icon: 'megaphone-outline' },
            ].map((item) => (
              <Card key={item.step} style={{ flex: 1, padding: 12, backgroundColor: '#fff' }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#eef2ff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 8,
                  }}
                >
                  <Ionicons name={item.icon as any} size={14} color="#4f46e5" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>{item.title}</Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 3, lineHeight: 15 }}>
                  {item.desc}
                </Text>
              </Card>
            ))}
          </View>
        </View>

        {/* Featured Campaigns */}
        <View style={{ marginTop: 26 }}>
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

        {/* Closing Soon / Almost Funded */}
        {almostFunded.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: 20, marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="flame" size={18} color="#f59e0b" />
                <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginLeft: 6 }}>
                  Almost at Goal
                </Text>
              </View>
            </View>
            <View style={{ paddingHorizontal: 20 }}>
              {almostFunded.slice(0, 3).map((item) => (
                <CampaignCard key={item.id} campaign={item} onPress={() => goToDetail(item.id)} variant="compact" />
              ))}
            </View>
          </View>
        )}

        {/* All Active Campaigns */}
        <View style={{ marginTop: 24, paddingHorizontal: 20, paddingBottom: 100 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
            All Active Campaigns
          </Text>
          {publicCampaigns.map((item) => (
            <CampaignCard key={item.id} campaign={item} onPress={() => goToDetail(item.id)} />
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
