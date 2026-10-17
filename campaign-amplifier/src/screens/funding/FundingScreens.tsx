import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, ScrollView, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCurrency, formatNumber } from '../../utils/formatting';
import { AmplificationNotice } from '../../components/campaign/AmplificationNotice';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { demoConfig } from '../../config/demoConfig';
import { estimateReach, calculateBackerFee } from '../../services/reach';

export function FundCampaignScreen({ route, navigation }: any) {
  const { campaignId } = route.params;
  const campaign = useCampaignStore((s) => s.getCampaign(campaignId));
  const addContribution = useCampaignStore((s) => s.addContribution);
  const user = useAuthStore((s) => s.user);

  const [selectedPreset, setSelectedPreset] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState('');
  const [showName, setShowName] = useState(false); // default OFF per brief
  const [guestEmail, setGuestEmail] = useState('');
  const [loading, setLoading] = useState(false);

  if (!campaign) return null;

  const dollars = customAmount ? parseFloat(customAmount) || 0 : selectedPreset;
  const { fee, total } = calculateBackerFee(dollars);
  const reachCalc = estimateReach(dollars);
  const remaining = Math.max(0, campaign.fundingGoal - campaign.amountRaised);

  const handleFund = () => {
    if (dollars < 1) {
      Alert.alert('Invalid Amount', 'Minimum backer contribution is $1.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const contribution = addContribution({
        campaignId,
        amount: dollars,
        userId: user?.uid,
        backerName: user?.name || 'Community Backer',
        showName,
        guestEmail: user?.email || guestEmail || null,
      });

      setLoading(false);
      navigation.replace('ThankYou', {
        campaignId,
        amount: dollars,
        receiptNo: contribution.receiptNo,
        estimatedReach: contribution.estimatedReach,
      });
    }, 800);
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />
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
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginLeft: 12 }}>
          Back This Campaign
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {formatCurrency(remaining)} needed to reach full advertising distribution goal
          </Text>
        </Card>

        {/* Amplification Notice */}
        <View style={{ marginBottom: 20 }}>
          <AmplificationNotice compact />
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>
          Choose Contribution
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {demoConfig.presetAmounts.map((preset) => {
            const selected = selectedPreset === preset && !customAmount;
            return (
              <TouchableOpacity
                key={preset}
                onPress={() => {
                  setSelectedPreset(preset);
                  setCustomAmount('');
                }}
                style={{
                  paddingHorizontal: 18,
                  paddingVertical: 12,
                  borderRadius: 12,
                  marginRight: 8,
                  marginBottom: 8,
                  backgroundColor: selected ? '#4f46e5' : '#fff',
                  borderWidth: 1.5,
                  borderColor: selected ? '#4f46e5' : '#e2e8f0',
                }}
              >
                <Text style={{ fontSize: 15, fontWeight: '700', color: selected ? '#fff' : '#0f172a' }}>
                  ${preset}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 }}>
          Or enter a custom amount
        </Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fff',
            borderWidth: 1.5,
            borderColor: customAmount ? '#4f46e5' : '#e2e8f0',
            borderRadius: 12,
            paddingHorizontal: 14,
          }}
        >
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>$</Text>
          <TextInput
            value={customAmount}
            onChangeText={(t) => {
              setCustomAmount(t);
              setSelectedPreset(0);
            }}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            style={{ flex: 1, fontSize: 20, fontWeight: '700', color: '#0f172a', paddingVertical: 14, marginLeft: 4 }}
          />
        </View>

        {/* Estimated Reach Preview */}
        <Card style={{ marginTop: 20, backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#3730a3' }}>Estimated Message Amplification</Text>
            <DemoDataBadge size="sm" />
          </View>
          <View style={{ flexDirection: 'row', marginTop: 4 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#312e81' }}>{formatNumber(reachCalc.estimate)}</Text>
              <Text style={{ fontSize: 12, color: '#6366f1' }}>Est. audience reach</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#312e81' }}>{formatNumber(reachCalc.impressions)}</Text>
              <Text style={{ fontSize: 12, color: '#6366f1' }}>Est. ad impressions</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: '#6366f1', marginTop: 10 }}>
            Estimate based on ${demoConfig.cpmUsd} CPM and {demoConfig.avgFrequency}x frequency. Not a delivery guarantee.
          </Text>
        </Card>

        {/* Breakdown of Total */}
        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ fontSize: 14, color: '#64748b' }}>Contribution</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{formatCurrency(dollars)}</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
            <Text style={{ fontSize: 14, color: '#64748b' }}>Payment Processing Fee</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{formatCurrency(fee)}</Text>
          </View>
          <View style={{ height: 1, backgroundColor: '#f1f5f9', marginVertical: 8 }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>Total Payment</Text>
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#4f46e5' }}>{formatCurrency(total)}</Text>
          </View>
        </Card>

        {/* Backer Privacy Option (Default OFF per Brief) */}
        <Card style={{ marginTop: 16 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flex: 1, marginRight: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>Show my name publicly</Text>
              <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                Private by default. Turn on to display your name on the campaign backers list.
              </Text>
            </View>
            <Switch value={showName} onValueChange={setShowName} trackColor={{ false: '#cbd5e1', true: '#4f46e5' }} />
          </View>
        </Card>
      </ScrollView>

      {/* Sticky Bottom Action */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: 16,
          paddingBottom: 32,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
        }}
      >
        <Button
          title={`Back with ${formatCurrency(dollars)}`}
          onPress={handleFund}
          loading={loading}
          icon="megaphone"
          fullWidth
          size="lg"
        />
      </View>
    </View>
  );
}

export function ThankYouScreen({ route, navigation }: any) {
  const { campaignId, amount, receiptNo, estimatedReach } = route.params;
  const campaign = useCampaignStore((s) => s.getCampaign(campaignId));

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <StatusBar barStyle="dark-content" />
      <View
        style={{
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: '#dcfce7',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
        }}
      >
        <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>
        Thank you for amplifying!
      </Text>
      <Text style={{ fontSize: 15, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 22 }}>
        Your ${amount} contribution will pay for ad distribution reaching an estimated{' '}
        <Text style={{ fontWeight: '700', color: '#0f172a' }}>{formatNumber(estimatedReach || 0)} people</Text>.
      </Text>
      <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
        (Configured demo estimate, not a guaranteed delivery)
      </Text>

      {receiptNo && (
        <View style={{ backgroundColor: '#f1f5f9', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 16 }}>
          <Text style={{ fontSize: 12, fontWeight: '600', color: '#475569' }}>
            Receipt #{receiptNo}
          </Text>
        </View>
      )}

      {campaign && (
        <Card style={{ marginTop: 24, width: '100%' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{campaign.title}</Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Now {campaign.percentFunded}% funded toward distribution goal
          </Text>
        </Card>
      )}

      <View style={{ marginTop: 28, width: '100%' }}>
        <Button
          title="Return to Campaign"
          onPress={() => navigation.navigate('Home')}
          icon="arrow-forward"
          iconPosition="right"
          fullWidth
        />
        <View style={{ height: 12 }} />
        <Button
          title="View in Activity"
          onPress={() => navigation.navigate('ActivityTab')}
          variant="outline"
          icon="notifications-outline"
          fullWidth
        />
      </View>
    </View>
  );
}
