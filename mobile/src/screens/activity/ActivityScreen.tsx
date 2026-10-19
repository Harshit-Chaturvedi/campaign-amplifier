import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Switch,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { useCampaignStore } from '../../store/useCampaignStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { Button } from '../../components/ui/Button';
import { ActivitySkeleton } from '../../components/ui/Skeleton';
import { timeAgo } from '../../utils/formatting';
import { apiClient } from '../../api/client';
import { colors, fonts, tokens } from '../../theme/tokens';

type ActivityFilter = 'all' | 'funding' | 'updates' | 'following';

export function ActivityScreen({ navigation }: any) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const storeNotifications = useCampaignStore((s) => s.notifications);
  const markRead = useCampaignStore((s) => s.markNotificationRead);
  const preferences = usePreferencesStore((s) => s.notificationPrefs);
  const setPref = usePreferencesStore((s) => s.setNotificationPref);

  const [remoteNotifications, setRemoteNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPrefsModal, setShowPrefsModal] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadNotifications() {
      try {
        setLoading(true);
        const res = await apiClient.getNotifications(filter);
        if (isMounted && res.items && res.items.length > 0) {
          setRemoteNotifications(res.items);
        }
      } catch {
        // Stored notifications fallback
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadNotifications();
    return () => {
      isMounted = false;
    };
  }, [filter]);

  // Merge store notifications and remote notifications with deduplication by id or title+timestamp
  const rawNotifications = remoteNotifications.length > 0 ? remoteNotifications : storeNotifications;

  // De-duplicate notifications
  const deduplicatedNotifications = useMemo(() => {
    const seenIds = new Set<string>();
    return rawNotifications.filter((n) => {
      const key = n.id || `${n.campaign_id || n.campaignId}-${n.type}-${n.title}`;
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    });
  }, [rawNotifications]);

  const filteredNotifications = useMemo(() => {
    return deduplicatedNotifications.filter((item) => {
      const type = item.type || '';
      if (filter === 'all') return true;
      if (filter === 'funding') {
        return (
          type.includes('funding') ||
          type.includes('milestone') ||
          type.includes('contribution') ||
          type === 'available_for_backing'
        );
      }
      if (filter === 'updates') {
        return type.includes('update') || type === 'review_decision' || type === 'changes_requested';
      }
      if (filter === 'following') {
        return (
          type.includes('promotion') ||
          type.includes('report') ||
          type.includes('delivery') ||
          type === 'completed'
        );
      }
      return true;
    });
  }, [deduplicatedNotifications, filter]);

  const handleMarkAllRead = () => {
    deduplicatedNotifications.forEach((n) => {
      markRead(n.id);
      apiClient.markNotificationRead(n.id);
    });
  };

  const getEventIconAndColor = (type: string) => {
    switch (type) {
      case 'submission_received':
        return { icon: 'arrow-up-circle-outline', color: colors.accent };
      case 'approved':
      case 'available_for_backing':
        return { icon: 'checkmark-circle-outline', color: colors.positive };
      case 'changes_requested':
      case 'rejected':
        return { icon: 'alert-circle-outline', color: colors.warning };
      case 'milestone':
      case 'funding_milestone':
        return { icon: 'trending-up-outline', color: colors.positive };
      case 'contribution_success':
      case 'contribution_status':
        return { icon: 'wallet-outline', color: colors.positive };
      case 'contribution_failed':
        return { icon: 'close-circle-outline', color: colors.danger };
      case 'promotion_begins':
      case 'promotion_started':
        return { icon: 'megaphone-outline', color: colors.accent };
      case 'delivery_progress':
      case 'distribution_progress':
        return { icon: 'analytics-outline', color: colors.accent };
      case 'completed':
      case 'final_report':
        return { icon: 'document-text-outline', color: colors.ink };
      case 'update':
        return { icon: 'newspaper-outline', color: colors.accent };
      default:
        return { icon: 'notifications-outline', color: colors.inkSecondary };
    }
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
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontFamily: fonts.serifBold, color: colors.ink }}>Activity</Text>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 2 }}>
              Campaign updates and distribution progress
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <DemoDataBadge size="sm" />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open notification preferences"
              onPress={() => setShowPrefsModal(true)}
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
              <Ionicons name="options-outline" size={18} color={colors.inkSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Filters */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            backgroundColor: colors.surfaceSecondary,
            borderRadius: tokens.radii.sm,
            padding: 3,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'funding', label: 'Funding' },
              { key: 'updates', label: 'Updates' },
              { key: 'following', label: 'Following' },
            ] as const
          ).map((t) => {
            const active = filter === t.key;
            return (
              <TouchableOpacity
                key={t.key}
                onPress={() => setFilter(t.key)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  alignItems: 'center',
                  borderRadius: tokens.radii.xs,
                  backgroundColor: active ? colors.surface : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: active ? fonts.sansSemiBold : fonts.sansMedium,
                    color: active ? colors.ink : colors.inkSecondary,
                  }}
                >
                  {t.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Mark All Read Action */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 10 }}>
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.accent }}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Skeletons on loading (Requirement 7) */}
      {loading ? (
        <ActivitySkeleton />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((act) => {
              const isRead = !!act.read;
              const cid = act.campaignId || act.campaign_id;
              const eventInfo = getEventIconAndColor(act.type);

              return (
                <TouchableOpacity
                  key={act.id}
                  onPress={() => {
                    markRead(act.id);
                    apiClient.markNotificationRead(act.id);
                    if (cid) {
                      navigation.navigate('CampaignDetail', { campaignId: cid });
                    }
                  }}
                  activeOpacity={0.7}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: tokens.radii.sm,
                    padding: 14,
                    marginBottom: 10,
                    borderWidth: 1,
                    borderColor: isRead ? colors.border : colors.accent,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: tokens.radii.xs,
                        backgroundColor: colors.surfaceSecondary,
                        borderWidth: 1,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        marginTop: 1,
                      }}
                    >
                      <Ionicons name={eventInfo.icon as any} size={16} color={eventInfo.color} />
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={{ fontSize: 14, fontFamily: fonts.serifSemiBold, color: colors.ink, flex: 1, marginRight: 8 }}>
                          {act.title}
                        </Text>
                        {!isRead && (
                          <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent }} />
                        )}
                      </View>

                      <Text style={{ fontSize: 13, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginTop: 4, lineHeight: 18 }}>
                        {act.body}
                      </Text>

                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                        <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkMuted }}>
                          {timeAgo(act.createdAt || act.created_at || new Date().toISOString())}
                        </Text>
                        {cid && (
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                            <Text style={{ fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.accent }}>View Campaign</Text>
                            <Ionicons name="chevron-forward" size={11} color={colors.accent} />
                          </View>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={{ alignItems: 'center', paddingVertical: 50 }}>
              <Ionicons name="notifications-off-outline" size={44} color={colors.inkMuted} />
              <Text style={{ fontSize: 15, fontFamily: fonts.serifSemiBold, color: colors.ink, marginTop: 12 }}>
                No Activity in '{filter}'
              </Text>
              <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                When campaigns you back or follow publish updates or reach milestones, notifications appear here.
              </Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Notification Preferences Modal */}
      <Modal
        visible={showPrefsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrefsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: colors.surface, borderTopLeftRadius: tokens.radii.lg, borderTopRightRadius: tokens.radii.lg, padding: 20, borderWidth: 1, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 17, fontFamily: fonts.serifSemiBold, color: colors.ink }}>
                Notification Preferences
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close notification preferences modal"
                onPress={() => setShowPrefsModal(false)}
              >
                <Ionicons name="close" size={20} color={colors.inkSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.inkSecondary, marginBottom: 16 }}>
              Customize which categories of campaign alerts you receive on this device.
            </Text>

            <View style={{ gap: 14, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>Funding Milestones</Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>25%, 50%, 75%, and 100% distribution goal alerts</Text>
                </View>
                <Switch
                  value={preferences.fundingMilestones}
                  onValueChange={(val) => setPref('fundingMilestones', val)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>Campaign Updates</Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Direct messages and progress notes from organizers</Text>
                </View>
                <Switch
                  value={preferences.campaignUpdates}
                  onValueChange={(val) => setPref('campaignUpdates', val)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>Delivery & Final Reports</Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Measured impressions, unique reach, and final reports</Text>
                </View>
                <Switch
                  value={preferences.deliveryReports}
                  onValueChange={(val) => setPref('deliveryReports', val)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>Platform Announcements</Text>
                  <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.inkSecondary }}>Occasional product news and policy updates</Text>
                </View>
                <Switch
                  value={preferences.marketing}
                  onValueChange={(val) => setPref('marketing', val)}
                  trackColor={{ false: colors.border, true: colors.accent }}
                />
              </View>
            </View>

            <Button
              title="Save Preferences"
              onPress={() => setShowPrefsModal(false)}
              variant="primary"
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}
