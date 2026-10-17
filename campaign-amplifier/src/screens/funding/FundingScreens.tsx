import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatting';
import { AmplificationNotice } from '../../components/campaign/AmplificationNotice';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';

const AMOUNTS = [500, 1000, 2500, 5000, 10000];

export function FundCampaignScreen({ route, navigation }: any) {
  const { campaignId } = route.params;
  const campaign = useCampaignStore((s) => s.getCampaign(campaignId));
  const addContribution = useCampaignStore((s) => s.addContribution);
  const user = useAuthStore((s) => s.user);
  const [amountCents, setAmountCents] = useState(2500);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  if (!campaign) return null;

  const currentCents = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountCents;
  const dollars = currentCents > 0 ? currentCents / 100 : 0;
  const estReach = Math.round(dollars * 27);
  const estViews = Math.round(dollars * 27 * 1.6);

  const handleFund = () => {
    if (currentCents < 100) {
      Alert.alert('Minimum Amount', 'Please enter at least $1.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const backerUid = user?.uid || 'guest-' + Date.now().toString(36);
      const backerName = user?.name || 'Community Backer';
      addContribution(campaignId, currentCents, backerUid, backerName);
      setLoading(false);
      navigation.replace('ThankYou', { campaignId, amount: dollars });
    }, 900);
  };

  const remaining = campaign.funding_goal - campaign.funding_current;

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

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 110 }} showsVerticalScrollIndicator={false}>
        <Card style={{ marginBottom: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }} numberOfLines={2}>
            {campaign.title}
          </Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {formatCurrency(remaining > 0 ? remaining : 0)} still needed to reach full distribution goal
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
          {AMOUNTS.map((a) => {
            const selected = amountCents === a && !customAmount;
            return (
              <TouchableOpacity
                key={a}
                onPress={() => {
                  setAmountCents(a);
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
                  ${a / 100}
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
              setAmountCents(0);
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
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#312e81' }}>{estReach.toLocaleString()}</Text>
              <Text style={{ fontSize: 12, color: '#6366f1' }}>Est. audience reach</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 24, fontWeight: '800', color: '#312e81' }}>{estViews.toLocaleString()}</Text>
              <Text style={{ fontSize: 12, color: '#6366f1' }}>Est. ad impressions</Text>
            </View>
          </View>
          <Text style={{ fontSize: 11, color: '#6366f1', marginTop: 10 }}>
            Estimate based on $0.037 per unique targeted reach. Actual reach depends on auction prices and ad delivery.
          </Text>
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
  const { campaignId, amount } = route.params;
  const campaign = useCampaignStore((s) => s.getCampaign(campaignId));
  const estReach = Math.round(amount * 27);

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
        Your ${amount} contribution will help distribute this message to an estimated{' '}
        <Text style={{ fontWeight: '700', color: '#0f172a' }}>{estReach.toLocaleString()} people</Text>.
      </Text>
      <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
        (Configured demo estimate, not a guaranteed delivery)
      </Text>

      {campaign && (
        <Card style={{ marginTop: 24, width: '100%' }}>
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{campaign.title}</Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Now {campaign.percent_funded}% toward funding distribution
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
