import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';
import { useCampaignStore } from '../../store/useCampaignStore';
import { timeAgo } from '../../utils/formatting';

type ActivityFilter = 'all' | 'funding' | 'updates' | 'following';

export function ActivityScreen({ navigation }: any) {
  const [filter, setFilter] = useState<ActivityFilter>('all');
  const notifications = useCampaignStore((s) => s.notifications);
  const markRead = useCampaignStore((s) => s.markNotificationRead);

  const filteredNotifications = notifications.filter((item) => {
    if (filter === 'all') return true;
    if (filter === 'funding') return item.type === 'funding_milestone' || item.type === 'contribution_status';
    if (filter === 'updates') return item.type === 'update';
    if (filter === 'following') {
      return (
        item.type === 'promotion_started' ||
        item.type === 'final_report' ||
        item.type === 'review_decision' ||
        item.type === 'distribution_progress'
      );
    }
    return true;
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 16,
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
          <DemoDataBadge size="sm" />
        </View>

        {/* Tab Filters */}
        <View
          style={{
            flexDirection: 'row',
            marginTop: 16,
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
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((act) => {
            const isFunding = act.type === 'funding_milestone' || act.type === 'contribution_status';
            const isUpdate = act.type === 'update';
            const isReport = act.type === 'final_report';

            const iconName = isFunding
              ? 'trending-up'
              : isUpdate
              ? 'newspaper-outline'
              : isReport
              ? 'ribbon-outline'
              : 'bookmark-outline';

            const iconColor = isFunding
              ? '#22c55e'
              : isUpdate
              ? '#3b82f6'
              : isReport
              ? '#0f172a'
              : '#4f46e5';

            return (
              <TouchableOpacity
                key={act.id}
                onPress={() => {
                  markRead(act.id);
                  if (act.campaignId) {
                    navigation.navigate('CampaignDetail', { campaignId: act.campaignId });
                  }
                }}
                activeOpacity={0.7}
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: act.read ? '#f1f5f9' : '#e0e7ff',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.04,
                  shadowRadius: 3,
                  elevation: 1,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: iconColor + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 12,
                    }}
                  >
                    <Ionicons name={iconName as any} size={18} color={iconColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 }}>
                        {act.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{timeAgo(act.createdAt)}</Text>
                    </View>

                    <Text style={{ fontSize: 13, color: '#475569', marginTop: 4, lineHeight: 18 }}>
                      {act.body}
                    </Text>

                    {act.campaignTitle && (
                      <View
                        style={{
                          marginTop: 8,
                          flexDirection: 'row',
                          alignItems: 'center',
                        }}
                      >
                        <Ionicons name="megaphone-outline" size={12} color="#6366f1" />
                        <Text
                          style={{
                            fontSize: 12,
                            fontWeight: '600',
                            color: '#4f46e5',
                            marginLeft: 4,
                          }}
                          numberOfLines={1}
                        >
                          {act.campaignTitle}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={{ alignItems: 'center', paddingTop: 60, paddingHorizontal: 24 }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                backgroundColor: '#f1f5f9',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Ionicons name="notifications-off-outline" size={32} color="#94a3b8" />
            </View>
            <Text style={{ fontSize: 17, fontWeight: '700', color: '#0f172a' }}>No updates in this tab</Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 6, textAlign: 'center', lineHeight: 20 }}>
              Milestones, moderation decisions, and distribution reports for campaigns you follow will appear here.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
