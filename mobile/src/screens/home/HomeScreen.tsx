import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Pressable,
  Modal,
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
  const [showNoticeModal, setShowNoticeModal] = useState(false);

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

      {/* Explainer Bottom Sheet Modal */}
      <Modal
        visible={showNoticeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoticeModal(false)}
      >
        <Pressable
          onPress={() => setShowNoticeModal(false)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.45)',
            justifyContent: 'flex-end',
          }}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={{
              backgroundColor: colors.surface,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 17, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                Message Amplification, Not a Donation
              </Text>
              <TouchableOpacity onPress={() => setShowNoticeModal(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="close" size={20} color={colors.inkSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 22 }}>
              Your contribution pays for digital advertising that spreads documented messages to audiences and decision-makers. It is not a donation to the cause, person, or organisation.
            </Text>
            <View style={{ marginTop: 20 }}>
              <Button title="Got it" onPress={() => setShowNoticeModal(false)} fullWidth />
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
                fontFamily: fonts.sansBold,
                color: colors.ink,
                letterSpacing: -0.3,
              }}
            >
              Campaign Amplifier
            </Text>
            <Text
              style={{
                fontSize: 10,
                fontFamily: fonts.sansSemiBold,
                color: colors.inkMuted,
                letterSpacing: 0.8,
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
              borderRadius: 10,
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
              borderRadius: 8,
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
              borderRadius: 8,
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
        {/* Core First Screen / Hero */}
        <View
          style={{
            marginHorizontal: 16,
            marginTop: 16,
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 20,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.04,
            shadowRadius: 2,
            elevation: 1,
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

          {/* Headline Stating the Idea */}
          <Text
            style={{
              fontSize: 22,
              fontFamily: fonts.sansBold,
              color: colors.ink,
              lineHeight: 28,
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
              marginTop: 6,
              lineHeight: 20,
            }}
          >
            Contributions pool to pay for digital advertising that spreads documented messages to audiences and decision-makers.
          </Text>

          {/* Reach Estimate Pill */}
          <View
            style={{
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 14,
              marginTop: 12,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
              <Text style={{ fontSize: 22, fontFamily: fonts.sansBold, color: colors.ink }}>
                ~{reachPerDollar}
              </Text>
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fonts.sansBold,
                  color: colors.inkMuted,
                  letterSpacing: 0.6,
                  textTransform: 'uppercase',
                  marginLeft: 8,
                }}
              >
                PEOPLE PER $1 (ESTIMATE)
              </Text>
            </View>
          </View>

          {/* Collapsed 1-line explainer with info icon */}
          <TouchableOpacity
            onPress={() => setShowNoticeModal(true)}
            activeOpacity={0.7}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 10,
              paddingVertical: 10,
              paddingHorizontal: 12,
              marginTop: 10,
            }}
          >
            <Ionicons
              name="information-circle-outline"
              size={17}
              color={colors.accent}
              style={{ marginRight: 8 }}
            />
            <Text
              style={{
                fontSize: 12,
                fontFamily: fonts.sansMedium,
                color: colors.ink,
                flex: 1,
              }}
              numberOfLines={1}
            >
              Message amplification, not a donation
            </Text>
            <Ionicons name="chevron-forward" size={15} color={colors.inkMuted} />
          </TouchableOpacity>

          {/* One Primary CTA */}
          <View style={{ marginTop: 14 }}>
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
                desc: 'Write the message, link public sources, and set an audience.',
              },
              {
                num: '02',
                title: 'Review',
                desc: 'Claims and sources undergo editorial review before funding.',
              },
              {
                num: '03',
                title: 'Amplify',
                desc: 'Backers pool funds to pay for targeted digital ads.',
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
              Civic message distribution infrastructure. Micro-contributions pool to fund digital ads for community-backed messages.
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
