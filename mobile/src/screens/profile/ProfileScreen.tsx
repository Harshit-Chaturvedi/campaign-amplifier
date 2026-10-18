import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useDraftStore } from '../../store/useDraftStore';
import { useMyCampaigns } from '../../api/hooks';
import { calculateImpact } from '../../services/impact';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { formatCurrency, formatNumber, timeAgo } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';
import type { Campaign } from '../../types/campaign';

type FilterTab = 'all' | 'under_review' | 'published' | 'drafts';

export function ProfileScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const getUserContributions = useCampaignStore((s) => s.getUserContributions);
  const getCampaign = useCampaignStore((s) => s.getCampaign);
  const localDrafts = useDraftStore((s) => s.getAllDrafts());

  const [activeTab, setActiveTab] = useState<FilterTab>('all');

  const { data: myCampaignsData, isLoading: loadingCampaigns, refetch } = useMyCampaigns();

  const uid = user?.uid || '';
  const contributions = getUserContributions(uid);
  const impact = calculateImpact(contributions, (id) => getCampaign(id));

  // Merge server campaigns with local drafts
  const serverCampaigns = myCampaignsData?.items || [];

  // Convert local drafts that might not yet be in server response
  const mergedCampaigns: any[] = [...serverCampaigns];
  localDrafts.forEach((ld) => {
    const exists = mergedCampaigns.some((c) => c.id === ld.id);
    if (!exists) {
      mergedCampaigns.push({
        id: ld.id,
        title: ld.title || 'Untitled Draft',
        category: ld.category || 'community',
        creatorName: ld.creatorName || user?.name || 'Organizer',
        creatorType: 'individual',
        summary: ld.summary || '',
        coverUrl: ld.coverUrl || '',
        status: ld.step === 5 && ld.fundingGoal ? 'submitted' : 'draft',
        fundingGoal: ld.fundingGoal || 1000,
        amountRaised: 0,
        percentFunded: 0,
        backerCount: 0,
        durationDays: ld.durationDays || 30,
        createdAt: ld.updatedAt || new Date().toISOString(),
      });
    }
  });

  // Filter campaigns by selected tab
  const filteredCampaigns = mergedCampaigns.filter((c) => {
    if (activeTab === 'under_review') {
      return c.status === 'submitted' || c.status === 'changes_requested';
    }
    if (activeTab === 'published') {
      return (
        c.status === 'approved' ||
        c.status === 'funding' ||
        c.status === 'funded' ||
        c.status === 'promoting' ||
        c.status === 'completed'
      );
    }
    if (activeTab === 'drafts') {
      return c.status === 'draft';
    }
    return true; // 'all'
  });

  const underReviewCount = mergedCampaigns.filter(
    (c) => c.status === 'submitted' || c.status === 'changes_requested'
  ).length;

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
        <Ionicons name="person-circle-outline" size={64} color="#94a3b8" />
        <Text style={{ fontSize: 20, fontWeight: '700', color: '#0f172a', marginTop: 16 }}>Sign in to view profile</Text>
        <Text style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginTop: 8, marginBottom: 24, lineHeight: 20 }}>
          Sign in or create an account to start your own campaigns, track your amplification, and follow updates.
        </Text>
        <View style={{ width: '100%' }}>
          <Button title="Sign In" onPress={() => navigation.navigate('Auth', { screen: 'Login' })} fullWidth />
          <View style={{ marginTop: 12 }}>
            <Button title="Create Account" onPress={() => navigation.navigate('Auth', { screen: 'Register' })} variant="outline" fullWidth />
          </View>
        </View>
      </View>
    );
  }

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Ionicons name="time" size={13} color="#d97706" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#b45309', textTransform: 'uppercase' }}>
              Under Review
            </Text>
          </View>
        );
      case 'changes_requested':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffedd5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Ionicons name="alert-circle" size={13} color="#ea580c" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#c2410c', textTransform: 'uppercase' }}>
              Changes Requested
            </Text>
          </View>
        );
      case 'approved':
      case 'funding':
      case 'promoting':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Ionicons name="checkmark-circle" size={13} color="#16a34a" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#15803d', textTransform: 'uppercase' }}>
              {status === 'approved' ? 'Approved' : 'Active'}
            </Text>
          </View>
        );
      case 'completed':
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#e2e8f0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Ionicons name="flag" size={13} color="#475569" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155', textTransform: 'uppercase' }}>
              Completed
            </Text>
          </View>
        );
      default:
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
            <Ionicons name="document-text-outline" size={13} color="#64748b" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569', textTransform: 'uppercase' }}>
              Draft
            </Text>
          </View>
        );
    }
  };

  const handleCampaignAction = (campaign: any) => {
    if (campaign.status === 'draft' || campaign.status === 'changes_requested') {
      navigation.navigate('CreateTab', {
        screen: 'CreateFlow',
        params: { draftId: campaign.id, step: campaign.draftStep || 1 },
      });
    } else if (campaign.status === 'submitted') {
      Alert.alert(
        'Campaign Under Review',
        `"${campaign.title}"\n\nContent, sources, creative and targeting reviewed. You will receive an in-app notification when the review decision is finalized.`,
        [{ text: 'OK' }]
      );
    } else {
      navigation.navigate('HomeTab', {
        screen: 'CampaignDetail',
        params: { campaignId: campaign.id },
      });
    }
  };

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
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{mergedCampaigns.length}</Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Created</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{underReviewCount}</Text>
              <Text style={{ fontSize: 12, color: '#b45309', fontWeight: '700' }}>In Review</Text>
            </View>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a' }}>{impact.campaignsBacked}</Text>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Backed</Text>
            </View>
          </View>
        </View>

        <View style={{ padding: 20, paddingBottom: 100 }}>
          {/* SECTION: CREATED CAMPAIGNS */}
          <View style={{ marginBottom: 28 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                Created Campaigns
              </Text>
              <TouchableOpacity onPress={() => refetch()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="refresh" size={18} color="#4f46e5" />
              </TouchableOpacity>
            </View>

            {/* Filter Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {[
                  { key: 'all' as FilterTab, label: `All (${mergedCampaigns.length})` },
                  { key: 'under_review' as FilterTab, label: `Under Review (${underReviewCount})` },
                  { key: 'published' as FilterTab, label: 'Published' },
                  { key: 'drafts' as FilterTab, label: 'Drafts' },
                ].map((tab) => {
                  const isSelected = activeTab === tab.key;
                  return (
                    <TouchableOpacity
                      key={tab.key}
                      onPress={() => setActiveTab(tab.key)}
                      style={{
                        paddingHorizontal: 12,
                        paddingVertical: 6,
                        borderRadius: 20,
                        backgroundColor: isSelected ? '#4f46e5' : '#ffffff',
                        borderWidth: 1,
                        borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 12,
                          fontWeight: isSelected ? '700' : '500',
                          color: isSelected ? '#ffffff' : '#475569',
                        }}
                      >
                        {tab.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            {/* Campaign Cards List */}
            {loadingCampaigns ? (
              <View style={{ paddingVertical: 24, alignItems: 'center' }}>
                <ActivityIndicator size="small" color="#4f46e5" />
              </View>
            ) : filteredCampaigns.length === 0 ? (
              <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#e2e8f0' }}>
                <Ionicons name="folder-open-outline" size={36} color="#94a3b8" />
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#64748b', marginTop: 8 }}>
                  No campaigns in this view
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('CreateTab')}
                  style={{ marginTop: 12, paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#eef2ff', borderRadius: 8 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#4f46e5' }}>+ Start a Campaign</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredCampaigns.map((camp) => (
                <TouchableOpacity
                  key={camp.id}
                  onPress={() => handleCampaignAction(camp)}
                  activeOpacity={0.75}
                  style={{
                    backgroundColor: '#ffffff',
                    borderRadius: 14,
                    padding: 16,
                    borderWidth: 1,
                    borderColor: camp.status === 'submitted' ? '#fcd34d' : '#e2e8f0',
                    marginBottom: 12,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: getCategoryColor(camp.category), textTransform: 'uppercase' }}>
                      {camp.category}
                    </Text>
                    {renderStatusBadge(camp.status)}
                  </View>

                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 }} numberOfLines={2}>
                    {camp.title}
                  </Text>

                  {/* Under Review Notice Banner */}
                  {camp.status === 'submitted' && (
                    <View
                      style={{
                        backgroundColor: '#fffbeb',
                        padding: 10,
                        borderRadius: 8,
                        borderWidth: 1,
                        borderColor: '#fef3c7',
                        marginTop: 4,
                        marginBottom: 10,
                      }}
                    >
                      <Text style={{ fontSize: 12, color: '#92400e', lineHeight: 16 }}>
                        Content, sources, creative and targeting reviewed. Your campaign is queued for editorial approval.
                      </Text>
                    </View>
                  )}

                  <View style={{ marginTop: 6 }}>
                    <ProgressBar
                      progress={camp.percentFunded ?? (camp.fundingGoal ? Math.round(((camp.amountRaised || 0) / camp.fundingGoal) * 100) : 0)}
                      color={camp.status === 'submitted' ? '#f59e0b' : '#4f46e5'}
                      height={5}
                    />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                      <Text style={{ fontSize: 13, fontWeight: '700', color: '#334155' }}>
                        {formatCurrency(camp.amountRaised || 0)} raised
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>
                        Goal: {formatCurrency(camp.fundingGoal || 0)}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>

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
                      <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>{timeAgo(c.createdAt)}</Text>
                    </View>
                    <Text style={{ fontSize: 15, fontWeight: '700', color: '#22c55e' }}>{formatCurrency(c.amount)}</Text>
                  </Card>
                );
              })}
            </View>
          )}

          {/* Settings & Info */}
          <View style={{ marginTop: 8 }}>
            {[
              { label: 'Edit Profile', icon: 'person-outline', onPress: () => {} },
              { label: 'Settings', icon: 'settings-outline', onPress: () => {} },
              { label: 'Help & Support', icon: 'help-circle-outline', onPress: () => {} },
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
        </View>
      </ScrollView>
    </View>
  );
}
