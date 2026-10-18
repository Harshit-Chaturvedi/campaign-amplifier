import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaigns, useFeaturedCampaigns } from '../../api/hooks';
import { useServerStatusStore } from '../../api/client';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { estimateReachPerDollar } from '../../services/reach';
import { CampaignCardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';

export function HomeScreen({ navigation }: any) {
  const {
    data: campaignsData,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useCampaigns();
  const { data: featuredData } = useFeaturedCampaigns();
  const isServerWakingUp = useServerStatusStore((s) => s.isWakingUp);

  const isOffline = Boolean(campaignsData?.isOffline);
  const campaigns = campaignsData?.items || [];
  const featured = featuredData?.items || [];
  const reachPerDollar = estimateReachPerDollar();

  const goToDetail = (id: string) =>
    navigation.navigate('CampaignDetail', { campaignId: id });
  const goToBack = (id: string) =>
    navigation.navigate('FundCampaign', { campaignId: id });

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
              Campaign Amplifier
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              Community-funded advertising for important messages
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('ActivityTab')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
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

        {/* Server Waking Up Banner */}
        {isServerWakingUp && (
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#eef2ff',
              borderColor: '#c7d2fe',
              borderWidth: 1,
              borderRadius: 10,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <ActivityIndicator size="small" color="#4f46e5" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, color: '#3730a3', fontWeight: '600', flex: 1 }}>
              Waking up the server... (Free-tier cold start may take up to 50s)
            </Text>
          </View>
        )}

        {/* Offline Demo Data Banner */}
        {isOffline && !isServerWakingUp && (
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#fffbeb',
              borderColor: '#fef3c7',
              borderWidth: 1,
              borderRadius: 10,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
          >
            <Ionicons name="cloud-offline-outline" size={15} color="#b45309" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#92400e', fontWeight: '500', flex: 1 }}>
              Offline demo data active — bundled prototype campaigns
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor="#4f46e5" />
        }
      >
        {/* Core Hero Section */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: '#1e1b4b',
            borderRadius: 22,
            padding: 22,
            shadowColor: '#1e1b4b',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 5,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.15)',
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#c7d2fe', letterSpacing: 0.3 }}>
                COMMUNITY-FUNDED REACH
              </Text>
            </View>
            <DemoDataBadge size="sm" />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#ffffff', lineHeight: 28 }}>
            Help important messages travel beyond their networks
          </Text>
          <Text style={{ fontSize: 13, color: '#c7d2fe', marginTop: 8, lineHeight: 19 }}>
            Contributions pool to pay for digital advertising that spreads the message to audiences beyond the creator's network. It is not a donation to causes.
          </Text>

          {/* Illustrative Reach per Dollar */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.08)',
              borderRadius: 12,
              padding: 12,
              marginTop: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="flash-outline" size={16} color="#818cf8" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#e0e7ff', flex: 1 }}>
                Estimated reach: about {reachPerDollar} people per $1
              </Text>
            </View>
            <Text style={{ fontSize: 11, color: '#a5b4fc', marginTop: 4 }}>
              Estimate based on demo assumptions, not a guarantee.
            </Text>
          </View>

          {/* Dual CTAs */}
          <View style={{ flexDirection: 'row', marginTop: 18, gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Explore Campaigns"
                size="md"
                variant="primary"
                icon="compass-outline"
                onPress={() => navigation.navigate('ExploreTab')}
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
              <TouchableOpacity
                onPress={() => navigation.navigate('CreateTab')}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.14)',
                  borderWidth: 1,
                  borderColor: 'rgba(255,255,255,0.25)',
                  paddingVertical: 12,
                  paddingHorizontal: 14,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'row',
                }}
              >
                <Ionicons name="add-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#fff' }}>
                  Start a Campaign
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Featured Campaigns Carousel */}
        {featured.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                  Featured Campaigns
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                  Curated messages ready for community reach
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#4f46e5' }}>See All</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={featured}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ paddingHorizontal: 20 }}
              renderItem={({ item }) => (
                <CampaignCard
                  campaign={item}
                  variant="featured"
                  onPress={() => goToDetail(item.id)}
                  onBackPress={() => goToBack(item.id)}
                />
              )}
            />
          </View>
        )}

        {/* How It Works: Create -> Review -> Amplify */}
        <View style={{ marginTop: 26, paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
              How It Works
            </Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
              A clear sequence from message to reach
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              {
                step: '1',
                title: 'Create',
                desc: 'Write the message, link sources, and define the audience.',
                icon: 'create-outline',
                color: '#4f46e5',
                bg: '#eef2ff',
              },
              {
                step: '2',
                title: 'Review',
                desc: 'Our team reviews content and creative before funding.',
                icon: 'shield-checkmark-outline',
                color: '#0284c7',
                bg: '#e0f2fe',
              },
              {
                step: '3',
                title: 'Amplify',
                desc: 'Backers pool funds to pay for ad distribution.',
                icon: 'megaphone-outline',
                color: '#16a34a',
                bg: '#dcfce7',
              },
            ].map((card) => (
              <View
                key={card.step}
                style={{
                  flex: 1,
                  backgroundColor: '#fff',
                  borderRadius: 16,
                  padding: 14,
                  borderWidth: 1,
                  borderColor: '#f1f5f9',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.03,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    backgroundColor: card.bg,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}
                >
                  <Ionicons name={card.icon as any} size={20} color={card.color} />
                </View>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 4 }}>
                  {card.title}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', lineHeight: 15 }}>
                  {card.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Campaign Feed */}
        <View style={{ marginTop: 28, paddingHorizontal: 20, paddingBottom: 40 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 14,
            }}
          >
            <View>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                Active Campaigns
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 1 }}>
                Community-funded amplification in progress
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#4f46e5' }}>
                Filter & Search
              </Text>
            </TouchableOpacity>
          </View>

          {/* Loading Skeletons */}
          {isLoading && !isRefetching && (
            <View>
              <CampaignCardSkeleton />
              <CampaignCardSkeleton />
            </View>
          )}

          {/* Error State */}
          {isError && (
            <ErrorState
              title="Failed to load campaigns"
              message="Could not reach the server. Tap below to retry or view offline campaigns."
              onRetry={refetch}
            />
          )}

          {/* Campaign List */}
          {!isLoading &&
            campaigns.map((c) => (
              <CampaignCard
                key={c.id}
                campaign={c}
                variant="default"
                onPress={() => goToDetail(c.id)}
                onBackPress={() => goToBack(c.id)}
              />
            ))}
        </View>
      </ScrollView>
    </View>
  );
}
