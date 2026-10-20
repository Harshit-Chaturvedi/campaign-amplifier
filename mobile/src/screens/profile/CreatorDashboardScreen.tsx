import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { GeneratedCover } from '../../components/ui/GeneratedCover';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useDraftStore } from '../../store/useDraftStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatting';
import { apiClient } from '../../api/client';
import { getCoverUrl } from '../../utils/media';
import { colors, fonts, tokens } from '../../theme/tokens';
import { filterAndBucketCreatorCampaigns } from '../../hooks/useCreatorCampaigns';

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

  useEffect(() => {
    if (route?.params?.initialTab) {
      setActiveTab(route.params.initialTab as CreatorTab);
    }
  }, [route?.params?.initialTab]);

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
  const [remoteCampaigns, setRemoteCampaigns] = useState<any[] | null>(null);

  // Post update modal state
  const [updateModalCampaignId, setUpdateModalCampaignId] = useState<string | null>(null);
  const [updateTitle, setUpdateTitle] = useState('');
  const [updateBody, setUpdateBody] = useState('');
  const [submittingUpdate, setSubmittingUpdate] = useState(false);

  // In-app editorial re-review notice modal state
  const [editNoticeCampaign, setEditNoticeCampaign] = useState<any | null>(null);

  const loadCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.getMyCampaigns();
      setRemoteCampaigns(res.items || []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCampaigns();
    }, [loadCampaigns])
  );

  // Derived user-owned campaigns from shared selector
  const buckets = useMemo(() => {
    const rawList = remoteCampaigns !== null ? remoteCampaigns : storeCampaigns;
    return filterAndBucketCreatorCampaigns(rawList, user?.uid, drafts);
  }, [remoteCampaigns, storeCampaigns, user?.uid, drafts]);

  // Filter campaigns by active tab
  const campaignsInTab = useMemo(() => {
    switch (activeTab) {
      case 'drafts':
        return []; // Rendered from drafts store
      case 'under_review':
        return buckets.under_review;
      case 'published':
        return buckets.published;
      case 'promoting':
        return buckets.promoting;
      case 'completed':
        return buckets.completed;
      case 'requires_action':
        return buckets.requires_action;
      default:
        return buckets.all;
    }
  }, [activeTab, buckets]);

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

  // Modal notice for editing published campaigns
  const handleEditPublishedCampaign = (camp: any) => {
    setEditNoticeCampaign(camp);
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
    { key: 'published', label: 'Funding', count: buckets.counts.published },
    { key: 'under_review', label: 'Review', count: buckets.counts.under_review },
    { key: 'promoting', label: 'Promoting', count: buckets.counts.promoting },
    { key: 'completed', label: 'Completed', count: buckets.counts.completed },
    { key: 'requires_action', label: 'Action Needed', count: buckets.counts.requires_action },
    { key: 'drafts', label: 'Drafts', count: buckets.counts.drafts },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Top Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 16,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
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
            width: 36,
            height: 36,
            borderRadius: tokens.radii.xs,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={19} color={colors.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
          Creator Dashboard
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Create new campaign"
          onPress={() => navigation.navigate('CreateTab')}
          style={{
            width: 36,
            height: 36,
            borderRadius: tokens.radii.xs,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={20} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Horizontal Filter Tabs */}
      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
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
                accessibilityRole="tab"
                accessibilityLabel={`${t.label} tab`}
                onPress={() => setActiveTab(t.key)}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: tokens.radii.xs,
                  backgroundColor: active ? colors.accent : colors.surfaceSecondary,
                  borderWidth: 1,
                  borderColor: active ? colors.accent : colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium,
                    color: active ? colors.inkInverse : colors.ink,
                  }}
                >
                  {t.label}
                </Text>
                {t.count !== undefined && t.count > 0 && (
                  <View
                    style={{
                      backgroundColor: active ? colors.surface : colors.surfaceSecondary,
                      paddingHorizontal: 5,
                      paddingVertical: 1,
                      borderRadius: tokens.radii.xs,
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 10,
                        fontFamily: fonts.sansBold,
                        color: active ? colors.accent : colors.inkSecondary,
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
            <ActivityIndicator size="small" color={colors.accent} />
          </View>
        )}

        {/* DRAFTS TAB */}
        {activeTab === 'drafts' && (
          <View>
            {drafts.length > 0 ? (
              drafts.map((d) => (
                <Card key={d.id} style={{ marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: colors.accent, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      Step {d.step} of 5 • {d.category}
                    </Text>
                    {d.isDemoSample && <DemoDataBadge size="sm" />}
                  </View>
                  <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink, marginBottom: 4 }}>
                    {d.title || 'Untitled Draft'}
                  </Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted, marginBottom: 14 }}>
                    Last saved: {formatDate(d.updatedAt)}
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={{ flex: 2 }}>
                      <Button
                        title="Resume Editing"
                        onPress={() => navigation.navigate('CreateFlow', { draftId: d.id, step: d.step })}
                        size="sm"
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
                <Ionicons name="document-text-outline" size={44} color={colors.inkMuted} />
                <Text style={{ fontSize: 15, fontFamily: fonts.serifSemiBold, color: colors.ink, marginTop: 12 }}>
                  No campaigns in Drafts yet
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
                  You don't have any in-progress campaign drafts.
                </Text>
                <Button
                  title="Start a New Campaign"
                  onPress={() => navigation.navigate('CreateTab')}
                  size="md"
                />
              </View>
            )}
          </View>
        )}

        {/* OTHER LIFECYCLE TABS */}
        {activeTab !== 'drafts' && (
          <View>
            {campaignsInTab.length > 0 ? (
              campaignsInTab.map((camp) => (
                <Card key={camp.id} style={{ marginBottom: 16 }}>
                  {/* Thumbnail / Header */}
                  <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
                    {(() => {
                      const cover = getCoverUrl(camp);
                      return cover ? (
                        <Image
                          source={{ uri: cover }}
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: tokens.radii.xs,
                            backgroundColor: colors.surfaceSecondary,
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View
                          style={{
                            width: 72,
                            height: 72,
                            borderRadius: tokens.radii.xs,
                            overflow: 'hidden',
                            borderWidth: 1,
                            borderColor: colors.border,
                          }}
                        >
                          <GeneratedCover
                            category={camp.category}
                            title={camp.title}
                            height={72}
                            iconSize={20}
                          />
                        </View>
                      );
                    })()}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <StatusBadge status={camp.status} amountRaised={camp.amountRaised} fundingGoal={camp.fundingGoal} />
                        <Text style={{ fontSize: 10, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
                          {camp.durationDays || 30}d window
                        </Text>
                      </View>
                      <Text style={{ fontSize: 15, fontFamily: fonts.serifSemiBold, color: colors.ink }} numberOfLines={2} ellipsizeMode="tail">
                        {camp.title}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
                        Est. reach at goal: ~{formatNumber(camp.estimatedReachAtGoal || 150000)} (Estimate)
                      </Text>
                    </View>
                  </View>

                  {/* Progress info with thin bar */}
                  <View style={{ marginBottom: 12 }}>
                    <ProgressBar progress={camp.percentFunded || 0} color={colors.accent} height={3} />
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.accent }}>
                        {formatCurrency(camp.amountRaised || 0)} raised ({camp.percentFunded || 0}%)
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                        Goal: {formatCurrency(camp.fundingGoal || 5000)}
                      </Text>
                    </View>
                  </View>

                  {/* Moderation Feedback if requires_action */}
                  {camp.status === 'changes_requested' && (
                    <View
                      style={{
                        backgroundColor: colors.warningFaint,
                        borderColor: colors.warning,
                        borderWidth: 1,
                        borderRadius: tokens.radii.xs,
                        padding: 10,
                        marginBottom: 12,
                      }}
                    >
                      <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.warning, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 2 }}>
                        Editorial Review Feedback
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.ink, lineHeight: 16 }}>
                        {camp.moderationFeedback ||
                          'Please provide an official source citation for claims in the story blocks.'}
                      </Text>
                    </View>
                  )}

                  {/* Contextual Action Buttons */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                    {camp.status === 'changes_requested' && (
                      <Button
                        title="Edit & Resubmit"
                        onPress={() => handleResubmitChanges(camp)}
                        size="sm"
                        variant="primary"
                      />
                    )}

                    {['submitted', 'in_review'].includes(camp.status) && (
                      <Button
                        title="Preview Campaign"
                        onPress={() => navigation.navigate('CampaignDetail', { campaignId: camp.id })}
                        size="sm"
                        variant="outline"
                      />
                    )}

                    {['approved', 'available_for_funding', 'goal_reached'].includes(camp.status) && (
                      <>
                        <Button
                          title="Post an Update"
                          onPress={() => setUpdateModalCampaignId(camp.id)}
                          size="sm"
                          variant="primary"
                        />
                        <Button
                          title="Public Page"
                          onPress={() => navigation.navigate('CampaignDetail', { campaignId: camp.id })}
                          size="sm"
                          variant="outline"
                        />
                        <Button
                          title="Edit"
                          icon="pencil-outline"
                          onPress={() => handleEditPublishedCampaign(camp)}
                          size="sm"
                          variant="secondary"
                        />
                      </>
                    )}

                    {['distribution_preparation', 'promoting', 'completed'].includes(camp.status) && (
                      <Button
                        title="Distribution Report"
                        onPress={() => navigation.navigate('Report', { campaignId: camp.id })}
                        size="sm"
                        variant="primary"
                      />
                    )}
                  </View>
                </Card>
              ))
            ) : (
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Ionicons name="folder-open-outline" size={44} color={colors.inkMuted} />
                <Text style={{ fontSize: 15, fontFamily: fonts.serifSemiBold, color: colors.ink, marginTop: 12 }}>
                  No campaigns in {tabOptions.find((t) => t.key === activeTab)?.label || activeTab} yet
                </Text>
                <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, textAlign: 'center', marginTop: 4, marginBottom: 16 }}>
                  No campaigns currently match the '{tabOptions.find((t) => t.key === activeTab)?.label || activeTab}' status filter.
                </Text>
                <Button
                  title="Start a New Campaign"
                  onPress={() => navigation.navigate('CreateTab')}
                  size="md"
                />
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
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                Post Campaign Update
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close update modal"
                onPress={() => setUpdateModalCampaignId(null)}
              >
                <Ionicons name="close" size={20} color={colors.inkSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 14 }}>
              Broadcast milestone progress, press coverage, or municipal reactions to all supporters.
            </Text>

            <TextInput
              accessibilityLabel="Campaign update title"
              value={updateTitle}
              onChangeText={setUpdateTitle}
              placeholder="Update Title (e.g. City Council schedules committee review)"
              placeholderTextColor={colors.inkMuted}
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: tokens.radii.xs,
                padding: 12,
                fontSize: 13,
                fontFamily: fonts.sansRegular,
                color: colors.ink,
                marginBottom: 12,
              }}
            />

            <TextInput
              accessibilityLabel="Campaign update body text"
              value={updateBody}
              onChangeText={setUpdateBody}
              placeholder="Write your update message..."
              placeholderTextColor={colors.inkMuted}
              multiline
              numberOfLines={4}
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: tokens.radii.xs,
                padding: 12,
                fontSize: 13,
                fontFamily: fonts.sansRegular,
                color: colors.ink,
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

      {/* Editorial Re-Review In-App Notification Modal */}
      <Modal
        visible={!!editNoticeCampaign}
        animationType="fade"
        transparent
        onRequestClose={() => setEditNoticeCampaign(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: tokens.radii.md,
              borderWidth: 1,
              borderColor: colors.border,
              width: '100%',
              maxWidth: 420,
              padding: 24,
            }}
          >
            {/* Notification Header with Icon */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.warningFaint,
                  borderWidth: 1,
                  borderColor: colors.warning,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="notifications-outline" size={24} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  Campaign Policy Notice
                </Text>
                <Text style={{ fontSize: 16, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                  Editing Published Campaigns
                </Text>
              </View>
            </View>

            {/* Notification Content */}
            <View
              style={{
                backgroundColor: colors.surfaceSecondary,
                borderRadius: tokens.radii.xs,
                borderWidth: 1,
                borderColor: colors.border,
                padding: 14,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.ink, lineHeight: 19 }}>
                Editing published campaigns is not available in this prototype. Live campaigns remain active, fundable, and visible to backers in Explore.
              </Text>
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 20 }}>
              Campaign: <Text style={{ fontFamily: fonts.sansSemiBold, color: colors.ink }}>{editNoticeCampaign?.title}</Text>
            </Text>

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row' }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Understood"
                  variant="primary"
                  onPress={() => setEditNoticeCampaign(null)}
                  fullWidth
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
