import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  ActivityIndicator,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import {
  Headline,
  Subheading,
  BodyText,
  StatHero,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { useCampaignStore } from '../../store/useCampaignStore';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatting';
import { apiClient } from '../../api/client';
import { colors, fonts, tokens } from '../../theme/tokens';

export function ReportScreen({ route, navigation }: any) {
  const { campaignId } = route.params;
  const campaigns = useCampaignStore((s) => s.campaigns);
  const storeCampaign = useMemo(
    () => campaigns.find((c) => c.id === campaignId || c.slug === campaignId),
    [campaigns, campaignId]
  );
  const allContributions = useCampaignStore((s) => s.contributions);
  const contributions = useMemo(
    () => allContributions.filter((c) => c.campaignId === campaignId),
    [allContributions, campaignId]
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [showInfoSheet, setShowInfoSheet] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchReport() {
      try {
        setLoading(true);
        setError(null);
        const res = await apiClient.getCampaignAnalytics(campaignId);
        if (isMounted) {
          setAnalytics(res.data);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Unable to load report data.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchReport();
    return () => {
      isMounted = false;
    };
  }, [campaignId]);

  const campaign = storeCampaign || (analytics ? {
    id: analytics.campaign_id,
    title: analytics.title,
    status: analytics.status,
    amountRaised: analytics.funding?.amount_raised || 0,
    fundingGoal: analytics.funding?.funding_goal || 1000,
    percentFunded: analytics.funding?.percent_funded || 0,
    backerCount: analytics.funding?.backer_count || 0,
  } : null);

  const fundingData = analytics?.funding || {
    amount_raised: campaign?.amountRaised || 0,
    funding_goal: campaign?.fundingGoal || 5000,
    percent_funded: campaign?.percentFunded || 0,
    backer_count: campaign?.backerCount || contributions.length || 0,
  };

  const budgetData = analytics?.budget || {
    total_raised: fundingData.amount_raised,
    ad_budget: Math.round(fundingData.amount_raised * 0.95),
    platform_fee: Math.round(fundingData.amount_raised * 0.05),
    spent: fundingData.amount_raised > 0 ? Math.round(fundingData.amount_raised * 0.92) : 0,
  };

  const deliveryData = analytics?.delivery || {
    estimated: {
      reach: Math.round((budgetData.ad_budget / 14.5) * 1000 / 2.2),
      impressions: Math.round((budgetData.ad_budget / 14.5) * 1000),
      label: 'Estimate',
    },
    measured: campaign?.status === 'completed' || campaign?.status === 'promoting' ? {
      impressions: 142800,
      measured_reach: 64900,
      clicks: 3410,
      ad_spend: budgetData.spent,
      is_final: campaign?.status === 'completed',
      label: 'Measured (demo data)',
    } : null,
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Distribution Report for "${campaign?.title || 'Civic Campaign'}": ${formatNumber(deliveryData.measured?.measured_reach || deliveryData.estimated.reach)} estimated audience reach funded by community backers.`,
        title: 'Campaign Distribution Report',
      });
    } catch {}
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Go back"
          onPress={() => navigation.goBack()}
          style={{
            width: 38,
            height: 38,
            borderRadius: tokens.radius.sm,
            backgroundColor: colors.paperSecondary,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={18} color={colors.ink} />
        </TouchableOpacity>
        <Headline style={{ fontSize: 18, color: colors.ink }}>
          Distribution Report
        </Headline>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={showInfoSheet ? 'Hide metrics explanation' : 'View metrics explanation'}
          onPress={() => setShowInfoSheet(!showInfoSheet)}
          style={{
            width: 38,
            height: 38,
            borderRadius: tokens.radius.sm,
            backgroundColor: colors.paperSecondary,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="help-circle-outline" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: tokens.spacing.lg, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={colors.accent} />
            <MetaLabel style={{ marginTop: 12 }}>
              Loading distribution analytics...
            </MetaLabel>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card style={{ backgroundColor: colors.dangerFaint, borderColor: colors.border, marginBottom: tokens.spacing.md }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.danger, marginBottom: 4 }}>
              Unable to load report
            </Text>
            <MetaLabel style={{ color: colors.danger }}>{error}</MetaLabel>
          </Card>
        )}

        {/* Header Summary */}
        <Card style={{ marginBottom: tokens.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <View style={{ backgroundColor: colors.paperSecondary, paddingHorizontal: 8, paddingVertical: 3, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}>
              <SmallCapsLabel style={{ color: colors.mutedInk }}>
                STATUS: {campaign?.status ? campaign.status.replace(/_/g, ' ') : 'FUNDING'}
              </SmallCapsLabel>
            </View>
            <DemoDataBadge size="sm" />
          </View>

          <Headline style={{ fontSize: 20, color: colors.ink, marginBottom: 6 }}>
            {campaign?.title || 'Campaign Amplification'}
          </Headline>
          <BodyText style={{ fontSize: 13, color: colors.mutedInk, lineHeight: 18 }}>
            Transparent accounting of backer funding, advertising allocation, and audience reach.
          </BodyText>
        </Card>

        {/* Metric Definitions Info Sheet */}
        {showInfoSheet && (
          <Card style={{ backgroundColor: colors.paperSecondary, borderColor: colors.hairline, marginBottom: tokens.spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.sm }}>
              <SmallCapsLabel style={{ color: colors.ink, fontSize: 12 }}>
                Metric Definitions & Accounting Policy
              </SmallCapsLabel>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close metric definitions"
                onPress={() => setShowInfoSheet(false)}
              >
                <Ionicons name="close" size={18} color={colors.mutedInk} />
              </TouchableOpacity>
            </View>
            <BodyText style={{ fontSize: 12, color: colors.mutedInk, lineHeight: 18, marginBottom: 6 }}>
              • <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>Estimated Reach:</Text> Projected audience size calculated from advertising CPM and frequency prior to launch. Always labelled as "Estimate".
            </BodyText>
            <BodyText style={{ fontSize: 12, color: colors.mutedInk, lineHeight: 18, marginBottom: 6 }}>
              • <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>Measured (demo data):</Text> Actual delivery metrics recorded from ad platforms. Never combined or confused with estimates.
            </BodyText>
            <BodyText style={{ fontSize: 12, color: colors.mutedInk, lineHeight: 18, marginBottom: 6 }}>
              • <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>Ad Spend (95%):</Text> Direct expenditure on digital advertising inventory.
            </BodyText>
            <BodyText style={{ fontSize: 12, color: colors.mutedInk, lineHeight: 18 }}>
              • <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>Platform Fee (5%):</Text> Retained to cover editorial moderation, source review, and delivery infrastructure.
            </BodyText>
          </Card>
        )}

        {/* SECTION 1: FUNDING */}
        <Card style={{ marginBottom: tokens.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.sm }}>
            <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
              1. Funding Summary
            </SmallCapsLabel>
            <Ionicons name="cash-outline" size={16} color={colors.positive} />
          </View>

          <View style={{ flexDirection: 'row', marginBottom: tokens.spacing.sm }}>
            <View style={{ flex: 1 }}>
              <StatHero style={{ fontSize: 24, color: colors.ink }}>
                {formatCurrency(fundingData.amount_raised)}
              </StatHero>
              <MetaLabel>Raised of {formatCurrency(fundingData.funding_goal)} goal</MetaLabel>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <StatHero style={{ fontSize: 24, color: colors.accent }}>
                {fundingData.backer_count}
              </StatHero>
              <SmallCapsLabel>COMMUNITY BACKERS</SmallCapsLabel>
            </View>
          </View>

          <ProgressBar progress={fundingData.percent_funded} color={colors.accent} height={3} />

          {/* Contributions List (Backer names private by default!) */}
          <View style={{ marginTop: tokens.spacing.md, borderTopWidth: 1, borderTopColor: colors.hairline, paddingTop: tokens.spacing.sm }}>
            <SmallCapsLabel style={{ color: colors.mutedInk, marginBottom: 8 }}>
              Recent Transactions (Backer Names Private by Default):
            </SmallCapsLabel>
            {contributions.length > 0 ? (
              contributions.slice(0, 4).map((c, i) => (
                <View
                  key={c.id || i}
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: 6,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="shield-outline" size={13} color={colors.mutedInk} />
                    <BodyText style={{ fontSize: 13, color: colors.mutedInk }}>
                      {c.showName && c.backerName && c.backerName !== 'Anonymous'
                        ? c.backerName
                        : 'Private Supporter'}
                    </BodyText>
                  </View>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    {formatCurrency(c.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <MetaLabel style={{ fontStyle: 'italic' }}>
                No public individual records. Backer identities remain private.
              </MetaLabel>
            )}
          </View>
        </Card>

        {/* SECTION 2: BUDGET ALLOCATION */}
        <Card style={{ marginBottom: tokens.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.sm }}>
            <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
              2. Budget & Expenditure
            </SmallCapsLabel>
            <Ionicons name="pie-chart-outline" size={16} color={colors.accent} />
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <BodyText style={{ fontSize: 13, color: colors.mutedInk }}>Total Backer Pool</BodyText>
              <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                {formatCurrency(budgetData.total_raised)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <BodyText style={{ fontSize: 13, color: colors.positive }}>• Direct Advertising Inventory (95%)</BodyText>
              <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.positive }}>
                {formatCurrency(budgetData.ad_budget)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <BodyText style={{ fontSize: 13, color: colors.mutedInk }}>• Platform Review & Infrastructure (5%)</BodyText>
              <Text style={{ fontSize: 14, fontFamily: fonts.sansMedium, color: colors.mutedInk }}>
                {formatCurrency(budgetData.platform_fee)}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: colors.hairline, marginVertical: 4 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <BodyText style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>Ad Spend Disbursed to Date</BodyText>
              <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: colors.ink }}>
                {formatCurrency(budgetData.spent)}
              </Text>
            </View>
          </View>
        </Card>

        {/* SECTION 3: DELIVERY - MEASURED (LABELED "Measured (demo data)") */}
        <Card style={{ marginBottom: tokens.spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.sm }}>
            <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
              3. Delivery — Measured
            </SmallCapsLabel>
            <View style={{ backgroundColor: colors.paperSecondary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}>
              <SmallCapsLabel style={{ fontSize: 10, color: colors.mutedInk }}>
                MEASURED (DEMO DATA)
              </SmallCapsLabel>
            </View>
          </View>

          {deliveryData.measured ? (
            <View>
              <MetaLabel style={{ marginBottom: tokens.spacing.sm }}>
                Real ad server telemetry recorded during active delivery.
              </MetaLabel>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.paperSecondary, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
                  <StatHero style={{ fontSize: 20, color: colors.ink }}>
                    {formatNumber(deliveryData.measured.measured_reach)}
                  </StatHero>
                  <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>MEASURED UNIQUE REACH</SmallCapsLabel>
                </View>

                <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.paperSecondary, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
                  <StatHero style={{ fontSize: 20, color: colors.ink }}>
                    {formatNumber(deliveryData.measured.impressions)}
                  </StatHero>
                  <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>MEASURED IMPRESSIONS</SmallCapsLabel>
                </View>

                <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.paperSecondary, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
                  <StatHero style={{ fontSize: 20, color: colors.ink }}>
                    {formatNumber(deliveryData.measured.clicks)}
                  </StatHero>
                  <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>LINK CLICKS TO EVIDENCE</SmallCapsLabel>
                </View>

                <View style={{ flex: 1, minWidth: '45%', backgroundColor: colors.paperSecondary, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
                  <StatHero style={{ fontSize: 20, color: colors.positive }}>
                    {formatCurrency(deliveryData.measured.ad_spend)}
                  </StatHero>
                  <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>AD INVENTORY EXPENDED</SmallCapsLabel>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Ionicons name="time-outline" size={24} color={colors.mutedInk} />
              <BodyText style={{ fontSize: 13, fontFamily: fonts.sansMedium, color: colors.ink, marginTop: 6 }}>
                Measured telemetry pending delivery
              </BodyText>
              <MetaLabel style={{ textAlign: 'center', marginTop: 2 }}>
                Measured impressions and clicks will be recorded once the campaign is approved and starts promotion.
              </MetaLabel>
            </View>
          )}
        </Card>

        {/* SECTION 4: ESTIMATES (LABELED "Estimate") */}
        <Card style={{ marginBottom: tokens.spacing.lg, backgroundColor: colors.paperSecondary }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: tokens.spacing.sm }}>
            <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
              4. Estimates
            </SmallCapsLabel>
            <View style={{ backgroundColor: colors.warningFaint, paddingHorizontal: 6, paddingVertical: 2, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.border }}>
              <SmallCapsLabel style={{ fontSize: 10, color: colors.warning }}>
                ESTIMATE
              </SmallCapsLabel>
            </View>
          </View>

          <MetaLabel style={{ marginBottom: tokens.spacing.sm }}>
            Projections based on campaign funding goal and standard platform CPM ($14.50, 2.2x frequency).
          </MetaLabel>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1, backgroundColor: colors.surface, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
              <StatHero style={{ fontSize: 20, color: colors.accent }}>
                {formatNumber(deliveryData.estimated.reach)}
              </StatHero>
              <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>PROJECTED REACH (ESTIMATE)</SmallCapsLabel>
            </View>

            <View style={{ flex: 1, backgroundColor: colors.surface, padding: tokens.spacing.sm, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
              <StatHero style={{ fontSize: 20, color: colors.accent }}>
                {formatNumber(deliveryData.estimated.impressions)}
              </StatHero>
              <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>PROJECTED IMPRESSIONS (ESTIMATE)</SmallCapsLabel>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={{ gap: 10 }}>
          <Button
            title="Share Distribution Report"
            onPress={handleShare}
            variant="primary"
            icon="share-outline"
            fullWidth
            size="lg"
          />

          <Button
            title="Return to Campaign"
            onPress={() => navigation.goBack()}
            variant="outline"
            fullWidth
          />
        </View>
      </ScrollView>
    </View>
  );
}
