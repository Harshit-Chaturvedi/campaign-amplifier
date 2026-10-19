import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Share,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useDraftStore } from '../../store/useDraftStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatting';
import { apiClient } from '../../api/client';

export type CreatorTab =
  | 'drafts'
  | 'under_review'
  | 'published'
  | 'promoting'
  | 'completed'
  | 'requires_action';

export function CreatorDashboardScreen({ route, navigation }: any) {
  const initialTab = (route?.params?.initialTab as CreatorTab) || 'published';
  const [activeTab, setActiveTab] = useState<CreatorTab>(initialTab);

  const user = useAuthStore((s) => s.user);
  const draftsMap = useDraftStore((s) => s.drafts);
  const drafts = useMemo(() => {
    return Object.values(draftsMap).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [draftsMap]);
  const deleteDraft = useDraftStore((s) => s.deleteDraft);
  const storeCampaigns = useCampaignStore((s) => s.campaigns);
  const transitionCampaign = useCampaignStore((s) => s.transitionCampaign);

  const [loading, setLoading] = useState(false);
  const [remoteCampaigns, setRemoteCampaigns] = useState<any[]>([]);

  // Post update modal state
  const [updateModalCampaignId, setUpdateModalCampaignId] = useState<string | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadCampaigns() {
      try {
        setLoading(true);
        const res = await apiClient.getMyCampaigns();
        if (isMounted && res.items && res.items.length > 0) {
          setRemoteCampaigns(res.items);
        }
      } catch {
        // Fallback to store
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadCampaigns();
    return () => {
      isMounted = false;
    };
  }, []);

  // Merge store campaigns and remote campaigns
  const allCampaigns = remoteCampaigns.length > 0 ? remoteCampaigns : storeCampaigns;

  // Filter campaigns by active tab
  const campaignsInTab = useMemo(() => {
    switch (activeTab) {
      case 'drafts':
        return []; // Rendered from drafts store below
      case 'under_review':
        return allCampaigns.filter((c) =>
          ['submitted', 'in_review', 'under_review'].includes(c.status)
        );
      case 'published':
        return allCampaigns.filter((c) =>
          ['approved', 'available_for_funding', 'goal_reached'].includes(c.status)
        );
      case 'promoting':
        return allCampaigns.filter((c) =>
          ['distribution_preparation', 'promoting'].includes(c.status)
        );
      case 'completed':
        return allCampaigns.filter((c) => c.status === 'completed');
      case 'requires_action':
        return allCampaigns.filter((c) =>
          ['changes_requested', 'rejected', 'failed', 'cancelled'].includes(c.status)
        );
      default:
        return allCampaigns;
    }
  }, [activeTab, allCampaigns]);

  // Handle posting creator update
  const handlePostUpdate = async () => {
    if (!updateTitle.trim() || !updateBody.trim()) {
      Alert.alert('Incomplete Update', 'Please provide a title and update message.');
      return;
    }

    if (!updateModalCampaignId) return;

    setSubmittingUpdate(true);
    try {
      await apiClient.postCampaignUpdate(updateModalCampaignId, updateTitle, updateBody);
      setSubmittingUpdate(false);
      setUpdateModalCampaignId(null);
      setUpdateTitle('');
      setUpdateBody('');
      Alert.alert('Update Posted', 'Your campaign update has been broadcast to all supporters.');
    } catch (err: any) {
      setSubmittingUpdate(false);
      Alert.alert('Error', err.message || 'Unable to post update.');
    }
  };

  // Handle editing published campaign (sends material changes back to review!)
  const handleEditPublishedCampaign = (camp: any) => {
    Alert.alert(
      'Material Changes Require Re-review',
      'Editing an active campaign sends modified copy and assets back to the editorial desk for review before updated ads can run. Do you want to continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Edit & Send to Review',
          onPress: () => {
            transitionCampaign(camp.id, 'changes_requested', 'creator', 'Creator initiated revisions.');
            navigation.navigate('CreateFlow', { draftId: camp.id, step: 1 });
          },
        },
      ]
    );
  };

  // Handle resubmit for changes requested
  const handleResubmitChanges = async (camp: any) => {
    try {
      await apiClient.respondToReview(camp.id);
      transitionCampaign(camp.id, 'submitted', 'creator', 'Creator addressed requested changes.');
      Alert.alert('Re-submitted', 'Your revised campaign has been re-submitted for review.');
    } catch {
      transitionCampaign(camp.id, 'submitted', 'creator', 'Creator addressed requested changes.');
      Alert.alert('Re-submitted', 'Your revised campaign has been re-submitted for review.');
    }
  };

  const tabOptions: { key: CreatorTab; label: string; count?: number }[] = [
    { key: 'published', label: 'Funding', count: allCampaigns.filter((c) => ['approved', 'available_for_funding', 'goal_reached'].includes(c.status)).length },
    { key: 'under_review', label: 'Review', count: allCampaigns.filter((c) => ['submitted', 'in_review'].includes(c.status)).length },
    { key: 'promoting', label: 'Promoting', count: allCampaigns.filter((c) => ['distribution_preparation', 'promoting'].includes(c.status)).length },
    { key: 'completed', label: 'Completed', count: allCampaigns.filter((c) => c.status === 'completed').length },
    { key: 'requires_action', label: 'Action Needed', count: allCampaigns.filter((c) => ['changes_requested', 'rejected'].includes(c.status)).length },
    { key: 'drafts', label: 'Drafts', count: drafts.length },
  ];

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
          Creator Dashboard
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Create new campaign"
          onPress={() => navigation.navigate('CreateTab')}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: '#eef2ff',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={24} color="#4f46e5" />
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Tabs */}
      <View style={{ backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10, gap: 8 }}
        >
          {tabOptions.map((t) => {
            const active = activeTab === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setActiveTab(t.key)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  borderRadius: 12,
                  backgroundColor: active ? '#4f46e5' : '#f1f5f9',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? '700' : '600',
                    color: active ? '#ffffff' : '#475569',
                  }}
                >
                  {t.label}
                </Text>
                {t.count !== undefined && t.count > 0 && (
                  <View
                    style={{
                      backgroundColor: active ? '#6366f1' : '#e2e8f0',
                      paddingHorizontal: 6,
                      paddingVertical: 1,
                      borderRadius: 10,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 11,
                        fontWeight: '700',
                        color: active ? '#ffffff' : '#475569',
                      }}
                    >
                      {t.count}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 80 }} showsVerticalScrollIndicator={false}>
        {/* Loading Indicator */}
        {loading && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#4f46e5" />
          </View>
        )}

        {/* ========================================================================= */}
        {/* DRAFTS TAB                                                                */}
        {/* ========================================================================= */}
        {activeTab === 'drafts' && (
          <View>
            {drafts.length > 0 ? (
              drafts.map((d) => (
                <Card key={d.id} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#6366f1', textTransform: 'uppercase' }}>
                      Step {d.step} of 5 • {d.category}
                    </Text>
                    {d.isDemoSample && <DemoDataBadge size="sm" />}
                  </View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
                    {d.title || 'Untitled Draft'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 14 }}>
                    Last saved: {formatDate(d.updatedAt)}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 2 }}>
                      <Button
                        title="Resume Editing"
                        onPress={() => navigation.navigate('CreateFlow', { draftId: d.id, step: d.step })}
                        size="sm"
                        icon="create-outline"
                        fullWidth
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        title="Delete"
                        variant="outline"
                        onPress={() => {
                          Alert.alert('Delete Draft', 'Are you sure you want to delete this draft?', [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Delete', style: 'destructive', onPress: () => deleteDraft(d.id) },
                          ]);
                        }}
                        size="sm"
                        fullWidth
                      />
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="document-text-outline" size={44} color="#94a3b8" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12 }}>
                  No Saved Drafts
                </Text>
                <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
                  You don't have any in-progress campaign drafts.
                </Text>
                <Button
                  title="Start a New Campaign"
                  onPress={() => navigation.navigate('CreateTab')}
                  icon="add-circle-outline"
                />
              </View>
            )}
          </View>
        )}

        {/* ========================================================================= */}
        {/* OTHER LIFECYCLE TABS                                                      */}
        {/* ========================================================================= */}
        {activeTab !== 'drafts' && (
          <View>
            {campaignsInTab.length > 0 ? (
              campaignsInTab.map((camp) => (
                <Card key={camp.id} style={{ marginBottom: 16 }}>
                  {/* Thumbnail / Header */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    <Image
                      source={{ uri: camp.coverUrl || camp.thumbnailUrl || 'https://images.unsplash.com/photo-1577495508048-b635879837f1?w=400&q=80' }}
                      style={{ width: 80, height: 80, borderRadius: 10, backgroundColor: '#f1f5f9' }}
                      resizeMode="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <StatusBadge status={camp.status} />
                        <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                          {camp.durationDays || 30}d window
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }} numberOfLines={2}>
                        {camp.title}
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                        Est. Reach: ~{formatNumber(camp.estimatedReachAtGoal || 150000)} (Estimate)
                      </Text>
                    </View>
                  </View>

                  {/* Progress info */}
                  <View style={{ marginBottom: 12 }}>
                    <ProgressBar progress={camp.percentFunded || 0} color="#4f46e5" height={6} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#4f46e5' }}>
                        {formatCurrency(camp.amountRaised || 0)} raised ({camp.percentFunded || 0}%)
                      </Text>
                      <Text style={{ fontSize: 12, color: '#64748b' }}>
                        Goal: {formatCurrency(camp.fundingGoal || 5000)}
                      </Text>
                    </View>
                  </View>

                  {/* Moderation Feedback if requires_action */}
                  {camp.status === 'changes_requested' && (
                    <View
                      style={{
                        backgroundColor: '#fffbeb',
                        borderColor: '#fde68a',
                        borderWidth: 1,
                        borderRadius: 10,
                        padding: 10,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                        <Ionicons name="chatbubble-ellipses-outline" size={16} color="#b45309" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#92400e' }}>
                          Editorial Review Feedback:
                        </Text>
                      </View>
                      <Text style={{ fontSize: 12, color: '#92400e', lineHeight: 16 }}>
                        {camp.moderationFeedback ||
                          'Please provide an official government or municipal source citation for the claims made in paragraphs 2 and 3.'}
                      </Text>
                    </View>
                  )}

                  {/* Contextual Action Buttons */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {/* Requires action: Edit & Resubmit */}
                    {camp.status === 'changes_requested' && (
                      <Button
                        title="Edit & Resubmit"
                        onPress={() => handleResubmitChanges(camp)}
                        size="sm"
                        variant="primary"
                        icon="arrow-up-circle-outline"
                      />
                    )}

                    {/* Under review: Preview */}
                    {['submitted', 'in_review'].includes(camp.status) && (
                      <Button
                        title="Preview Campaign"
                        onPress={() => navigation.navigate('CampaignDetail', { campaignId: camp.id })}
                        size="sm"
                        variant="outline"
                        icon="eye-outline"
                      />
                    )}

                    {/* Published / Funding: Share, Post Update, Edit */}
                    {['approved', 'available_for_funding', 'goal_reached'].includes(camp.status) && (
                      <>
                        <Button
                          title="Post an Update"
                          onPress={() => setUpdateModalCampaignId(camp.id)}
                          size="sm"
                          variant="primary"
                          icon="megaphone-outline"
                        />
                        <Button
                          title="Public Page"
                          onPress={() => navigation.navigate('CampaignDetail', { campaignId: camp.id })}
                          size="sm"
                          variant="outline"
                          icon="open-outline"
                        />
                        <Button
                          title="Edit"
                          onPress={() => handleEditPublishedCampaign(camp)}
                          size="sm"
                          variant="ghost"
                          icon="create-outline"
                        />
                      </>
                    )}

                    {/* Promoting or Completed: View Distribution Report */}
                    {['distribution_preparation', 'promoting', 'completed'].includes(camp.status) && (
                      <Button
                        title="View Distribution Report"
                        onPress={() => navigation.navigate('Report', { campaignId: camp.id })}
                        size="sm"
                        variant="primary"
                        icon="document-text-outline"
                      />
                    )}
                  </View>
                </Card>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="folder-open-outline" size={44} color="#94a3b8" />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12 }}>
                  No Campaigns in this Category
                </Text>
                <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
                  No campaigns currently match the '{activeTab.replace(/_/g, ' ')}' status filter.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Post Campaign Update Modal */}
      <Modal
        visible={!!updateModalCampaignId}
        animationType="slide"
        transparent
        onRequestClose={() => setUpdateModalCampaignId(null)}
      >
        <KeyboardAvoidingView
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                Post Campaign Update
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close update modal"
                onPress={() => setUpdateModalCampaignId(null)}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 14 }}>
              Broadcast milestone progress, press coverage, or municipal reactions to all supporters.
            </Text>

            <TextInput
              accessibilityLabel="Campaign update title"
              value={updateTitle}
              onChangeText={setUpdateTitle}
              placeholder="Update Title (e.g. City Council schedules committee review)"
              placeholderTextColor="#94a3b8"
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1.5,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: '#0f172a',
                marginBottom: 12,
              }}
            />

            <TextInput
              accessibilityLabel="Campaign update body text"
              value={updateBody}
              onChangeText={setUpdateBody}
              placeholder="Write your update message..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: '#f8fafc',
                borderWidth: 1.5,
                borderColor: '#e2e8f0',
                borderRadius: 12,
                padding: 12,
                fontSize: 14,
                color: '#0f172a',
                height: 100,
                textAlignVertical: 'top',
                marginBottom: 20,
              }}
            />

            <Button
              title="Publish Update"
              onPress={handlePostUpdate}
              loading={submittingUpdate}
              variant="primary"
              fullWidth
              size="lg"
            />
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
