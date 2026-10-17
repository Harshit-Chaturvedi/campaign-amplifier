import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { DemoDataBadge } from '../../components/ui/DemoDataBadge';

type ActivityFilter = 'all' | 'funding' | 'updates' | 'following';

interface ActivityItem {
  id: string;
  type: 'funding' | 'update' | 'following';
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  campaignTitle?: string;
}

const SAMPLE_ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    type: 'funding',
    title: 'Milestone reached: 65% funded',
    body: 'Clean drinking water in every public school has reached $5,240 toward its goal.',
    timestamp: '2h ago',
    read: false,
    campaignTitle: 'Clean drinking water in every public school',
  },
  {
    id: 'act-2',
    type: 'update',
    title: 'New official source added',
    body: 'Devin Okonkwo added the 2026 Ring-road Transit Capacity Analysis to Redraw the bus network.',
    timestamp: '1d ago',
    read: true,
    campaignTitle: 'Redraw the bus network around where people actually work',
  },
  {
    id: 'act-3',
    type: 'following',
    title: 'Review approved',
    body: 'Let farmers repair the equipment they own is now available for community amplification.',
    timestamp: '2d ago',
    read: true,
    campaignTitle: 'Let farmers repair the equipment they own',
  },
];

export function ActivityScreen({ navigation }: any) {
  const [filter, setFilter] = useState<ActivityFilter>('all');

  const filteredActivities = SAMPLE_ACTIVITIES.filter((item) => {
    if (filter === 'all') return true;
    return item.type === filter;
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
        {filteredActivities.length > 0 ? (
          filteredActivities.map((act) => {
            const iconName =
              act.type === 'funding'
                ? 'trending-up'
                : act.type === 'update'
                ? 'newspaper-outline'
                : 'bookmark-outline';
            const iconColor =
              act.type === 'funding'
                ? '#22c55e'
                : act.type === 'update'
                ? '#3b82f6'
                : '#4f46e5';

            return (
              <View
                key={act.id}
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
                    <Ionicons name={iconName} size={18} color={iconColor} />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', flex: 1, marginRight: 8 }}>
                        {act.title}
                      </Text>
                      <Text style={{ fontSize: 11, color: '#94a3b8' }}>{act.timestamp}</Text>
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
              </View>
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
