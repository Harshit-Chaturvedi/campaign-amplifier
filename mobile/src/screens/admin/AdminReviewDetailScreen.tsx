import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
  TextInput,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency } from '../../utils/formatting';
import { estimateReach } from '../../services/reach';
import { colors, fonts, tokens, getCategoryColor } from '../../theme/tokens';

export function AdminReviewDetailScreen({ route, navigation }: any) {
  const { campaignId } = route.params || {};
  const user = useAuthStore((s) => s.user);

  const [campaign, setCampaign] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Note modal state for Request Changes or Reject
  const [modalType, setModalType] = useState<'changes' | 'reject' | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteError, setNoteError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!campaignId) return;
    setLoading(true);
    try {
      const res = await apiClient.getCampaign(campaignId);
      setCampaign(res);
    } catch {
      Alert.alert('Error', 'Unable to load campaign details');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [campaignId, navigation]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  // Role guard
  if (!user || user.role !== 'admin') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.background,
          padding: 24,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Ionicons name="shield-outline" size={48} color={colors.danger} />
        <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.ink, marginTop: 12 }}>
          Admin Access Required
        </Text>
        <Button title="Go Back" variant="outline" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  // Action handlers
  const handleApprove = () => {
    Alert.alert(
      'Approve & Publish',
      `Are you sure you want to approve "${campaign?.title}" and make it available for funding?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve & Publish',
          onPress: async () => {
            setSubmitting(true);
            try {
              await apiClient.adminApproveCampaign(
                campaign.id,
                'Content, sources, creative and targeting reviewed.'
              );
              Alert.alert('Approved', 'Campaign approved and published for funding!');
              navigation.goBack();
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to approve campaign');
              setSubmitting(false);
            }
          },
        },
      ]
    );
  };

  const handleOpenNoteModal = (type: 'changes' | 'reject') => {
    setModalType(type);
    setNoteText('');
    setNoteError(null);
  };

  const handleSubmitNote = async () => {
    const trimmed = noteText.trim();
    if (trimmed.length < 10) {
      setNoteError('Please provide at least 10 characters explaining your feedback.');
      return;
    }

    setSubmitting(true);
    try {
      if (modalType === 'changes') {
        await apiClient.adminRequestChanges(campaign.id, trimmed);
        Alert.alert('Changes Requested', 'Feedback sent to the creator.');
      } else if (modalType === 'reject') {
        await apiClient.adminRejectCampaign(campaign.id, trimmed);
        Alert.alert('Campaign Rejected', 'The submission has been marked rejected.');
      }
      setModalType(null);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Failed to complete action');
      setSubmitting(false);
    }
  };

  if (loading || !campaign) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const reach = estimateReach(campaign.funding_goal || 0);
  const catColor = getCategoryColor(campaign.category);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Back to review queue"
          onPress={() => navigation.goBack()}
          style={{
            width: 36,
            height: 36,
            borderRadius: tokens.radii.xs,
            backgroundColor: colors.surfaceSecondary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="arrow-back" size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.ink }} numberOfLines={1}>
            Review Submission
          </Text>
          <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
            ID: {campaign.id}
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        {/* Status and Title Card */}
        <Card style={{ marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <StatusBadge status={campaign.status} size="sm" />
            <View
              style={{
                backgroundColor: catColor + '18',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: tokens.radii.xs,
              }}
            >
              <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: catColor }}>
                {campaign.category}
              </Text>
            </View>
          </View>

          <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 8, lineHeight: 26 }}>
            {campaign.title}
          </Text>

          <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 12 }}>
            Submitted by <Text style={{ fontFamily: fonts.sansSemiBold }}>{campaign.creator_name}</Text>
          </Text>

          {/* Funding Goal & Estimate Reach */}
          <View
            style={{
              flexDirection: 'row',
              backgroundColor: colors.surfaceSecondary,
              padding: 12,
              borderRadius: tokens.radii.xs,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 16,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase' }}>
                Funding Goal
              </Text>
              <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.ink, marginTop: 2 }}>
                {formatCurrency(campaign.funding_goal || 0)}
              </Text>
            </View>

            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase' }}>
                Estimate Reach
              </Text>
              <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.accent, marginTop: 2 }}>
                {reach.estimate.toLocaleString()}
              </Text>
              <Text style={{ fontSize: 10, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
                Estimate
              </Text>
            </View>
          </View>
        </Card>

        {/* Summary Card */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: colors.ink, marginBottom: 8 }}>
            Summary
          </Text>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansRegular, color: colors.inkSecondary, lineHeight: 22 }}>
            {campaign.summary || campaign.short_description || 'No summary provided.'}
          </Text>
        </Card>

        {/* Ad Headline & Primary Text */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: colors.ink, marginBottom: 10 }}>
            Ad Creative Preview
          </Text>
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase' }}>
              Headline
            </Text>
            <Text style={{ fontSize: 15, fontFamily: fonts.serifSemiBold, color: colors.ink, marginTop: 2 }}>
              {campaign.headline || campaign.ad_headline || campaign.title}
            </Text>
          </View>
          <View>
            <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: colors.inkMuted, textTransform: 'uppercase' }}>
              Primary Text
            </Text>
            <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2, lineHeight: 20 }}>
              {campaign.ad_description || campaign.ad_primary_text || campaign.summary || 'No primary text set.'}
            </Text>
          </View>
        </Card>

        {/* Sources */}
        <Card style={{ marginBottom: 14 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: colors.ink, marginBottom: 8 }}>
            Supporting Sources & Citations
          </Text>
          {Array.isArray(campaign.sources) && campaign.sources.length > 0 ? (
            campaign.sources.map((s: any, idx: number) => (
              <View
                key={idx}
                style={{
                  paddingVertical: 8,
                  borderBottomWidth: idx < campaign.sources.length - 1 ? 1 : 0,
                  borderBottomColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.accent }}>
                  {typeof s === 'string' ? s : s.title || s.url}
                </Text>
                {typeof s === 'object' && s.url && s.title && (
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted, marginTop: 2 }}>
                    {s.url}
                  </Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkMuted, fontStyle: 'italic' }}>
              No sources listed for this campaign.
            </Text>
          )}
        </Card>

        {/* Action Buttons */}
        <View style={{ gap: 10, marginTop: 10 }}>
          <Button
            title={submitting ? 'Approving...' : 'Approve & Publish'}
            variant="primary"
            disabled={submitting}
            loading={submitting}
            onPress={handleApprove}
            fullWidth
          />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}>
              <Button
                title="Request Changes"
                variant="secondary"
                disabled={submitting}
                onPress={() => handleOpenNoteModal('changes')}
                fullWidth
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                title="Reject"
                variant="danger"
                disabled={submitting}
                onPress={() => handleOpenNoteModal('reject')}
                fullWidth
              />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal for Requesting Changes / Rejection reason */}
      <Modal visible={modalType !== null} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: tokens.radii.sm,
              padding: 20,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text style={{ fontSize: 18, fontFamily: fonts.serifBold, color: colors.ink, marginBottom: 8 }}>
              {modalType === 'changes' ? 'Request Editorial Changes' : 'Reject Submission'}
            </Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 14 }}>
              {modalType === 'changes'
                ? 'Explain what claims, citations, or creatives need revision before approval (minimum 10 characters):'
                : 'State the specific policy reason for rejecting this campaign (minimum 10 characters):'}
            </Text>

            <TextInput
              multiline
              numberOfLines={4}
              value={noteText}
              onChangeText={(t) => {
                setNoteText(t);
                if (noteError) setNoteError(null);
              }}
              placeholder="Enter feedback or rejection rationale..."
              placeholderTextColor={colors.inkMuted}
              style={{
                borderWidth: 1,
                borderColor: noteError ? colors.danger : colors.border,
                borderRadius: tokens.radii.xs,
                padding: 12,
                fontSize: 14,
                fontFamily: fonts.sansRegular,
                color: colors.ink,
                minHeight: 100,
                textAlignVertical: 'top',
                backgroundColor: colors.surfaceSecondary,
              }}
            />

            {noteError && (
              <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.danger, marginTop: 6 }}>
                {noteError}
              </Text>
            )}

            <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Cancel"
                  variant="outline"
                  onPress={() => setModalType(null)}
                  disabled={submitting}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title={submitting ? 'Submitting...' : 'Submit'}
                  variant={modalType === 'changes' ? 'primary' : 'danger'}
                  onPress={handleSubmitNote}
                  disabled={submitting}
                  loading={submitting}
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
