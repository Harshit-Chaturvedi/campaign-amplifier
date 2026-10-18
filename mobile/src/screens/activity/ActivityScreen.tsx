import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Modal,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { useCampaignStore } from '../../store/useCampaignStore';
import { usePreferencesStore } from '../../store/usePreferencesStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { timeAgo } from '../../utils/formatting';
import { apiClient } from '../../api/client';

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
  const seenIds = new Set<string>();
  const deduplicatedNotifications = rawNotifications.filter((n) => {
    const key = n.id || `${n.campaign_id || n.campaignId}-${n.type}-${n.title}`;
    if (seenIds.has(key)) return false;
    seenIds.add(key);
    return true;
  });

  const filteredNotifications = deduplicatedNotifications.filter((item) => {
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

  const handleMarkAllRead = () => {
    deduplicatedNotifications.forEach((n) => {
      markRead(n.id);
      apiClient.markNotificationRead(n.id);
    });
  };

  const getEventIconAndColor = (type: string) => {
    switch (type) {
      case 'submission_received':
        return { icon: 'arrow-up-circle-outline', color: '#6366f1' };
      case 'approved':
      case 'available_for_backing':
        return { icon: 'checkmark-circle-outline', color: '#16a34a' };
      case 'changes_requested':
      case 'rejected':
        return { icon: 'alert-circle-outline', color: '#f59e0b' };
      case 'milestone':
      case 'funding_milestone':
        return { icon: 'trending-up-outline', color: '#16a34a' };
      case 'contribution_success':
      case 'contribution_status':
        return { icon: 'wallet-outline', color: '#16a34a' };
      case 'contribution_failed':
        return { icon: 'close-circle-outline', color: '#dc2626' };
      case 'promotion_begins':
      case 'promotion_started':
        return { icon: 'megaphone-outline', color: '#4f46e5' };
      case 'delivery_progress':
      case 'distribution_progress':
        return { icon: 'analytics-outline', color: '#2563eb' };
      case 'completed':
      case 'final_report':
        return { icon: 'document-text-outline', color: '#0f172a' };
      case 'update':
        return { icon: 'newspaper-outline', color: '#4f46e5' };
      default:
        return { icon: 'notifications-outline', color: '#64748b' };
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>Activity</Text>
            <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
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
                borderRadius: 18,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="options-outline" size={18} color="#475569" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Filters */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 14,
            backgroundColor: '#f1f5f9',
            borderRadius: 12,
            padding: 4,
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
                  paddingVertical: 8,
                  alignItems: 'center',
                  borderRadius: 8,
                  backgroundColor: active ? '#ffffff' : 'transparent',
                  shadowColor: active ? '#000' : 'transparent',
                  shadowOpacity: active ? 0.05 : 0,
                  shadowRadius: 3,
                  elevation: active ? 1 : 0,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: active ? '700' : '500',
                    color: active ? '#0f172a' : '#64748b',
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
            <Text style={{ fontSize: 12, fontWeight: '600', color: '#4f46e5' }}>
              Mark all as read
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {loading && (
          <View style={{ paddingVertical: 20, alignItems: 'center' }}>
            <ActivityIndicator size="small" color="#4f46e5" />
          </View>
        )}

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
                  backgroundColor: '#ffffff',
                  borderRadius: 14,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: isRead ? '#f1f5f9' : '#c7d2fe',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 2,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: `${eventInfo.color}15`,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                      marginTop: 2,
                    }}
                  >
                    <Ionicons name={eventInfo.icon as any} size={18} color={eventInfo.color} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 }}>
                        {act.title}
                      </Text>
                      {!isRead && (
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#4f46e5' }} />
                      )}
                    </View>

                    <Text style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 18 }}>
                      {act.body}
                    </Text>

                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>
                        {timeAgo(act.createdAt || act.created_at || new Date().toISOString())}
                      </Text>
                      {cid && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                          <Text style={{ fontSize: 11, fontWeight: '600', color: '#4f46e5' }}>View Campaign</Text>
                          <Ionicons name="chevron-forward" size={12} color="#4f46e5" />
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
            <Ionicons name="notifications-off-outline" size={48} color="#94a3b8" />
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#475569', marginTop: 12 }}>
              No Activity in '{filter}'
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4 }}>
              When campaigns you back or follow publish updates or reach milestones, notifications appear here.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Notification Preferences Modal */}
      <Modal
        visible={showPrefsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPrefsModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#ffffff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a' }}>
                Notification Preferences
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Close notification preferences modal"
                onPress={() => setShowPrefsModal(false)}
              >
                <Ionicons name="close" size={22} color="#64748b" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
              Customize which categories of campaign alerts you receive on this device.
            </Text>

            <View style={{ gap: 14, marginBottom: 20 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Funding Milestones</Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>25%, 50%, 75%, and 100% distribution goal alerts</Text>
                </View>
                <Switch
                  value={preferences.fundingMilestones}
                  onValueChange={(val) => setPref('fundingMilestones', val)}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Campaign Updates</Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Direct messages and progress notes from organizers</Text>
                </View>
                <Switch
                  value={preferences.campaignUpdates}
                  onValueChange={(val) => setPref('campaignUpdates', val)}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Delivery & Final Reports</Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Measured impressions, unique reach, and final reports</Text>
                </View>
                <Switch
                  value={preferences.deliveryReports}
                  onValueChange={(val) => setPref('deliveryReports', val)}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
                />
              </View>

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 10 }}>
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>Platform Announcements</Text>
                  <Text style={{ fontSize: 12, color: '#64748b' }}>Occasional product news and policy updates</Text>
                </View>
                <Switch
                  value={preferences.marketing}
                  onValueChange={(val) => setPref('marketing', val)}
                  trackColor={{ false: '#cbd5e1', true: '#4f46e5' }}
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
