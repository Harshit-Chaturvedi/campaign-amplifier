import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StatusBar, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { formatCurrency } from '../../utils/formatting';

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

  const handleFund = () => {
    const cents = customAmount ? Math.round(parseFloat(customAmount) * 100) : amountCents;
    if (cents < 100) { Alert.alert('Minimum', 'Please enter at least $1.'); return; }
    if (!user) { Alert.alert('Sign In', 'Please sign in to fund campaigns.'); return; }

    setLoading(true);
    setTimeout(() => {
      addContribution(campaignId, cents, user.uid, user.name);
      setLoading(false);
      navigation.replace('ThankYou', { campaignId, amount: cents / 100 });
    }, 1000);
  };

  const remaining = campaign.funding_goal - campaign.funding_current;

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ paddingTop: 52, paddingBottom: 12, paddingHorizontal: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9', flexDirection: 'row', alignItems: 'center' }}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a', marginLeft: 12 }}>Fund Campaign</Text>
      </View>

      <View style={{ padding: 20, flex: 1 }}>
        <Card style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }} numberOfLines={2}>{campaign.title}</Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            {formatCurrency(remaining > 0 ? remaining : 0)} still needed to reach goal
          </Text>
        </Card>

        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Select Amount</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 16 }}>
          {AMOUNTS.map((a) => {
            const selected = amountCents === a && !customAmount;
            return (
              <TouchableOpacity key={a} onPress={() => { setAmountCents(a); setCustomAmount(''); }}
                style={{ paddingHorizontal: 18, paddingVertical: 12, borderRadius: 12, marginRight: 8, marginBottom: 8, backgroundColor: selected ? '#4f46e5' : '#fff', borderWidth: 1.5, borderColor: selected ? '#4f46e5' : '#e2e8f0' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: selected ? '#fff' : '#0f172a' }}>${a / 100}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={{ fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 }}>Or enter custom amount</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: customAmount ? '#4f46e5' : '#e2e8f0', borderRadius: 12, paddingHorizontal: 14 }}>
          <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a' }}>$</Text>
          <TextInput
            value={customAmount}
            onChangeText={(t) => { setCustomAmount(t); setAmountCents(0); }}
            placeholder="0.00"
            placeholderTextColor="#94a3b8"
            keyboardType="decimal-pad"
            style={{ flex: 1, fontSize: 20, fontWeight: '700', color: '#0f172a', paddingVertical: 14, marginLeft: 4 }}
          />
        </View>

        {/* Impact Preview */}
        <Card style={{ marginTop: 20, backgroundColor: '#eef2ff' }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#3730a3', marginBottom: 8 }}>Your impact</Text>
          <View style={{ flexDirection: 'row' }}>
            {[
              { label: 'People reached', value: Math.round((customAmount ? parseFloat(customAmount) : amountCents / 100) * 27) },
              { label: 'Est. views', value: Math.round((customAmount ? parseFloat(customAmount) : amountCents / 100) * 27 * 1.6) },
            ].map((s) => (
              <View key={s.label} style={{ flex: 1 }}>
                <Text style={{ fontSize: 22, fontWeight: '800', color: '#3730a3' }}>{s.value.toLocaleString()}</Text>
                <Text style={{ fontSize: 12, color: '#6366f1' }}>{s.label}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      <View style={{ padding: 16, paddingBottom: 32, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
        <Button
          title={`Fund ${formatCurrency(customAmount ? parseFloat(customAmount) || 0 : amountCents / 100)}`}
          onPress={handleFund}
          loading={loading}
          icon="heart"
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
  const reach = Math.round(amount * 27);

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <StatusBar barStyle="dark-content" />
      <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
        <Ionicons name="checkmark-circle" size={48} color="#22c55e" />
      </View>
      <Text style={{ fontSize: 26, fontWeight: '800', color: '#0f172a', textAlign: 'center' }}>Thank you!</Text>
      <Text style={{ fontSize: 16, color: '#64748b', textAlign: 'center', marginTop: 8, lineHeight: 24 }}>
        Your ${amount} contribution will help reach approximately {reach.toLocaleString()} people.
      </Text>
      {campaign && (
        <Card style={{ marginTop: 24, width: '100%' }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#0f172a' }}>{campaign.title}</Text>
          <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Now {campaign.percent_funded}% funded
          </Text>
        </Card>
      )}
      <View style={{ marginTop: 32, width: '100%' }}>
        <Button title="View Campaign" onPress={() => navigation.navigate('Home')} icon="arrow-forward" iconPosition="right" fullWidth />
        <View style={{ height: 12 }} />
        <Button title="Share with friends" onPress={() => {}} variant="outline" icon="share-social-outline" fullWidth />
      </View>
    </View>
  );
}
