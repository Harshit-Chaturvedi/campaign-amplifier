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
import { AmplificationNotice } from '../../components/campaign/AmplificationNotice';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { estimateReachPerDollar } from '../../services/reach';
import { CampaignCardSkeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { Button } from '../../components/ui/Button';
import { colors, fonts, tokens } from '../../theme/tokens';

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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Editorial Masthead / Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text
              style={{
                fontSize: 22,
                fontFamily: fonts.serifBold,
                color: colors.ink,
                letterSpacing: -0.3,
              }}
            >
              Campaign Amplifier
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.inkMuted,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
                marginTop: 2,
              }}
            >
              Community-Funded Message Distribution
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => navigation.navigate('ActivityTab')}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={{
              width: 38,
              height: 38,
              borderRadius: tokens.radii.xs,
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications-outline" size={19} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Server Waking Up Banner */}
        {isServerWakingUp && (
          <View
            style={{
              marginTop: 10,
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: tokens.radii.xs,
              paddingVertical: 8,
              paddingHorizontal: 12,
            }}
          >
            <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.ink, flex: 1 }}>
              Connecting to server... (Free-tier cold start may take a moment)
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
              backgroundColor: colors.warningFaint,
              borderColor: colors.warning,
              borderWidth: 1,
              borderRadius: tokens.radii.xs,
              paddingVertical: 6,
              paddingHorizontal: 10,
            }}
          >
            <Ionicons name="cloud-offline-outline" size={15} color={colors.warning} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.warning, flex: 1 }}>
              Offline demo data active — bundled prototype campaigns
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={() => { refetch(); }} tintColor={colors.accent} />
        }
      >
        {/* Core First Screen / Broadside Hero (Requirement 5) */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: tokens.radii.md,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
          }}
        >
          {/* Dateline / Topic Tag */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 10,
            }}
          >
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansBold,
                color: colors.accent,
                letterSpacing: 0.9,
                textTransform: 'uppercase',
              }}
            >
              COMMUNITY-FUNDED REACH
            </Text>
            <DemoDataBadge size="sm" />
          </View>

          {/* One Clear Serif Headline Stating the Idea */}
          <Text
            style={{
              fontSize: 24,
              fontFamily: fonts.serifBold,
              color: colors.ink,
              lineHeight: 30,
              letterSpacing: -0.2,
            }}
          >
            Help Important Messages Travel Beyond Their Network
          </Text>

          {/* One Sentence Explanation */}
          <Text
            style={{
              fontSize: 14,
              fontFamily: fonts.sansRegular,
              color: colors.inkSecondary,
              marginTop: 8,
              lineHeight: 21,
            }}
          >
            Contributions pool to pay for digital advertising that spreads checkable messages to audiences and decision-makers.
          </Text>

          {/* Newspaper Graphic Hero Numbers Box */}
          <View
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: tokens.radii.xs,
              padding: 14,
              marginTop: 14,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 28, fontFamily: fonts.serifBold, color: colors.ink }}>
                ~{reachPerDollar}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fonts.sansBold,
                  color: colors.inkMuted,
                  letterSpacing: 0.8,
                  textTransform: 'uppercase',
                  marginLeft: 8,
                }}
              >
                PEOPLE REACHED PER $1 (ESTIMATE)
              </Text>
            </View>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansRegular,
                color: colors.inkSecondary,
                marginTop: 4,
              }}
            >
              Estimate based on demo assumptions, not a guarantee.
            </Text>
          </View>

          {/* Amplification-Not-Donation Notice */}
          <View style={{ marginTop: 14 }}>
            <AmplificationNotice compact />
          </View>

          {/* One Primary CTA */}
          <View style={{ marginTop: 16 }}>
            <Button
              title="Explore Active Campaigns"
              size="lg"
              variant="primary"
              onPress={() => navigation.navigate('ExploreTab')}
              fullWidth
            />
          </View>
        </View>

        {/* Featured Campaigns Carousel */}
        {featured.length > 0 && (
          <View style={{ marginTop: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                paddingHorizontal: 20,
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 19, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                  Featured Campaigns
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 1 }}>
                  Curated messages ready for community reach
                </Text>
              </View>
              <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.accent }}>See All</Text>
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

        {/* How It Works: Create -> Review -> Amplify (Editorial Cards) */}
        <View style={{ marginTop: 26, paddingHorizontal: 20 }}>
          <View style={{ marginBottom: 12 }}>
            <Text style={{ fontSize: 19, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
              How It Works
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 1 }}>
              A clear sequence from message to public reach
            </Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[
              {
                num: '01',
                title: 'Draft',
                desc: 'Write the message, link checkable sources, and set an audience.',
              },
              {
                num: '02',
                title: 'Review',
                desc: 'Claims and creative are checked before funding opens.',
              },
              {
                num: '03',
                title: 'Amplify',
                desc: 'Backers pool funds to pay for verified digital ads.',
              },
            ].map((card) => (
              <View
                key={card.num}
                style={{
                  flex: 1,
                  backgroundColor: colors.surface,
                  borderRadius: tokens.radii.sm,
                  padding: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 16,
                    fontFamily: fonts.serifBold,
                    color: colors.inkMuted,
                    marginBottom: 4,
                  }}
                >
                  {card.num}
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: fonts.sansSemiBold,
                    color: colors.ink,
                    marginBottom: 4,
                  }}
                >
                  {card.title}
                </Text>
                <Text
                  style={{
                    fontSize: 11,
                    fontFamily: fonts.sansRegular,
                    color: colors.inkSecondary,
                    lineHeight: 15,
                  }}
                >
                  {card.desc}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Active Campaigns Feed */}
        <View style={{ marginTop: 28, paddingHorizontal: 20, paddingBottom: 40 }}>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 14,
            }}
          >
            <View>
              <Text style={{ fontSize: 19, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                Active Campaigns
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 1 }}>
                Community-funded amplification in progress
              </Text>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('ExploreTab')}>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.accent }}>
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

          {/* App Footer */}
          <View
            style={{
              marginTop: 30,
              paddingTop: 24,
              borderTopWidth: 1,
              borderTopColor: colors.border,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontSize: 13, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 4 }}>
              Campaign Amplifier
            </Text>
            <Text
              style={{
                fontSize: 11,
                fontFamily: fonts.sansRegular,
                color: colors.inkSecondary,
                textAlign: 'center',
                marginBottom: 14,
                paddingHorizontal: 20,
              }}
            >
              Civic message distribution infrastructure. Micro-contributions pool to fund digital ads for checkable messages.
            </Text>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                justifyContent: 'center',
                gap: 12,
                marginBottom: 16,
              }}
            >
              {[
                { title: 'About', slug: 'about' },
                { title: 'How It Works', slug: 'how-it-works' },
                { title: 'FAQs', slug: 'faqs' },
                { title: 'Fees & Refunds', slug: 'fees-and-refunds' },
                { title: 'Terms', slug: 'terms' },
                { title: 'Privacy', slug: 'privacy' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.slug}
                  onPress={() => navigation.navigate('InfoPage', { slug: item.slug })}
                  style={{ paddingVertical: 4, paddingHorizontal: 6 }}
                >
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.accent }}>
                    {item.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 10, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
              © 2026 Campaign Amplifier • Demo Environment
            </Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
