import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  StatusBar,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StatusBadge } from '../../components/ui/StatusBadge';
import { formatCurrency, formatDate } from '../../utils/formatting';
import { colors, fonts, tokens, getCategoryColor } from '../../theme/tokens';

type AdminTab = 'queue' | 'funded';

export function AdminConsoleScreen({ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<AdminTab>('queue');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  const loadQueue = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const queue = await apiClient.getAdminReviewQueue();
      setItems(Array.isArray(queue) ? queue : []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load moderation queue');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (user?.role === 'admin') {
        loadQueue();
      }
    }, [user?.role, loadQueue])
  );

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
        <Text
          style={{
            fontSize: 20,
            fontFamily: fonts.serifBold,
            color: colors.ink,
            marginTop: 16,
            textAlign: 'center',
          }}
        >
          Admin Access Required
        </Text>
        <Text
          style={{
            fontSize: 14,
            fontFamily: fonts.sansRegular,
            color: colors.inkSecondary,
            textAlign: 'center',
            marginTop: 8,
            marginBottom: 24,
            lineHeight: 20,
          }}
        >
          Your account does not have permission to view the moderation console.
        </Text>
        <Button
          title="Go Back"
          variant="outline"
          onPress={() => navigation.goBack()}
        />
      </View>
    );
  }

  // Filter items into review queue and funded campaigns
  const reviewQueueItems = items.filter((c) =>
    ['submitted', 'in_review', 'under_review', 'changes_requested'].includes(c.status)
  );

  const fundedItems = items.filter((c) =>
    ['goal_reached', 'distribution_preparation', 'promoting'].includes(c.status)
  );

  // Operations actions
  const handleStartPromotion = (campaign: any) => {
    Alert.alert(
      'Start Promotion',
      `Deploy advertising delivery schedule for "${campaign.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Promotion',
          onPress: async () => {
            setActionLoadingId(campaign.id);
            try {
              await apiClient.adminStartPromotion(campaign.id);
              Alert.alert('Promotion Started', 'Ad schedule has been deployed and is now promoting.');
              await loadQueue(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to start promotion');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleSimulateDelivery = (campaign: any) => {
    Alert.alert(
      'Simulate Ad Delivery',
      `Record simulated ad delivery metrics (250,000 impressions, 28,500 reach, 1,950 clicks) for "${campaign.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Record Delivery',
          onPress: async () => {
            setActionLoadingId(campaign.id);
            try {
              await apiClient.adminSimulateDelivery(campaign.id, {
                impressions: 250000,
                measured_reach: 28500,
                clicks: 1950,
              });
              Alert.alert('Success', 'Ad delivery metrics recorded.');
              await loadQueue(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to simulate delivery');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

  const handleCompleteCampaign = (campaign: any) => {
    Alert.alert(
      'Complete Campaign',
      `Mark promotion completed and publish the final distribution report for "${campaign.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete & Publish',
          style: 'destructive',
          onPress: async () => {
            setActionLoadingId(campaign.id);
            try {
              await apiClient.adminCompleteCampaign(campaign.id);
              Alert.alert('Campaign Completed', 'Final distribution report published.');
              await loadQueue(true);
            } catch (err: any) {
              Alert.alert('Error', err?.message || 'Failed to complete campaign');
            } finally {
              setActionLoadingId(null);
            }
          },
        },
      ]
    );
  };

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
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Go back"
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
          <View>
            <Text style={{ fontSize: 20, fontFamily: fonts.serifBold, color: colors.ink }}>
              Admin Console
            </Text>
            <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
              Moderation & Ad Operations
            </Text>
          </View>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Refresh queue"
          onPress={() => loadQueue(true)}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: tokens.radii.xs,
            backgroundColor: colors.surfaceSecondary,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Ionicons name="refresh" size={16} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Review Queue Tab"
          onPress={() => setActiveTab('queue')}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'queue' ? colors.accent : 'transparent',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: activeTab === 'queue' ? fonts.sansBold : fonts.sansMedium,
              color: activeTab === 'queue' ? colors.accent : colors.inkSecondary,
            }}
          >
            Review Queue
          </Text>
          {reviewQueueItems.length > 0 && (
            <View
              style={{
                backgroundColor: colors.accent,
                borderRadius: 999,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: '#ffffff' }}>
                {reviewQueueItems.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Funded Campaigns Tab"
          onPress={() => setActiveTab('funded')}
          style={{
            paddingVertical: 12,
            paddingHorizontal: 16,
            borderBottomWidth: 2,
            borderBottomColor: activeTab === 'funded' ? colors.accent : 'transparent',
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontFamily: activeTab === 'funded' ? fonts.sansBold : fonts.sansMedium,
              color: activeTab === 'funded' ? colors.accent : colors.inkSecondary,
            }}
          >
            Funded Campaigns
          </Text>
          {fundedItems.length > 0 && (
            <View
              style={{
                backgroundColor: colors.positive,
                borderRadius: 999,
                paddingHorizontal: 6,
                paddingVertical: 1,
              }}
            >
              <Text style={{ fontSize: 11, fontFamily: fonts.sansBold, color: '#ffffff' }}>
                {fundedItems.length}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 60 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => loadQueue(true)} colors={[colors.accent]} />
        }
      >
        {loading && items.length === 0 ? (
          // Loading skeleton
          <View style={{ paddingVertical: 24, gap: 12 }}>
            {[1, 2, 3].map((i) => (
              <View
                key={i}
                style={{
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: tokens.radii.sm,
                  padding: 16,
                  height: 110,
                  justifyContent: 'center',
                  opacity: 0.6,
                }}
              >
                <ActivityIndicator size="small" color={colors.accent} />
              </View>
            ))}
          </View>
        ) : error ? (
          // Error state with Retry
          <View
            style={{
              padding: 24,
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderRadius: tokens.radii.sm,
              borderWidth: 1,
              borderColor: colors.dangerFaint,
              marginTop: 16,
            }}
          >
            <Ionicons name="alert-circle-outline" size={40} color={colors.danger} />
            <Text
              style={{
                fontSize: 16,
                fontFamily: fonts.serifSemiBold,
                color: colors.ink,
                marginTop: 12,
                textAlign: 'center',
              }}
            >
              Failed to load queue
            </Text>
            <Text
              style={{
                fontSize: 13,
                fontFamily: fonts.sansRegular,
                color: colors.inkSecondary,
                marginTop: 6,
                marginBottom: 16,
                textAlign: 'center',
              }}
            >
              {error}
            </Text>
            <Button title="Retry" variant="outline" size="sm" onPress={() => loadQueue(false)} />
          </View>
        ) : activeTab === 'queue' ? (
          // Review Queue List
          reviewQueueItems.length === 0 ? (
            <View
              style={{
                padding: 40,
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: tokens.radii.sm,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 16,
              }}
            >
              <Ionicons name="checkmark-circle-outline" size={44} color={colors.positive} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.serifSemiBold,
                  color: colors.ink,
                  marginTop: 12,
                }}
              >
                No submissions waiting
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.sansRegular,
                  color: colors.inkSecondary,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                All submitted campaigns have been moderated and reviewed.
              </Text>
            </View>
          ) : (
            reviewQueueItems.map((c) => {
              const catColor = getCategoryColor(c.category);
              return (
                <Card key={c.id} style={{ marginBottom: 12 }}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Review campaign ${c.title}`}
                    activeOpacity={0.8}
                    onPress={() => navigation.navigate('AdminReviewDetail', { campaignId: c.id })}
                  >
                    <View
                      style={{
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 8,
                      }}
                    >
                      <StatusBadge status={c.status} size="sm" />
                      <View
                        style={{
                          backgroundColor: catColor + '18',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: tokens.radii.xs,
                        }}
                      >
                        <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: catColor }}>
                          {c.category}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={{
                        fontSize: 16,
                        fontFamily: fonts.serifSemiBold,
                        color: colors.ink,
                        marginBottom: 6,
                        lineHeight: 22,
                      }}
                    >
                      {c.title}
                    </Text>

                    <View
                      style={{
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        gap: 12,
                        marginTop: 4,
                        paddingTop: 8,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                        By <Text style={{ fontFamily: fonts.sansSemiBold }}>{c.creator_name}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                        Goal: <Text style={{ fontFamily: fonts.sansSemiBold }}>{formatCurrency(c.funding_goal)}</Text>
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                        Submitted: <Text style={{ fontFamily: fonts.sansSemiBold }}>{formatDate(c.created_at)}</Text>
                      </Text>
                    </View>

                    <View
                      style={{
                        marginTop: 10,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'flex-end',
                        gap: 4,
                      }}
                    >
                      <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.accent }}>
                        Review Submission →
                      </Text>
                    </View>
                  </TouchableOpacity>
                </Card>
              );
            })
          )
        ) : (
          // Funded Campaigns List
          fundedItems.length === 0 ? (
            <View
              style={{
                padding: 40,
                alignItems: 'center',
                backgroundColor: colors.surface,
                borderRadius: tokens.radii.sm,
                borderWidth: 1,
                borderColor: colors.border,
                marginTop: 16,
              }}
            >
              <Ionicons name="megaphone-outline" size={44} color={colors.inkMuted} />
              <Text
                style={{
                  fontSize: 16,
                  fontFamily: fonts.serifSemiBold,
                  color: colors.ink,
                  marginTop: 12,
                }}
              >
                No funded campaigns
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.sansRegular,
                  color: colors.inkSecondary,
                  marginTop: 4,
                  textAlign: 'center',
                }}
              >
                No campaigns currently in goal reached or promoting stage.
              </Text>
            </View>
          ) : (
            fundedItems.map((c) => {
              const isWorking = actionLoadingId === c.id;
              const catColor = getCategoryColor(c.category);
              return (
                <Card key={c.id} style={{ marginBottom: 12 }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <StatusBadge status={c.status} size="sm" />
                    <View
                      style={{
                        backgroundColor: catColor + '18',
                        paddingHorizontal: 8,
                        paddingVertical: 2,
                        borderRadius: tokens.radii.xs,
                      }}
                    >
                      <Text style={{ fontSize: 10, fontFamily: fonts.sansBold, color: catColor }}>
                        {c.category}
                      </Text>
                    </View>
                  </View>

                  <Text
                    style={{
                      fontSize: 16,
                      fontFamily: fonts.serifSemiBold,
                      color: colors.ink,
                      marginBottom: 6,
                    }}
                  >
                    {c.title}
                  </Text>

                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 12,
                      marginTop: 4,
                      paddingTop: 8,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                      Raised:{' '}
                      <Text style={{ fontFamily: fonts.sansBold, color: colors.positive }}>
                        {formatCurrency(c.amount_raised)}
                      </Text>{' '}
                      of {formatCurrency(c.funding_goal)}
                    </Text>
                    <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>
                      Backers: <Text style={{ fontFamily: fonts.sansBold }}>{c.backer_count}</Text>
                    </Text>
                  </View>

                  {/* Actions for operations based on status */}
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 8,
                      marginTop: 14,
                      paddingTop: 12,
                      borderTopWidth: 1,
                      borderTopColor: colors.border,
                    }}
                  >
                    {c.status === 'goal_reached' && (
                      <View style={{ flex: 1 }}>
                        <Button
                          title={isWorking ? 'Starting...' : 'Start Promotion'}
                          variant="primary"
                          size="sm"
                          disabled={isWorking}
                          loading={isWorking}
                          onPress={() => handleStartPromotion(c)}
                        />
                      </View>
                    )}

                    {c.status === 'distribution_preparation' && (
                      <View style={{ flex: 1 }}>
                        <Button
                          title={isWorking ? 'Starting...' : 'Start Promotion'}
                          variant="primary"
                          size="sm"
                          disabled={isWorking}
                          loading={isWorking}
                          onPress={() => handleStartPromotion(c)}
                        />
                      </View>
                    )}

                    {c.status === 'promoting' && (
                      <>
                        <View style={{ flex: 1 }}>
                          <Button
                            title="Simulate Delivery"
                            variant="secondary"
                            size="sm"
                            disabled={isWorking}
                            onPress={() => handleSimulateDelivery(c)}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Button
                            title="Complete"
                            variant="primary"
                            size="sm"
                            disabled={isWorking}
                            onPress={() => handleCompleteCampaign(c)}
                          />
                        </View>
                      </>
                    )}
                  </View>
                </Card>
              );
            })
          )
        )}
      </ScrollView>
    </View>
  );
}
