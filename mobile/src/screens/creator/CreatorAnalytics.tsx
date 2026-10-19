import React, { useMemo } from 'react';
import { View, ScrollView, StatusBar, Dimensions, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCampaignStore } from '../../store/useCampaignStore';
import { calculateImpact } from '../../services/impact';
import { Card } from '../../components/ui/Card';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { colors, fonts, tokens } from '../../theme/tokens';
import {
  Headline,
  Subheading,
  BodyText,
  StatHero,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import Svg, { Line, Circle } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

export function CreatorAnalyticsScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const allContributions = useCampaignStore((s) => s.contributions);
  const campaigns = useCampaignStore((s) => s.campaigns);

  const uid = user?.uid || 'demo-user';
  const contributions = useMemo(
    () => allContributions.filter((c) => c.userId === uid),
    [allContributions, uid]
  );
  const impact = useMemo(
    () =>
      calculateImpact(contributions, (id) =>
        campaigns.find((c) => c.id === id || c.slug === id)
      ),
    [contributions, campaigns]
  );

  const hasData = contributions.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          backgroundColor: colors.surface,
          paddingTop: 52,
          paddingBottom: 16,
          paddingHorizontal: tokens.spacing.lg,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <Headline style={{ fontSize: 24, color: colors.ink }}>
              Analytics & Impact
            </Headline>
            <MetaLabel style={{ marginTop: 2 }}>
              Distribution reach & performance (Estimate)
            </MetaLabel>
          </View>
          <DemoDataBadge size="sm" />
        </View>

        {/* Newspaper Hero Numbers Block */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 16,
            backgroundColor: colors.paperSecondary,
            borderRadius: tokens.radius.sm,
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderWidth: 1,
            borderColor: colors.hairline,
          }}
        >
          <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.hairline }}>
            <StatHero style={{ fontSize: 18, color: colors.accent }}>
              {formatNumber(impact.peopleReached)}
            </StatHero>
            <SmallCapsLabel style={{ fontSize: 9, color: colors.mutedInk, marginTop: 2 }}>
              EST. REACH
            </SmallCapsLabel>
          </View>

          <View style={{ flex: 1, alignItems: 'center', borderRightWidth: 1, borderRightColor: colors.hairline }}>
            <StatHero style={{ fontSize: 18, color: colors.ink }}>
              {impact.campaignsBacked}
            </StatHero>
            <SmallCapsLabel style={{ fontSize: 9, color: colors.mutedInk, marginTop: 2 }}>
              BACKED
            </SmallCapsLabel>
          </View>

          <View style={{ flex: 1, alignItems: 'center' }}>
            <StatHero style={{ fontSize: 18, color: colors.positive }}>
              {formatCurrency(impact.totalContributedDollars)}
            </StatHero>
            <SmallCapsLabel style={{ fontSize: 9, color: colors.mutedInk, marginTop: 2 }}>
              POOLED
            </SmallCapsLabel>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: tokens.spacing.lg, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Total Contributed Card */}
        <Card style={{ marginBottom: tokens.spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <SmallCapsLabel style={{ color: colors.mutedInk }}>
                TOTAL AMPLIFICATION BUDGET
              </SmallCapsLabel>
              <StatHero style={{ fontSize: 28, color: colors.ink, marginTop: 4 }}>
                {formatCurrency(impact.totalContributedDollars)}
              </StatHero>
            </View>
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: tokens.radius.xs,
                backgroundColor: colors.paperSecondary,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="trending-up" size={20} color={colors.accent} />
            </View>
          </View>
        </Card>

        {/* Detailed Stats */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: tokens.spacing.md }}>
          <Card style={{ flex: 1 }}>
            <Ionicons name="eye-outline" size={18} color={colors.accent} />
            <StatHero style={{ fontSize: 20, color: colors.ink, marginTop: 6 }}>
              {formatNumber(impact.totalViews)}
            </StatHero>
            <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>
              EST. IMPRESSIONS
            </SmallCapsLabel>
          </Card>
          <Card style={{ flex: 1 }}>
            <Ionicons name="hand-left-outline" size={18} color={colors.positive} />
            <StatHero style={{ fontSize: 20, color: colors.ink, marginTop: 6 }}>
              {formatNumber(impact.totalActions)}
            </StatHero>
            <SmallCapsLabel style={{ fontSize: 10, marginTop: 2 }}>
              EST. ACTIONS
            </SmallCapsLabel>
          </Card>
        </View>

        {/* Reach Over Time Chart */}
        {impact.timeSeries.length > 1 && (
          <Card style={{ marginBottom: tokens.spacing.md }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <SmallCapsLabel style={{ fontSize: 11, color: colors.ink }}>
                ESTIMATED REACH OVER TIME (ESTIMATE)
              </SmallCapsLabel>
              <DemoDataBadge size="sm" />
            </View>
            <Svg width={SCREEN_W - 80} height={120}>
              {impact.timeSeries.map((point, i) => {
                const maxReach = Math.max(...impact.timeSeries.map((p) => p.reach)) || 1;
                const x = (i / (impact.timeSeries.length - 1)) * (SCREEN_W - 100);
                const y = 110 - (point.reach / maxReach) * 100;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <Line
                        x1={((i - 1) / (impact.timeSeries.length - 1)) * (SCREEN_W - 100)}
                        y1={110 - (impact.timeSeries[i - 1].reach / maxReach) * 100}
                        x2={x}
                        y2={y}
                        stroke={colors.accent}
                        strokeWidth={1.5}
                      />
                    )}
                    <Circle cx={x} cy={y} r={3} fill={colors.accent} />
                  </React.Fragment>
                );
              })}
            </Svg>
          </Card>
        )}

        {/* Campaign Breakdown */}
        {impact.campaignSummaries.length > 0 && (
          <View>
            <Headline style={{ fontSize: 18, color: colors.ink, marginBottom: 12 }}>
              Supported Campaigns
            </Headline>
            {impact.campaignSummaries.map((cs) => {
              const c = campaigns.find((x) => x.id === cs.id || x.slug === cs.id);
              if (!c) return null;
              return (
                <CampaignCard
                  key={cs.id}
                  campaign={c}
                  onPress={() => navigation.navigate('CampaignDetail', { campaignId: cs.id })}
                  variant="compact"
                />
              );
            })}
          </View>
        )}

        {!hasData && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Ionicons name="bar-chart-outline" size={40} color={colors.secondaryCaption} />
            <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.mutedInk, marginTop: 12 }}>
              No performance data yet
            </Text>
            <MetaLabel style={{ textAlign: 'center', marginTop: 4, maxWidth: 280 }}>
              Back a campaign or launch one to inspect distribution analytics here.
            </MetaLabel>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
