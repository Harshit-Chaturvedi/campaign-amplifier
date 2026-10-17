import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCurrency, formatNumber, timeAgo } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';
import { calculateContributionStats } from '../../services/impact';
import { AmplificationNotice } from '../../components/campaign/AmplificationNotice';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';

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

  if (!campaign) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f8fafc' }}>
        <Ionicons name="alert-circle-outline" size={48} color="#94a3b8" />
        <Text style={{ fontSize: 16, color: '#64748b', marginTop: 12 }}>Campaign not found</Text>
      </View>
    );
  }

  const catColor = getCategoryColor(campaign.category);
  const pct = campaign.percent_funded;
  const barColor = pct >= 100 ? '#22c55e' : '#4f46e5';
  const { reach } = calculateContributionStats(contributions);
  const displayCategory = catLabels[campaign.category] || campaign.category;

  const daysLeft =
    campaign.duration_days > 0
      ? Math.max(
          0,
          campaign.duration_days -
            Math.floor((Date.now() - new Date(campaign.launched_at).getTime()) / 86400000)
        )
      : null;

  // Strip HTML tags for clean display
  const stripHtml = (html: string) => html.replace(/<[^>]*>/g, '').trim();

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
        {/* Hero */}
        <View
          style={{
            height: 200,
            backgroundColor: catColor + '15',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="megaphone" size={56} color={catColor} />
          <View style={{ position: 'absolute', top: 16, left: 16 }}>
            <View
              style={{
                backgroundColor: catColor + '20',
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
            <DemoDataBadge size="sm" />
          </View>
        </View>

        <View style={{ padding: 20 }}>
          {/* Title & Creator */}
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', lineHeight: 28 }}>
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 15, color: '#64748b', marginTop: 6, lineHeight: 22 }}>
            {campaign.tagline}
          </Text>
          <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
            by {campaign.creator_name} · {timeAgo(campaign.created_at)}
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
                  {formatCurrency(campaign.funding_current)}
                </Text>
                <Text style={{ fontSize: 14, color: '#94a3b8', marginLeft: 8 }}>
                  raised of {formatCurrency(campaign.funding_goal)} goal
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
                <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a' }}>{contributions.length}</Text>
                <Text style={{ fontSize: 12, color: '#94a3b8' }}>Backers</Text>
              </View>
              {daysLeft !== null && (
                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{ fontSize: 22, fontWeight: '700', color: '#0f172a' }}>{daysLeft}</Text>
                  <Text style={{ fontSize: 12, color: '#94a3b8' }}>Days left</Text>
                </View>
              )}
            </View>
          </Card>

          {/* Description */}
          <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 24, marginBottom: 8 }}>
            About this campaign
          </Text>
          <Text style={{ fontSize: 15, color: '#334155', lineHeight: 24 }}>
            {stripHtml(campaign.long_description)}
          </Text>

          {/* Why Back */}
          {campaign.why_backers_should_care && (
            <Card style={{ marginTop: 20, backgroundColor: '#eef2ff' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="sparkles" size={18} color="#4f46e5" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#4f46e5', marginLeft: 8 }}>
                  Why back this message?
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#3730a3', lineHeight: 22 }}>
                {stripHtml(campaign.why_backers_should_care)}
              </Text>
            </Card>
          )}

          {/* Sources Section */}
          {campaign.campaign_sources.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Ionicons name="document-text-outline" size={18} color="#0f172a" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginLeft: 8 }}>
                  Supporting Sources ({campaign.campaign_sources.length})
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>
                Traceable evidence cited by the creator for public review:
              </Text>
              {campaign.campaign_sources.map((src, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => Linking.openURL(src)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 10,
                    borderBottomWidth: 1,
                    borderBottomColor: '#f1f5f9',
                  }}
                >
                  <Ionicons name="link-outline" size={16} color="#4f46e5" />
                  <Text style={{ fontSize: 13, color: '#4f46e5', marginLeft: 8, flex: 1 }} numberOfLines={1}>
                    {src.replace(/^https?:\/\//, '')}
                  </Text>
                  <Ionicons name="open-outline" size={14} color="#94a3b8" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Expandable: How review works */}
          <Card style={{ marginTop: 20 }}>
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
                  • <Text style={{ fontWeight: '600' }}>80% Media Spend:</Text> Buys ad inventory on Facebook, Instagram, Reddit, and other channels.{'\n'}
                  • <Text style={{ fontWeight: '600' }}>20% Platform & Processing:</Text> Covers moderation, ad operations, and payment processing.{'\n'}
                  • <Text style={{ fontWeight: '600' }}>Refund Policy:</Text> If a campaign fails moderation or is cancelled before launch, contributions are returned.
                </Text>
              </View>
            )}
          </Card>

          {/* Ad Preview */}
          {campaign.ad_headline && (
            <View style={{ marginTop: 24 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
                Planned Ad Creative
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
                  {campaign.ad_primary_text}
                </Text>
                <View style={{ height: 160, backgroundColor: catColor + '10', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="image-outline" size={40} color="#94a3b8" />
                </View>
                <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{campaign.ad_headline}</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>campaign-app.example.com</Text>
                </View>
              </Card>
            </View>
          )}

          {/* Target Audience */}
          {campaign.target_audience && (
            <Card style={{ marginTop: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <Ionicons name="people" size={18} color="#4f46e5" />
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginLeft: 8 }}>
                  Intended Audience
                </Text>
              </View>
              <Text style={{ fontSize: 14, color: '#334155', lineHeight: 22 }}>
                {campaign.target_audience}
              </Text>
            </Card>
          )}

          {/* Estimated Reach & Performance Stats */}
          <Card style={{ marginTop: 20, marginBottom: 120 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
                Estimated Reach & Engagement
              </Text>
              <DemoDataBadge size="sm" />
            </View>
            <View style={{ flexDirection: 'row' }}>
              {[
                { label: 'Est. Reach', value: formatNumber(reach), icon: 'radio-outline' },
                { label: 'Est. Views', value: formatNumber(Math.round(reach * 1.6)), icon: 'eye-outline' },
                { label: 'Est. Actions', value: formatNumber(Math.round(campaign.funding_current * 0.42)), icon: 'hand-left-outline' },
              ].map((stat) => (
                <View key={stat.label} style={{ flex: 1, alignItems: 'center' }}>
                  <Ionicons name={stat.icon as any} size={20} color="#4f46e5" />
                  <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 4 }}>
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
      {campaign.status === 'Approved' && (
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
