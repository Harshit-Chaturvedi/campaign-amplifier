import React from 'react';
import { View, Text, ScrollView, StatusBar, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCampaignStore } from '../../store/useCampaignStore';
import { calculateImpact } from '../../services/impact';
import { Card } from '../../components/ui/Card';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import Svg, { Rect, Line, Circle, Text as SvgText } from 'react-native-svg';

const { width: SCREEN_W } = Dimensions.get('window');

export function ImpactDashboard({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const getUserContributions = useCampaignStore((s) => s.getUserContributions);
  const getCampaign = useCampaignStore((s) => s.getCampaign);

  const uid = user?.uid || 'demo-user';
  const contributions = getUserContributions(uid);
  const impact = calculateImpact(contributions, (id) => getCampaign(id));

  const hasData = contributions.length > 0;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={{ backgroundColor: '#4f46e5', paddingTop: 52, paddingBottom: 24, paddingHorizontal: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff' }}>Your Impact</Text>
        <Text style={{ fontSize: 14, color: '#c7d2fe', marginTop: 4 }}>See how your contributions make a difference</Text>

        {/* Main Stats */}
        <View style={{ flexDirection: 'row', marginTop: 20 }}>
          {[
            { label: 'People Reached', value: formatNumber(impact.peopleReached), icon: 'radio-outline' },
            { label: 'Campaigns', value: impact.campaignsBacked.toString(), icon: 'megaphone-outline' },
            { label: 'Trust Score', value: impact.avgTrustScore.toString(), icon: 'shield-checkmark-outline' },
          ].map((stat) => (
            <View key={stat.label} style={{ flex: 1, alignItems: 'center' }}>
              <Ionicons name={stat.icon as any} size={20} color="#c7d2fe" />
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#fff', marginTop: 4 }}>{stat.value}</Text>
              <Text style={{ fontSize: 11, color: '#a5b4fc', marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {/* Total Contributed */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View>
              <Text style={{ fontSize: 13, color: '#64748b' }}>Total Contributed</Text>
              <Text style={{ fontSize: 28, fontWeight: '800', color: '#0f172a', marginTop: 2 }}>
                {formatCurrency(impact.totalContributedCents / 100)}
              </Text>
            </View>
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="trending-up" size={24} color="#4f46e5" />
            </View>
          </View>
        </Card>

        {/* Detailed Stats */}
        <View style={{ flexDirection: 'row', marginBottom: 16 }}>
          <Card style={{ flex: 1, marginRight: 8 }}>
            <Ionicons name="eye-outline" size={20} color="#3b82f6" />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 4 }}>{formatNumber(impact.totalViews)}</Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Est. Views</Text>
          </Card>
          <Card style={{ flex: 1, marginLeft: 8 }}>
            <Ionicons name="hand-left-outline" size={20} color="#22c55e" />
            <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 4 }}>{formatNumber(impact.totalActions)}</Text>
            <Text style={{ fontSize: 12, color: '#64748b' }}>Est. Actions</Text>
          </Card>
        </View>

        {/* Perception Shift */}
        <Card style={{ marginBottom: 16, backgroundColor: '#f0fdf4' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pulse" size={20} color="#22c55e" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#166534', marginLeft: 8 }}>Perception Shift</Text>
          </View>
          <Text style={{ fontSize: 32, fontWeight: '800', color: '#166534', marginTop: 8 }}>+{impact.estimatedPerceptionShift}%</Text>
          <Text style={{ fontSize: 13, color: '#15803d', marginTop: 4 }}>
            Estimated shift in awareness among target audiences
          </Text>
        </Card>

        {/* Mini Chart */}
        {impact.timeSeries.length > 1 && (
          <Card style={{ marginBottom: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Reach Over Time</Text>
            <Svg width={SCREEN_W - 80} height={120}>
              {impact.timeSeries.map((point, i) => {
                const maxReach = Math.max(...impact.timeSeries.map(p => p.reach));
                const x = (i / (impact.timeSeries.length - 1)) * (SCREEN_W - 100);
                const y = 110 - (point.reach / maxReach) * 100;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && (
                      <Line
                        x1={((i - 1) / (impact.timeSeries.length - 1)) * (SCREEN_W - 100)}
                        y1={110 - (impact.timeSeries[i - 1].reach / maxReach) * 100}
                        x2={x} y2={y}
                        stroke="#4f46e5" strokeWidth={2}
                      />
                    )}
                    <Circle cx={x} cy={y} r={3} fill="#4f46e5" />
                  </React.Fragment>
                );
              })}
            </Svg>
          </Card>
        )}

        {/* Campaign Breakdown */}
        {impact.campaignSummaries.length > 0 && (
          <View>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Campaigns Backed</Text>
            {impact.campaignSummaries.map((cs) => {
              const c = getCampaign(cs.id);
              if (!c) return null;
              return (
                <CampaignCard
                  key={cs.id}
                  campaign={c}
                  onPress={() => navigation.navigate('CampaignImpact', { campaignId: cs.id })}
                  variant="compact"
                />
              );
            })}
          </View>
        )}

        {!hasData && (
          <View style={{ alignItems: 'center', paddingTop: 40 }}>
            <Ionicons name="bar-chart-outline" size={48} color="#94a3b8" />
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#64748b', marginTop: 12 }}>No impact data yet</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4, textAlign: 'center' }}>
              Fund a campaign to start seeing your impact here
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
