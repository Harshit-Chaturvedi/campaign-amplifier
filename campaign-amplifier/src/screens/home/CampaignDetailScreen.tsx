import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCurrency, formatNumber, timeAgo } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';
import { AmplificationNotice } from '../../components/campaign/AmplificationNotice';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { estimateReach } from '../../services/reach';
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
  const campaign = useCampaignStore((s) => s.getCampaign(campaignId));
  const contributions = useCampaignStore((s) => s.getCampaignContributions(campaignId));
  const [reviewExpanded, setReviewExpanded] = useState(false);
  const [useOfFundsExpanded, setUseOfFundsExpanded] = useState(false);
  const [audienceExpanded, setAudienceExpanded] = useState(false);

  if (!campaign) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
        <Text style={{ fontSize: 16, color: '#64748b', marginTop: 12 }}>Campaign not found</Text>
      </View>
    );
  }

  const catColor = getCategoryColor(campaign.category);
  const pct = campaign.percentFunded ?? 0;
  const barColor = pct >= 100 ? '#22c55e' : '#4f46e5';
  const displayCategory = catLabels[campaign.category] || campaign.category;
  const coverUrl = campaign.adAssets?.coverUrl;
  const currentReachEstimate = estimateReach(campaign.amountRaised).estimate;

  const renderStoryBlock = (block: StoryBlock, index: number) => {
    switch (block.type) {
      case 'heading': {
        const fontSize = block.level === 1 ? 20 : block.level === 2 ? 18 : 16;
        return (
          <Text
            key={index}
            style={{
              fontSize,
              fontWeight: '700',
              color: '#0f172a',
              marginTop: index === 0 ? 0 : 20,
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
              marginBottom: 12,
            }}
          >
            {block.text}
          </Text>
        );
      case 'image':
        return (
          <View key={index} style={{ marginVertical: 14, borderRadius: 14, overflow: 'hidden', backgroundColor: '#f1f5f9' }}>
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
          <Card key={index} style={{ marginVertical: 12, backgroundColor: '#f8fafc', borderColor: '#e2e8f0', borderWidth: 1, padding: 16 }}>
            <Text style={{ fontSize: 30, fontWeight: '900', color: '#4f46e5' }}>
              {block.value}
            </Text>
            <Text style={{ fontSize: 14, color: '#475569', marginTop: 4, fontWeight: '500' }}>
              {block.label}
            </Text>
          </Card>
        );
      case 'quote':
        return (
          <View
            key={index}
            style={{
              marginVertical: 14,
              paddingLeft: 14,
              borderLeftWidth: 4,
              borderLeftColor: '#4f46e5',
            }}
          >
            <Text style={{ fontSize: 15, fontStyle: 'italic', color: '#1e293b', lineHeight: 24 }}>
              "{block.quote}"
            </Text>
            {block.attribution && (
              <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748b', marginTop: 6 }}>
                — {block.attribution}
              </Text>
            )}
          </View>
        );
      case 'action':
        return (
          <Card key={index} style={{ marginVertical: 14, backgroundColor: '#eff6ff', borderColor: '#bfdbfe', borderWidth: 1, padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="compass-outline" size={20} color="#2563eb" />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1d4ed8', marginLeft: 8 }}>
                {block.title}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#1e40af', marginTop: 6, lineHeight: 20 }}>
              {block.description}
            </Text>
            {block.url && (
              <TouchableOpacity
                onPress={() => Linking.openURL(block.url!)}
                style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#2563eb', marginRight: 4 }}>
                  Take Action
                </Text>
                <Ionicons name="arrow-forward" size={14} color="#2563eb" />
              </TouchableOpacity>
            )}
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }} numberOfLines={1}>
          Campaign Story
        </Text>
        <TouchableOpacity
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#f1f5f9',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="share-outline" size={20} color="#0f172a" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Cover visual */}
        <View style={{ height: 210, backgroundColor: catColor + '15', overflow: 'hidden' }}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          ) : (
            <View style={{ width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="megaphone" size={56} color={catColor} />
            </View>
          )}

          <View style={{ position: 'absolute', top: 16, left: 16 }}>
            <View
              style={{
                backgroundColor: 'rgba(255,255,255,0.92)',
                borderRadius: 20,
                paddingHorizontal: 12,
                paddingVertical: 5,
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '700', color: catColor }}>
                {displayCategory}
              </Text>
            </View>
          </View>
          <View style={{ position: 'absolute', top: 16, right: 16 }}>
            <StatusBadge status={campaign.status} size="sm" />
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {/* Title & Creator */}
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', lineHeight: 28 }}>
            {campaign.title}
          </Text>
          {campaign.tagline && (
            <Text style={{ fontSize: 15, color: '#64748b', marginTop: 6, lineHeight: 22 }}>
              {campaign.tagline}
            </Text>
          )}
          <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
            by {campaign.creatorName} · {timeAgo(campaign.createdAt)}
          </Text>

          {/* Amplification Notice */}
          <View style={{ marginTop: 16 }}>
            <AmplificationNotice />
          </View>

          {/* Funding Progress Card */}
          <Card style={{ marginTop: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a' }}>
                  {formatCurrency(campaign.amountRaised)}
                </Text>
                <Text style={{ fontSize: 14, color: '#94a3b8', marginLeft: 8 }}>
                  raised of {formatCurrency(campaign.fundingGoal)} goal
                </Text>
              </View>
              <DemoDataBadge size="sm" />
            </View>

            <View style={{ height: 8, backgroundColor: '#e2e8f0', borderRadius: 4, marginTop: 12 }}>
              <View style={{ width: `${Math.min(100, pct)}%`, height: 8, backgroundColor: barColor, borderRadius: 4 }} />
            </View>

            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a' }}>{pct}%</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Funded</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a' }}>{campaign.backerCount || contributions.length}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Backers</Text>
              </View>
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#4f46e5' }}>
                  {formatNumber(campaign.estimatedReachAtGoal)}
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Est. Reach @ Goal</Text>
              </View>
            </View>
          </Card>

          {/* Measured Delivery (for Promoting & Completed) */}
          {campaign.measuredDelivery && (
            <Card style={{ marginTop: 16, backgroundColor: '#f0fdfa', borderColor: '#99f6e4', borderWidth: 1, padding: 18 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="radio" size={18} color="#0d9488" />
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f766e', marginLeft: 8 }}>
                    Measured Delivery Stats
                  </Text>
                </View>
                <View style={{ backgroundColor: '#ccfbf1', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#0f766e' }}>VERIFIED ADS</Text>
                </View>
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f766e' }}>
                    {formatNumber(campaign.measuredDelivery.measuredReach)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#115e59' }}>Audience Reached</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f766e' }}>
                    {formatNumber(campaign.measuredDelivery.impressions)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#115e59' }}>Impressions</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f766e' }}>
                    {formatNumber(campaign.measuredDelivery.clicks)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#115e59' }}>Clicks</Text>
                </View>
                <View style={{ alignItems: 'center' }}>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f766e' }}>
                    {formatCurrency(campaign.measuredDelivery.adSpend)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#115e59' }}>Ad Spend</Text>
                </View>
              </View>
            </Card>
          )}

          {/* Final Distribution Report (for Completed) */}
          {campaign.report && (
            <Card style={{ marginTop: 16, backgroundColor: '#f8fafc', borderColor: '#cbd5e1', borderWidth: 1, padding: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                <Ionicons name="ribbon-outline" size={20} color="#0f172a" />
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginLeft: 8 }}>
                  Final Distribution Report
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                {campaign.report.summaryNotes || 'The advertising campaign was completed as budgeted across selected channels.'}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#e2e8f0' }}>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  Total Raised: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(campaign.report.fundsRaised)}</Text>
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  Ad Spend: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formatCurrency(campaign.report.adSpend)}</Text>
                </Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  Audience: <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formatNumber(campaign.report.measuredReach)}</Text>
                </Text>
              </View>
            </Card>
          )}

          {/* Story Blocks */}
          <View style={{ marginTop: 24 }}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>
              The Story
            </Text>
            {campaign.storyBlocks && campaign.storyBlocks.length > 0 ? (
              campaign.storyBlocks.map((block, i) => renderStoryBlock(block, i))
            ) : (
              <Text style={{ fontSize: 15, color: '#334155', lineHeight: 24 }}>
                {campaign.summary}
              </Text>
            )}
          </View>

          {/* Verified Sources Section */}
          {campaign.sources && campaign.sources.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="document-text-outline" size={18} color="#0f172a" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginLeft: 8 }}>
                  Supporting Sources ({campaign.sources.length})
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>
                Traceable evidence cited by the creator for public inspection:
              </Text>
              {campaign.sources.map((src) => (
                <TouchableOpacity
                  key={src.id}
                  onPress={() => Linking.openURL(src.url)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                  }}
                >
                  <Ionicons name="link" size={16} color="#4f46e5" />
                  <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>
                      {src.title}
                    </Text>
                    <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }} numberOfLines={1}>
                      {src.url.replace(/^https?:\/\//, '')}
                    </Text>
                  </View>
                  <Ionicons name="open-outline" size={16} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Planned Ad Creative */}
          {campaign.adAssets && (
            <View style={{ marginTop: 28 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
                Planned Advertising Creative
              </Text>
              <Card style={{ overflow: 'hidden', padding: 0 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                  <View
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 16,
                      backgroundColor: '#eef2ff',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 8,
                    }}
                  >
                    <Ionicons name="megaphone" size={14} color="#4f46e5" />
                  </View>
                  <View>
                    <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>Sponsored Amplification</Text>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>Targeted Digital Ad Preview</Text>
                  </View>
                </View>

                <Text style={{ fontSize: 14, color: '#334155', paddingHorizontal: 12, marginBottom: 8 }} numberOfLines={3}>
                  {campaign.adAssets.description}
                </Text>

                <View style={{ height: 180, backgroundColor: catColor + '10', overflow: 'hidden' }}>
                  {coverUrl ? (
                    <Image source={{ uri: coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <Ionicons name="image-outline" size={40} color="#94a3b8" />
                  )}
                </View>

                <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
                    {campaign.adAssets.headline}
                  </Text>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <Text style={{ fontSize: 11, color: '#94a3b8' }}>campaigns.org</Text>
                    <View style={{ backgroundColor: '#4f46e5', borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                        {campaign.adAssets.cta || 'Learn More'}
                      </Text>
                    </View>
                  </View>
                </View>
              </Card>
            </View>
          )}

          {/* Expandable: Audience & Distribution */}
          <Card style={{ marginTop: 24 }}>
            <TouchableOpacity
              onPress={() => setAudienceExpanded(!audienceExpanded)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="people-outline" size={20} color="#4f46e5" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginLeft: 8 }}>
                  Audience & channel targeting
                </Text>
              </View>
              <Ionicons
                name={audienceExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748b"
              />
            </TouchableOpacity>

            {audienceExpanded && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                  <Text style={{ fontWeight: '700' }}>Target Locations:</Text>{' '}
                  {campaign.reachSettings?.locations.join(', ') || 'All Regions'}
                </Text>
                <Text style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 20 }}>
                  <Text style={{ fontWeight: '700' }}>Interest Groups:</Text>{' '}
                  {campaign.reachSettings?.interests.join(', ') || 'General Public'}
                </Text>
                <Text style={{ fontSize: 13, color: '#475569', marginTop: 6, lineHeight: 20 }}>
                  <Text style={{ fontWeight: '700' }}>Distribution Channels:</Text>{' '}
                  {campaign.reachSettings?.channels.join(', ') || 'Meta, Instagram'}
                </Text>
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 8, fontStyle: 'italic' }}>
                  Targeting parameters are validated during editorial and compliance review before ads launch.
                </Text>
              </View>
            )}
          </Card>

          {/* Expandable: How review works */}
          <Card style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setReviewExpanded(!reviewExpanded)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#4f46e5" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginLeft: 8 }}>
                  How review works
                </Text>
              </View>
              <Ionicons
                name={reviewExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748b"
              />
            </TouchableOpacity>

            {reviewExpanded && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                  Every campaign is reviewed by platform moderators before community funding opens. The review checks:
                </Text>
                <Text style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 20 }}>
                  • <Text style={{ fontWeight: '600' }}>Sources & Evidence:</Text> Claims must link to public, verifiable citations.{'\n'}
                  • <Text style={{ fontWeight: '600' }}>Message Integrity:</Text> Story and headlines must stay proportionate to the evidence.{'\n'}
                  • <Text style={{ fontWeight: '600' }}>Ad Compliance:</Text> Creative assets and targeting must satisfy public platform advertising policies.{'\n'}
                  • <Text style={{ fontWeight: '600' }}>No Direct Donations:</Text> Contributions solely fund distribution costs; funds are never transferred to the creator.
                </Text>
                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 10, fontStyle: 'italic' }}>
                  We do not score causes or claim independent truth verification. We verify that citations exist and framing is proportionate.
                </Text>
              </View>
            )}
          </Card>

          {/* Expandable: Use of Funds */}
          <Card style={{ marginTop: 12 }}>
            <TouchableOpacity
              onPress={() => setUseOfFundsExpanded(!useOfFundsExpanded)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="pie-chart-outline" size={20} color="#4f46e5" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginLeft: 8 }}>
                  Use of funds & distribution
                </Text>
              </View>
              <Ionicons
                name={useOfFundsExpanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color="#64748b"
              />
            </TouchableOpacity>

            {useOfFundsExpanded && (
              <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 13, color: '#475569', lineHeight: 20 }}>
                  Contributions pool to pay for ad distribution across digital channels.
                </Text>
                <Text style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 20 }}>
                  • <Text style={{ fontWeight: '600' }}>95% Advertising Media Budget:</Text> Directly pays for advertising inventory on Meta, Google, Reddit, and selected channels.{'\n'}
                  • <Text style={{ fontWeight: '600' }}>5% Platform Operations:</Text> Covers moderation, ad optimization, and technical maintenance.{'\n'}
                  • <Text style={{ fontWeight: '600' }}>Refund Policy:</Text> If a campaign fails moderation or is cancelled before distribution, contributions are refunded in full.
                </Text>
              </View>
            )}
          </Card>

          {/* Estimated Reach & Performance Stats */}
          <Card style={{ marginTop: 20, marginBottom: 120 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
                Current Reach Estimates
              </Text>
              <DemoDataBadge size="sm" />
            </View>
            <View style={{ flexDirection: 'row' }}>
              {[
                { label: 'Est. Reach Raised', value: formatNumber(currentReachEstimate), icon: 'radio-outline' },
                { label: 'Est. Views', value: formatNumber(Math.round(currentReachEstimate * 2.2)), icon: 'eye-outline' },
                { label: 'Est. Reach @ Goal', value: formatNumber(campaign.estimatedReachAtGoal), icon: 'flag-outline' },
              ].map((stat) => (
                <View key={stat.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Ionicons name={stat.icon as any} size={20} color="#4f46e5" />
                  <Text style={{ fontSize: 17, fontWeight: '800', color: '#0f172a', marginTop: 4 }}>
                    {stat.value}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2, textAlign: 'center' }}>
                    {stat.label}
                  </Text>
                </View>
              ))}
            </View>
            <Text style={{ fontSize: 11, color: '#94a3b8', textAlign: 'center', marginTop: 12 }}>
              Reach is estimated from prototype assumptions, not guaranteed delivery.
            </Text>
          </Card>
        </View>
      </ScrollView>

      {/* Sticky Back Button */}
      {campaign.status === 'available_for_funding' && (
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: '#fff',
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
            padding: 16,
            paddingBottom: 32,
          }}
        >
          <Button
            title="Back this campaign"
            onPress={() => navigation.navigate('FundCampaign', { campaignId: campaign.id })}
            icon="megaphone"
            fullWidth
          />
        </View>
      )}
    </View>
  );
}
