import React, { useState } from 'react';
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
import { Skeleton } from '../../components/ui/Skeleton';
import { GeneratedCover } from '../../components/ui/GeneratedCover';
import { ErrorState } from '../../components/ui/ErrorState';
import { StoryBlockRenderer } from '../../components/story/StoryBlockRenderer';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';
import { estimateReach } from '../../services/reach';
import { useAuthStore } from '../../store/useAuthStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
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
  const { data, isLoading, isError, refetch } = useCampaign(campaignId);
  const campaign = data?.campaign;
  const isOffline = Boolean(data?.isOffline);
  const isServerWakingUp = useServerStatusStore((s) => s.isWakingUp);

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isSaved = usePreferencesStore((s) => s.isSaved(campaignId));
  const isFollowed = usePreferencesStore((s) => s.isFollowed(campaignId));
  const toggleSave = usePreferencesStore((s) => s.toggleSaveCampaign);
  const toggleFollow = usePreferencesStore((s) => s.toggleFollowCampaign);

  const submitFeedbackMutation = useSubmitFeedback(campaignId);
  const [visualsFeedback, setVisualsFeedback] = useState<string | null>(null);
  const [mindFeedback, setMindFeedback] = useState<string | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [coverError, setCoverError] = useState(false);
  const [adError, setAdError] = useState(false);

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
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Please sign in to follow campaigns and receive milestone updates.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Auth', { screen: 'Login' }) },
        ]
      );
      return;
    }
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
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', paddingTop: 52, paddingHorizontal: 20 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 20 }}>
          <Skeleton width={40} height={40} borderRadius={20} />
          <Skeleton width={120} height={20} style={{ marginLeft: 16 }} />
        </View>
        <Skeleton height={200} borderRadius={18} style={{ marginBottom: 18 }} />
        <Skeleton height={26} width="85%" style={{ marginBottom: 10 }} />
        <Skeleton height={16} width="60%" style={{ marginBottom: 20 }} />
        <Skeleton height={100} borderRadius={16} style={{ marginBottom: 16 }} />
        <Skeleton height={140} borderRadius={16} />
      </View>
    );
  }

  if (isError || !campaign) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', justifyContent: 'center' }}>
        <ErrorState
          title="Campaign not found"
          message="Could not load campaign details. Check your network or go back to Explore."
          onRetry={refetch}
        />
        <View style={{ alignItems: 'center', marginTop: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ padding: 12 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#4f46e5' }}>Back to Explore</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const catColor = getCategoryColor(campaign.category);
  const pct = campaign.percentFunded ?? 0;
  const barColor = pct >= 100 ? '#22c55e' : '#4f46e5';
  const displayCategory = catLabels[campaign.category] || campaign.category;
  const coverUrl = campaign.adAssets?.coverUrl;
  const currentReachEstimate = estimateReach(campaign.amountRaised).estimate;
  const isBackable = campaign.status === 'available_for_funding';

  const renderStoryBlock = (block: StoryBlock, index: number) => {
    switch (block.type) {
      case 'heading': {
        const fontSize = block.level === 1 ? 22 : block.level === 2 ? 18 : 16;
        return (
          <Text
            key={index}
            style={{
              fontSize,
              fontWeight: '800',
              color: '#0f172a',
              marginTop: index === 0 ? 0 : 22,
              marginBottom: 8,
              lineHeight: fontSize + 6,
            }}
          >
            {block.text}
          </Text>
        );
      }
      case 'paragraph':
        return (
          <Text
            key={index}
            style={{
              fontSize: 15,
              color: '#334155',
              lineHeight: 24,
              marginBottom: 14,
            }}
          >
            {block.text}
          </Text>
        );
      case 'image':
        return (
          <View
            key={index}
            style={{
              marginVertical: 14,
              borderRadius: 16,
              overflow: 'hidden',
              backgroundColor: '#f1f5f9',
              borderWidth: 1,
              borderColor: '#e2e8f0',
            }}
          >
            <Image
              source={{ uri: block.url }}
              style={{ width: '100%', height: 210 }}
              resizeMode="cover"
            />
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
            style={{
              marginVertical: 14,
              backgroundColor: '#eef2ff',
              borderRadius: 16,
              padding: 16,
              borderLeftWidth: 4,
              borderLeftColor: '#4f46e5',
            }}
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
            style={{
              marginVertical: 14,
              backgroundColor: '#f8fafc',
              borderRadius: 16,
              padding: 18,
              borderLeftWidth: 4,
              borderLeftColor: '#0284c7',
            }}
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
            style={{
              marginVertical: 14,
              backgroundColor: '#f0fdf4',
              borderRadius: 16,
              padding: 16,
              borderWidth: 1,
              borderColor: '#bbf7d0',
            }}
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
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Navbar */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <TouchableOpacity
            onPress={handleToggleSave}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: isSaved ? '#eef2ff' : '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={19}
              color={isSaved ? '#4f46e5' : '#64748b'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleToggleFollow}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: isFollowed ? '#f0fdf4' : '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons
              name={isFollowed ? 'heart' : 'heart-outline'}
              size={19}
              color={isFollowed ? '#16a34a' : '#64748b'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleShare}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="share-social-outline" size={19} color="#64748b" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Content (with 150 bottom padding so sticky bar never covers story) */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 160 }}
      >
        {/* Cover creative image */}
        <View style={{ height: 220, backgroundColor: catColor + '15', overflow: 'hidden' }}>
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
                top: 14,
                right: 14,
                backgroundColor: 'rgba(238, 242, 255, 0.95)',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
                flexDirection: 'row',
                alignItems: 'center',
              }}
            >
              <ActivityIndicator size="small" color="#4f46e5" style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#3730a3' }}>
                Waking server...
              </Text>
            </View>
          ) : isOffline ? (
            <View
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                backgroundColor: 'rgba(254, 243, 199, 0.95)',
                borderRadius: 8,
                paddingHorizontal: 8,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309' }}>
                Offline demo data
              </Text>
            </View>
          ) : null}
        </View>

        {/* Campaign Header Info */}
        <View style={{ padding: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <View
              style={{
                backgroundColor: catColor + '18',
                borderRadius: 16,
                paddingHorizontal: 10,
                paddingVertical: 4,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: catColor }}>
                {displayCategory}
              </Text>
            </View>
            <StatusBadge status={campaign.status} size="md" />
          </View>

          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', lineHeight: 28 }}>
            {campaign.title}
          </Text>

          {campaign.tagline && (
            <Text style={{ fontSize: 15, fontWeight: '500', color: '#475569', marginTop: 6, lineHeight: 22 }}>
              {campaign.tagline}
            </Text>
          )}

          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 12, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>
              {campaign.creatorName}
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginHorizontal: 6 }}>•</Text>
            <Text style={{ fontSize: 13, color: '#64748b' }}>
              {formatDate(campaign.publishedAt || campaign.createdAt)}
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginHorizontal: 6 }}>•</Text>
            <Text style={{ fontSize: 13, color: '#64748b' }}>
              {campaign.durationDays}d campaign
            </Text>
          </View>
        </View>

        {/* Progress summary card */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Card style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
                {formatCurrency(campaign.amountRaised)}
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b' }}>
                raised of {formatCurrency(campaign.fundingGoal)} goal
              </Text>
            </View>

            <ProgressBar progress={pct} color={barColor} height={8} style={{ marginBottom: 12 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{pct}%</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>Funded</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{campaign.backerCount}</Text>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>Backers</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#4f46e5' }}>
                  {formatNumber(campaign.estimatedReachAtGoal)}
                </Text>
                <Text style={{ fontSize: 11, color: '#94a3b8' }}>Est. Reach @ Goal</Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Editorial Story Section */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Card style={{ padding: 20 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 14 }}>
              The Story
            </Text>

            {campaign.storyBlocks && campaign.storyBlocks.length > 0 ? (
              campaign.storyBlocks.map((b, idx) => (
                <StoryBlockRenderer key={idx} block={b} index={idx} />
              ))
            ) : (
              <Text style={{ fontSize: 15, color: '#334155', lineHeight: 24 }}>
                {campaign.summary}
              </Text>
            )}
          </Card>
        </View>

        {/* VISIBLE Sources List */}
        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Card style={{ padding: 18 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="link-outline" size={20} color="#4f46e5" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a' }}>
                Sources & Citations
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              Traceable evidence supporting this campaign. All sources are listed so you can review them directly.
            </Text>

            {campaign.sources && campaign.sources.length > 0 ? (
              campaign.sources.map((src, idx) => (
                <SourceItem key={src.id || idx} source={src} index={idx} />
              ))
            ) : (
              <Text style={{ fontSize: 13, color: '#94a3b8', fontStyle: 'italic' }}>
                No external links provided for this campaign.
              </Text>
            )}
          </Card>
        </View>

        {/* Expandable Sections */}
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          {/* 1. Use of Funds */}
          <Expandable
            title="Use of Funds & Fees"
            icon="pie-chart-outline"
            badgeText="95% to Ads"
          >
            <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22, fontWeight: '700', marginBottom: 8 }}>
              Your contribution pays for advertising that spreads this message. It is not a donation to the cause, person or organisation.
            </Text>

            <View style={{ backgroundColor: '#f8fafc', padding: 12, borderRadius: 10, marginVertical: 8 }}>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                • <Text style={{ fontWeight: '700' }}>95% Direct Advertising Spend:</Text> Fully allocated to paid placement campaigns on Meta, Instagram, Reddit, and selected channels.{'\n'}
                • <Text style={{ fontWeight: '700' }}>5% Platform Fee:</Text> Covers advertising setup, moderation infrastructure, and campaign reporting.{'\n'}
                • <Text style={{ fontWeight: '700' }}>Refund Policy:</Text> In the event an unpromoted campaign is cancelled or fails compliance, contributions are refunded in full.
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', marginTop: 4 }}>
              Unspent funds are never withdrawn as creator profit; they remain in the campaign pool or trigger proportional refunds.
            </Text>
          </Expandable>

          {/* 2. Audience & Distribution */}
          <Expandable
            title="Audience & Distribution"
            icon="people-outline"
          >
            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 8 }}>
              <Text style={{ fontWeight: '700' }}>Target Locations:</Text>{' '}
              {campaign.reachSettings?.locations.join(', ') || 'United States'}
            </Text>
            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 8 }}>
              <Text style={{ fontWeight: '700' }}>Interest Segments:</Text>{' '}
              {campaign.reachSettings?.interests.join(', ') || 'Local Community, Public Policy'}
            </Text>
            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20, marginBottom: 8 }}>
              <Text style={{ fontWeight: '700' }}>Distribution Channels:</Text>{' '}
              {campaign.reachSettings?.channels.join(', ') || 'Meta, Instagram, Reddit'}
            </Text>

            <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 10, marginTop: 6 }}>
              <Text style={{ fontSize: 12, color: '#64748b', lineHeight: 18 }}>
                Privacy notice: Ad targeting strictly adheres to digital advertising regulations. Backer names and emails are never shared with ad networks or third parties.
              </Text>
            </View>
          </Expandable>

          {/* 3. Review & Trust */}
          <Expandable
            title="Review Process & Trust"
            icon="shield-checkmark-outline"
          >
            <Text style={{ fontSize: 13, color: '#475569', lineHeight: 21 }}>
              Submitted campaigns are reviewed by our team for content, sources, creative and targeting before they can be funded. We list sources so you can read them yourself. We do not score causes or claim independent evaluation of claims.
            </Text>
            <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>
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
                <Ionicons name="checkmark-circle" size={28} color="#22c55e" />
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#166534', marginTop: 6 }}>
                  Thank you for your feedback!
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                  Your responses help evaluate message clarity.
                </Text>
              </View>
            ) : (
              <View style={{ paddingVertical: 6 }}>
                {/* Question 1 */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
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
                        borderRadius: 10,
                        backgroundColor: visualsFeedback === val ? '#4f46e5' : '#f1f5f9',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: visualsFeedback === val ? '700' : '500',
                          color: visualsFeedback === val ? '#fff' : '#334155',
                        }}
                      >
                        {val}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Question 2 */}
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
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
                        borderRadius: 10,
                        backgroundColor: mindFeedback === val ? '#4f46e5' : '#f1f5f9',
                        alignItems: 'center',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 13,
                          fontWeight: mindFeedback === val ? '700' : '500',
                          color: mindFeedback === val ? '#fff' : '#334155',
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

      {/* Sticky Bottom Funding Bar that never covers the story */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 28,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.08,
          shadowRadius: 6,
          elevation: 10,
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <View>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
              {formatCurrency(campaign.amountRaised)}{' '}
              <Text style={{ fontSize: 12, fontWeight: '500', color: '#64748b' }}>
                of {formatCurrency(campaign.fundingGoal)}
              </Text>
            </Text>
            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
              {pct}% funded • Est. reach: {formatNumber(currentReachEstimate)}
            </Text>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TouchableOpacity
              onPress={handleShare}
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="share-outline" size={20} color="#334155" />
            </TouchableOpacity>

            {isBackable && (
              <Button
                title="Back This Campaign"
                size="md"
                icon="megaphone-outline"
                onPress={() => navigation.navigate('FundCampaign', { campaignId: campaign.id })}
              />
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
