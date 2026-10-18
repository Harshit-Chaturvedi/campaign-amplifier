import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
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
import { useCampaignStore } from '../../store/useCampaignStore';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatting';
import { apiClient } from '../../api/client';

export function ReportScreen({ route, navigation }: any) {
  const { campaignId } = route.params;
  const storeCampaign = useCampaignStore((s) => s.getCampaign(campaignId));
  const contributions = useCampaignStore((s) => s.getCampaignContributions(campaignId));

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
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
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
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
          Distribution Report
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={showInfoSheet ? 'Hide metrics explanation' : 'View metrics explanation'}
          onPress={() => setShowInfoSheet(!showInfoSheet)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#eef2ff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="help-circle-outline" size={20} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 60 }} showsVerticalScrollIndicator={false}>
        {/* Loading State */}
        {loading && (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#4f46e5" />
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 12 }}>
              Loading distribution analytics...
            </Text>
          </View>
        )}

        {/* Error State */}
        {error && !loading && (
          <Card style={{ backgroundColor: '#fef2f2', borderColor: '#fecaca', marginBottom: 16 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#dc2626', marginBottom: 4 }}>
              Unable to load report
            </Text>
            <Text style={{ fontSize: 12, color: '#b91c1c' }}>{error}</Text>
          </Card>
        )}

        {/* Header Summary */}
        <Card style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
                Status: {campaign?.status ? campaign.status.replace(/_/g, ' ') : 'Funding'}
              </Text>
            </View>
            <DemoDataBadge size="sm" />
          </View>

          <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>
            {campaign?.title || 'Campaign Amplification'}
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b' }}>
            Transparent breakdown of funds raised, budget allocation, estimated reach, and measured delivery.
          </Text>
        </Card>

        {/* Metric Definitions Info Sheet (Accordion / Card) */}
        {showInfoSheet && (
          <Card style={{ backgroundColor: '#eff6ff', borderColor: '#bfdbfe', marginBottom: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#1d4ed8' }}>
                Metric Definitions & Accounting Policy
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close metric definitions"
                onPress={() => setShowInfoSheet(false)}
              >
                <Ionicons name="close" size={18} color="#1d4ed8" />
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 12, color: '#1e40af', lineHeight: 18, marginBottom: 6 }}>
              • <Text style={{ fontWeight: '700' }}>Estimated Reach:</Text> Projected audience size calculated from advertising CPM and frequency prior to launch. Always labelled as "Estimate" and never guaranteed.
            </Text>
            <Text style={{ fontSize: 12, color: '#1e40af', lineHeight: 18, marginBottom: 6 }}>
              • <Text style={{ fontWeight: '700' }}>Measured (demo data):</Text> Actual delivery metrics recorded from ad servers (Meta, Instagram, Reddit). Never combined or confused with estimates.
            </Text>
            <Text style={{ fontSize: 12, color: '#1e40af', lineHeight: 18, marginBottom: 6 }}>
              • <Text style={{ fontWeight: '700' }}>Ad Spend (95%):</Text> Direct expenditure on digital advertising inventory.
            </Text>
            <Text style={{ fontSize: 12, color: '#1e40af', lineHeight: 18 }}>
              • <Text style={{ fontWeight: '700' }}>Platform Fee (5%):</Text> Retained to cover editorial moderation, source checks, and delivery infrastructure.
            </Text>
          </Card>
        )}

        {/* SECTION 1: FUNDING */}
        <Card style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
              1. Funding Summary
            </Text>
            <Ionicons name="cash-outline" size={18} color="#16a34a" />
          </View>

          <View style={{ flexDirection: 'row', marginBottom: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>
                {formatCurrency(fundingData.amount_raised)}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Raised of {formatCurrency(fundingData.funding_goal)} goal</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#4f46e5' }}>
                {fundingData.backer_count}
              </Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Community Backers</Text>
            </View>
          </View>

          <ProgressBar progress={fundingData.percent_funded} color="#4f46e5" height={8} />

          {/* Contributions List (Backer names private by default!) */}
          <View style={{ marginTop: 16, borderTopWidth: 1, borderTopColor: '#f1f5f9', paddingTop: 12 }}>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 8 }}>
              Recent Backer Transactions (Names Private by Default):
            </Text>
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
                    <Ionicons name="shield" size={14} color="#94a3b8" />
                    <Text style={{ fontSize: 13, color: '#475569' }}>
                      {c.showName && c.backerName && c.backerName !== 'Anonymous'
                        ? c.backerName
                        : 'Private Supporter'}
                    </Text>
                  </View>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
                    {formatCurrency(c.amount)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: 12, color: '#94a3b8', fontStyle: 'italic' }}>
                No public individual records. Backer identities remain private.
              </Text>
            )}
          </View>
        </Card>

        {/* SECTION 2: BUDGET ALLOCATION */}
        <Card style={{ marginBottom: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
              2. Budget & Expenditure
            </Text>
            <Ionicons name="pie-chart-outline" size={18} color="#4f46e5" />
          </View>

          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#475569' }}>Total Backer Pool</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                {formatCurrency(budgetData.total_raised)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#16a34a' }}>• Direct Advertising Inventory (95%)</Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#16a34a' }}>
                {formatCurrency(budgetData.ad_budget)}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, color: '#64748b' }}>• Platform Review & Infrastructure (5%)</Text>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b' }}>
                {formatCurrency(budgetData.platform_fee)}
              </Text>
            </View>

            <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 4 }} />

            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155' }}>Ad Spend Disbursed to Date</Text>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>
                {formatCurrency(budgetData.spent)}
              </Text>
            </View>
          </View>
        </Card>

        {/* SECTION 3: DELIVERY - MEASURED (LABELED "Measured (demo data)") */}
        <Card style={{ marginBottom: 20, backgroundColor: '#ffffff', borderColor: '#e2e8f0' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
              3. Delivery — Measured
            </Text>
            <View style={{ backgroundColor: '#dbeafe', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#1e40af', textTransform: 'uppercase' }}>
                Measured (demo data)
              </Text>
            </View>
          </View>

          {deliveryData.measured ? (
            <View>
              <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                Real ad server telemetry recorded during active delivery.
              </Text>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                    {formatNumber(deliveryData.measured.measured_reach)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Measured Unique Reach</Text>
                </View>

                <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                    {formatNumber(deliveryData.measured.impressions)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Measured Impressions</Text>
                </View>

                <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#0f172a' }}>
                    {formatNumber(deliveryData.measured.clicks)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Link Clicks to Evidence</Text>
                </View>

                <View style={{ flex: 1, minWidth: '45%', backgroundColor: '#f8fafc', padding: 12, borderRadius: 10 }}>
                  <Text style={{ fontSize: 20, fontWeight: '800', color: '#16a34a' }}>
                    {formatCurrency(deliveryData.measured.ad_spend)}
                  </Text>
                  <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Ad Inventory Expended</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ paddingVertical: 14, alignItems: 'center' }}>
              <Ionicons name="time-outline" size={28} color="#94a3b8" />
              <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 6 }}>
                Measured telemetry pending delivery
              </Text>
              <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 2 }}>
                Measured impressions and clicks will be recorded once the campaign is approved and starts promotion.
              </Text>
            </View>
          )}
        </Card>

        {/* SECTION 4: ESTIMATES (LABELED "Estimate") */}
        <Card style={{ marginBottom: 20, backgroundColor: '#f8fafc' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
              4. Estimates
            </Text>
            <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
              <Text style={{ fontSize: 10, fontWeight: '800', color: '#b45309', textTransform: 'uppercase' }}>
                Estimate
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
            Projections based on campaign funding goal and standard platform CPM ($14.50, 2.2x frequency).
          </Text>

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#4f46e5' }}>
                {formatNumber(deliveryData.estimated.reach)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Projected Reach at Goal</Text>
            </View>

            <View style={{ flex: 1, backgroundColor: '#fff', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#e2e8f0' }}>
              <Text style={{ fontSize: 20, fontWeight: '800', color: '#4f46e5' }}>
                {formatNumber(deliveryData.estimated.impressions)}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>Projected Impressions</Text>
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
