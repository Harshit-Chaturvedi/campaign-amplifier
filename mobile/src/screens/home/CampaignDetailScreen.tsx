import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Linking,
  Image,
  Share,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useCampaign, useSubmitFeedback } from '../../api/hooks';
import { useServerStatusStore } from '../../api/client';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { Expandable } from '../../components/ui/Expandable';
import { SourceItem } from '../../components/ui/SourceItem';
import { CampaignDetailSkeleton } from '../../components/ui/Skeleton';
import { GeneratedCover } from '../../components/ui/GeneratedCover';
import { getCoverUrl } from '../../utils/media';
import { ErrorState } from '../../components/ui/ErrorState';
import { StoryBlockRenderer } from '../../components/story/StoryBlockRenderer';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatting';
import { estimateReach } from '../../services/reach';
import { useAuthStore } from '../../store/useAuthStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { colors, fonts, tokens, getCategoryColor } from '../../theme/tokens';
import type { StoryBlock } from '../../types/campaign';

const catLabels: Record<string, string> = {
  environment: 'Environment',
  health: 'Health',
  science: 'Science',
  education: 'Education',
  public_policy: 'Public Policy',
  economic_policy: 'Economic Policy',
  community: 'Community',
  arts_culture: 'Arts & Culture',
  business: 'Business',
  other: 'Other',
};

export function CampaignDetailScreen({ route, navigation }: any) {
  const { campaignId } = route.params;
  const insets = useSafeAreaInsets();
  const { data, isLoading, isError, refetch } = useCampaign(campaignId);
  const campaign = data?.campaign;
  const isOffline = Boolean(data?.isOffline);
  const isServerWakingUp = useServerStatusStore((s) => s.isWakingUp);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const savedCampaignIds = usePreferencesStore((s) => s.savedCampaignIds);
  const followedCampaignIds = usePreferencesStore((s) => s.followedCampaignIds);
  const isSaved = useMemo(
    () => savedCampaignIds.includes(campaignId),
    [savedCampaignIds, campaignId]
  );
  const isFollowed = useMemo(
    () => followedCampaignIds.includes(campaignId),
    [followedCampaignIds, campaignId]
  );
  const toggleSave = usePreferencesStore((s) => s.toggleSaveCampaign);
  const toggleFollow = usePreferencesStore((s) => s.toggleFollowCampaign);

  const submitFeedbackMutation = useSubmitFeedback(campaignId);
  const [visualsFeedback, setVisualsFeedback] = useState<string | null>(null);
  const [mindFeedback, setMindFeedback] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [coverError, setCoverError] = useState(false);

  const handleShare = async () => {
    if (!campaign) return;
    try {
      await Share.share({
        title: campaign.title,
        message: `${campaign.title}\n\nHelp amplify this message: https://campaigns.app/c/${campaign.slug || campaign.id}`,
      });
    } catch {}
  };

  const handleToggleSave = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Please sign in to save campaigns to your personal profile.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) },
        ]
      );
      return;
    }
    toggleSave(campaignId);
  };

  const handleToggleFollow = () => {
    toggleFollow(campaignId);
  };

  const handleFeedbackVote = (type: 'visuals' | 'mind', val: string) => {
    let nextVisuals = visualsFeedback;
    let nextMind = mindFeedback;
    if (type === 'visuals') {
      setVisualsFeedback(val);
      nextVisuals = val;
    } else {
      setMindFeedback(val);
      nextMind = val;
    }
    if (nextVisuals && nextMind) {
      submitFeedbackMutation.mutate({
        visualsKeptReading: nextVisuals,
        changedMind: nextMind,
      });
      setFeedbackSubmitted(true);
    }
  };

  if (isLoading) {
    return <CampaignDetailSkeleton />;
  }

  if (isError || !campaign) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ErrorState
          title="Campaign not found"
          message="Could not load campaign details. Check your network or go back to Explore."
          onRetry={refetch}
        />
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.accent }}>Back to Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const catColor = getCategoryColor(campaign.category);
  const pct = campaign.percentFunded ?? 0;
  const displayCategory = catLabels[campaign.category] || campaign.category;
  const coverUrl = getCoverUrl(campaign);
  const isGoalReached = (campaign.fundingGoal > 0) && (campaign.amountRaised >= campaign.fundingGoal);
  const effectiveStatus = (isGoalReached && (campaign.status === 'available_for_funding' || campaign.status === 'approved'))
    ? 'goal_reached'
    : campaign.status;
  const isBackable = effectiveStatus === 'available_for_funding';
  const reachAtGoal = campaign.estimatedReachAtGoal || estimateReach(campaign.fundingGoal).estimate;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Navbar */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 36,
            height: 36,
            borderRadius: tokens.radii.xs,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={19} color={colors.ink} />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isSaved ? 'Remove from saved campaigns' : 'Save campaign'}
            onPress={handleToggleSave}
            style={{
              width: 36,
              height: 36,
              borderRadius: tokens.radii.xs,
              backgroundColor: isSaved ? colors.accentFaint : colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: isSaved ? colors.accent : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={18}
              color={isSaved ? colors.accent : colors.inkSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={isFollowed ? 'Unfollow campaign' : 'Follow campaign'}
            onPress={handleToggleFollow}
            style={{
              width: 36,
              height: 36,
              borderRadius: tokens.radii.xs,
              backgroundColor: isFollowed ? colors.positiveFaint : colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: isFollowed ? colors.positive : colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={isFollowed ? 'heart' : 'heart-outline'}
              size={18}
              color={isFollowed ? colors.positive : colors.inkSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Share campaign"
            onPress={handleShare}
            style={{
              width: 36,
              height: 36,
              borderRadius: tokens.radii.xs,
              backgroundColor: colors.surfaceSecondary,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="share-social-outline" size={18} color={colors.inkSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content (with 150 bottom padding so sticky bar never covers story) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Cover creative image: 16:9 Real Photo - No Gradient Overlay */}
        <View style={{ width: '100%', aspectRatio: 16 / 9, backgroundColor: colors.surfaceSecondary, overflow: 'hidden' }}>
          {coverUrl && !coverError ? (
            <Image
              source={{ uri: coverUrl }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
              onError={() => setCoverError(true)}
            />
          ) : (
            <GeneratedCover
              category={campaign.category}
              title={campaign.title}
              height={220}
            />
          )}

          {isServerWakingUp ? (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: tokens.radii.xs,
                paddingHorizontal: 8,
                paddingVertical: 3,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="small" color={colors.accent} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.ink }}>
                Waking server...
              </Text>
            </View>
          ) : isOffline ? (
            <View
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                backgroundColor: colors.warningFaint,
                borderWidth: 1,
                borderColor: colors.warning,
                borderRadius: tokens.radii.xs,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.warning }}>
                Offline demo data
              </Text>
            </View>
          ) : null}
        </View>

        {/* Campaign Header Info */}
        <View style={{ padding: 20, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: tokens.radii.xs,
                paddingHorizontal: 8,
                paddingVertical: 3,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: catColor, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                {displayCategory}
              </Text>
            </View>
            <StatusBadge status={effectiveStatus} amountRaised={campaign.amountRaised} fundingGoal={campaign.fundingGoal} size="md" />
          </View>

          <Text style={{ fontSize: 24, fontFamily: fonts.serifBold, color: colors.ink, lineHeight: 30, letterSpacing: -0.2 }}>
            {campaign.title}
          </Text>

          {campaign.tagline && (
            <Text
              style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 6, lineHeight: 21 }}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {campaign.tagline}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
              by {campaign.creatorName}
            </Text>
            <Text style={{ fontSize: 12, color: colors.inkMuted, marginHorizontal: 6 }}>•</Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
              {formatDate(campaign.publishedAt || campaign.createdAt)}
            </Text>
            <Text style={{ fontSize: 12, color: colors.inkMuted, marginHorizontal: 6 }}>•</Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
              {campaign.durationDays}d campaign
            </Text>
          </View>
        </View>

        {/* Progress summary card with Newspaper Hero Numbers (Requirement 4) */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Card style={{ padding: 16 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                marginBottom: 12,
              }}
            >
              <View>
                <Text style={{ fontSize: 24, fontFamily: fonts.serifBold, color: colors.ink }}>
                  {formatCurrency(campaign.amountRaised)}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.inkMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>
                  RAISED
                </Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 24, fontFamily: fonts.serifBold, color: colors.accent }}>
                  {pct}%
                </Text>
                <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.inkMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>
                  FUNDED
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 24, fontFamily: fonts.serifBold, color: colors.ink }}>
                  {formatCurrency(campaign.fundingGoal)}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.inkMuted, letterSpacing: 0.8, textTransform: 'uppercase', marginTop: 2 }}>
                  GOAL
                </Text>
              </View>
            </View>

            <ProgressBar progress={pct} color={colors.accent} height={3} style={{ marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 15, fontFamily: fonts.serifBold, color: colors.ink }}>
                  {campaign.backerCount}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.inkMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  BACKERS
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.serifBold, color: colors.ink }}>
                  ~{formatNumber(reachAtGoal)}
                </Text>
                <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.inkMuted, letterSpacing: 0.8, textTransform: 'uppercase' }}>
                  EST. REACH @ GOAL (ESTIMATE)
                </Text>
              </View>
            </View>
          </Card>

          {/* Delivery & Analytics Report Link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('Report', { campaignId: campaign.id })}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: tokens.radii.sm,
              padding: 14,
              marginTop: 10,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: tokens.radii.xs,
                  backgroundColor: colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="stats-chart" size={17} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                  {['distribution_preparation', 'promoting', 'completed', 'goal_reached'].includes(effectiveStatus)
                    ? 'Distribution Report'
                    : 'Delivery & Analytics Report'}
                </Text>
                <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                  {['distribution_preparation', 'promoting', 'completed', 'goal_reached'].includes(effectiveStatus)
                    ? 'Measured reach and itemised ad spend'
                    : 'Budget breakdown and reach projections'}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={17} color={colors.inkMuted} />
          </TouchableOpacity>
        </View>

        {/* Accordions: Story, Evidence sources, Use of funds & fees, Reach estimate, Report */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {/* 1. Story Accordion */}
          <Expandable
            title="Story"
            icon="book-outline"
            defaultExpanded={true}
          >
            {campaign.storyBlocks && campaign.storyBlocks.length > 0 ? (
              campaign.storyBlocks.map((b, idx) => (
                <StoryBlockRenderer key={idx} block={b} index={idx} />
              ))
            ) : (
              <Text style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.ink, lineHeight: 22 }}>
                {campaign.summary}
              </Text>
            )}
          </Expandable>

          {/* 2. Evidence Sources Accordion */}
          <Expandable
            title="Evidence Sources"
            icon="link-outline"
            badgeText={`${campaign.sources?.length || 0} sources`}
            defaultExpanded={true}
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 12 }}>
              Traceable evidence supporting this campaign. All sources are listed so you can review them directly.
            </Text>

            {campaign.sources && campaign.sources.length > 0 ? (
              campaign.sources.map((src, idx) => (
                <SourceItem key={src.id || idx} source={src} index={idx} />
              ))
            ) : (
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkMuted, fontStyle: 'italic' }}>
                No external links provided for this campaign.
              </Text>
            )}
          </Expandable>

          {/* 3. Use of Funds & Fees Accordion */}
          <Expandable
            title="Use of Funds & Fees"
            icon="pie-chart-outline"
            badgeText="95% to Ads"
          >
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink, lineHeight: 20, marginBottom: 8 }}>
              Your contribution pays for advertising that spreads this message. It is not a donation to the cause, person or organisation.
            </Text>

            <View style={{ backgroundColor: colors.surfaceSecondary, padding: 12, borderRadius: tokens.radii.xs, borderWidth: 1, borderColor: colors.border, marginVertical: 8 }}>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19 }}>
                • <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>95% Direct Advertising Spend:</Text> Fully allocated to paid placement campaigns on Meta, Instagram, Reddit, and selected channels.{'\n'}
                • <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>5% Platform Fee:</Text> Covers advertising setup, moderation infrastructure, and campaign reporting.{'\n'}
                • <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>Refund Policy:</Text> In the event an unpromoted campaign is cancelled or fails compliance, contributions are refunded in full.
              </Text>
            </View>

            <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted, fontStyle: 'italic', marginTop: 4 }}>
              Unspent funds are never withdrawn as creator profit; they remain in the campaign pool or trigger proportional refunds.
            </Text>
          </Expandable>

          {/* 4. Reach Estimate & Audience Accordion */}
          <Expandable
            title="Reach Estimate & Audience"
            icon="people-outline"
            badgeText="Estimate"
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19, marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>Estimated Reach at Goal:</Text> ~{formatNumber(reachAtGoal)} people (Estimate)
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19, marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>Target Locations:</Text>{' '}
              {campaign.reachSettings?.locations.join(', ') || 'United States'}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19, marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>Interest Segments:</Text>{' '}
              {campaign.reachSettings?.interests.join(', ') || 'Local Community, Public Policy'}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19, marginBottom: 8 }}>
              <Text style={{ fontFamily: fonts.sansBold, color: colors.ink }}>Distribution Channels:</Text>{' '}
              {campaign.reachSettings?.channels.join(', ') || 'Meta, Instagram, Reddit'}
            </Text>

            <View style={{ backgroundColor: colors.surfaceSecondary, padding: 10, borderRadius: tokens.radii.xs, borderWidth: 1, borderColor: colors.border, marginTop: 6 }}>
              <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted, lineHeight: 16 }}>
                Privacy notice: Ad targeting strictly adheres to digital advertising regulations. Backer names and emails are never shared with ad networks or third parties.
              </Text>
            </View>
          </Expandable>

          {/* 5. Distribution Report Accordion */}
          <Expandable
            title={['distribution_preparation', 'promoting', 'completed', 'goal_reached'].includes(effectiveStatus) ? 'Distribution Report' : 'Delivery & Analytics Report'}
            icon="stats-chart"
            badgeText="Report"
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19, marginBottom: 10 }}>
              {['distribution_preparation', 'promoting', 'completed', 'goal_reached'].includes(effectiveStatus)
                ? 'View measured reach, itemised ad spend, and placement performance.'
                : 'View budget breakdown and reach projections for this campaign.'}
            </Text>
            <Button
              title="Open Full Distribution Report"
              variant="outline"
              size="sm"
              onPress={() => navigation.navigate('Report', { campaignId: campaign.id })}
              fullWidth
            />
          </Expandable>

          {/* 6. Review & Trust */}
          <Expandable
            title="Review Process & Trust"
            icon="shield-checkmark-outline"
          >
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 19 }}>
              Submitted campaigns are reviewed by our team for content, sources, creative and targeting before they can be funded. We list sources so you can read them yourself. We do not score causes or claim independent evaluation of claims.
            </Text>
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
                Distribution partners: Meta Advertising API, Reddit Ads Platform, and registered civic outreach networks.
              </Text>
            </View>
          </Expandable>

          {/* 4. Feedback Widget */}
          <Expandable
            title="Reader Feedback"
            icon="chatbubbles-outline"
            badgeText={feedbackSubmitted ? 'Voted ✓' : 'Feedback'}
            defaultExpanded={false}
          >
            {feedbackSubmitted ? (
              <View style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.positive, marginTop: 6 }}>
                  Thank you for your feedback
                </Text>
                <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                  Your responses help evaluate message clarity.
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 6 }}>
                {/* Question 1 */}
                <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 8 }}>
                  Did the visuals encourage you to keep reading?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
                  {['No', 'Somewhat', 'Yes'].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => handleFeedbackVote('visuals', val)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: tokens.radii.xs,
                        backgroundColor: visualsFeedback === val ? colors.accent : colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: visualsFeedback === val ? colors.accent : colors.border,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: visualsFeedback === val ? fonts.sansSemiBold : fonts.sansMedium,
                          color: visualsFeedback === val ? colors.inkInverse : colors.ink,
                        }}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Question 2 */}
                <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 8 }}>
                  Did this campaign change your perspective on this issue?
                </Text>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {['No', 'Somewhat', 'Yes'].map((val) => (
                    <TouchableOpacity
                      key={val}
                      onPress={() => handleFeedbackVote('mind', val)}
                      style={{
                        flex: 1,
                        paddingVertical: 8,
                        borderRadius: tokens.radii.xs,
                        backgroundColor: mindFeedback === val ? colors.accent : colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: mindFeedback === val ? colors.accent : colors.border,
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontFamily: mindFeedback === val ? fonts.sansSemiBold : fonts.sansMedium,
                          color: mindFeedback === val ? colors.inkInverse : colors.ink,
                        }}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Expandable>
        </View>
      </ScrollView>

      {/* Sticky Bottom Funding Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingTop: 10,
          paddingBottom: Math.max(insets?.bottom ?? 0, 14),
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
            <Text style={{ fontSize: 16, fontFamily: fonts.serifBold, color: colors.ink }} numberOfLines={1}>
              {formatCurrency(campaign.amountRaised)}{' '}
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                of {formatCurrency(campaign.fundingGoal)}
              </Text>
            </Text>
            <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted, marginTop: 1 }} numberOfLines={1}>
              {pct}% funded • Est. reach: ~{formatNumber(reachAtGoal)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <TouchableOpacity
              onPress={handleShare}
              accessibilityRole="button"
              accessibilityLabel="Share campaign"
              style={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: tokens.radii.xs,
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="share-outline" size={19} color={colors.ink} />
            </TouchableOpacity>

            {isBackable ? (
              <Button
                title="Back this campaign"
                size="md"
                onPress={() => navigation.navigate('FundCampaign', { campaignId: campaign.id })}
                style={{ flexShrink: 0, paddingHorizontal: 16 }}
              />
            ) : (
              <Button
                title="View Report"
                size="md"
                variant="outline"
                onPress={() => navigation.navigate('Report', { campaignId: campaign.id })}
                style={{ flexShrink: 0, paddingHorizontal: 16 }}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
