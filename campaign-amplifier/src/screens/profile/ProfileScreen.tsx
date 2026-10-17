import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCampaignStore } from '../../store/useCampaignStore';
import { calculateImpact } from '../../services/impact';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { CampaignCard } from '../../components/campaign/CampaignCard';
import { formatCurrency, formatNumber, timeAgo } from '../../utils/formatting';

export function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const getUserContributions = useCampaignStore((s) => s.getUserContributions);
  const getUserCampaigns = useCampaignStore((s) => s.getUserCampaigns);
  const getCampaign = useCampaignStore((s) => s.getCampaign);

  const uid = user?.uid || '';
  const contributions = getUserContributions(uid);
  const myCampaigns = getUserCampaigns(uid);
  const impact = calculateImpact(contributions, (id) => getCampaign(id));

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="person-circle-outline" size={64} color="#94a3b8" />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 16 }}>Sign in to view profile</Text>
        <View style={{ marginTop: 24, width: '100%' }}>
          <Button title="Sign In" onPress={() => navigation.navigate('Auth')} fullWidth />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={{ backgroundColor: '#fff', paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28, fontWeight: '700', color: '#fff' }}>{user.name.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginTop: 12 }}>{user.name}</Text>
          <Text style={{ fontSize: 14, color: '#64748b', marginTop: 2 }}>@{user.username}</Text>
          {user.bio ? <Text style={{ fontSize: 14, color: '#334155', marginTop: 8, textAlign: 'center' }}>{user.bio}</Text> : null}

          {/* Stats */}
          <View style={{ flexDirection: 'row', marginTop: 20, width: '100%' }}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{impact.campaignsBacked}</Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Backed</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{formatNumber(impact.peopleReached)}</Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Reached</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{formatCurrency(impact.totalContributedCents / 100)}</Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Given</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 20, paddingBottom: 100 }}>
          {/* My Campaigns */}
          {myCampaigns.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>My Campaigns</Text>
              {myCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} onPress={() => navigation.navigate('HomeTab', { screen: 'CampaignDetail', params: { campaignId: c.id } })} variant="compact" />
              ))}
            </View>
          )}

          {/* Recent Contributions */}
          {contributions.length > 0 && (
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 12 }}>Recent Contributions</Text>
              {contributions.slice(0, 5).map((c) => {
                const campaign = getCampaign(c.campaignId);
                return (
                  <Card key={c.id} style={{ marginBottom: 8, flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="heart" size={18} color="#4f46e5" />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{campaign?.title || 'Campaign'}</Text>
                      <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{timeAgo(c.created_at)}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#22c55e' }}>{formatCurrency(c.amount_dollars)}</Text>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Menu Items */}
          {[
            { label: 'Edit Profile', icon: 'person-outline', onPress: () => {} },
            { label: 'Settings', icon: 'settings-outline', onPress: () => {} },
            { label: 'Help & Support', icon: 'help-circle-outline', onPress: () => {} },
            { label: 'About', icon: 'information-circle-outline', onPress: () => {} },
          ].map((item) => (
            <TouchableOpacity key={item.label} onPress={item.onPress} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
              <Ionicons name={item.icon as any} size={20} color="#64748b" />
              <Text style={{ flex: 1, fontSize: 15, color: '#334155', marginLeft: 12 }}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
            </TouchableOpacity>
          ))}

          <View style={{ marginTop: 24 }}>
            <Button title="Sign Out" onPress={logout} variant="outline" icon="log-out-outline" fullWidth />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
