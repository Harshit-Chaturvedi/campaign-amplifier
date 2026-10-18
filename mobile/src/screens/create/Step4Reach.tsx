import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { CampaignDraft } from '../../store/useDraftStore';

const LOCATION_OPTIONS = [
  'Cook County',
  'Chicago Metro',
  'Illinois Statewide',
  'Midwest Region',
  'United States (National)',
  'Local Municipal Districts',
  'Public School Districts',
  'Rural & Agricultural Areas',
];

const INTEREST_OPTIONS = [
  'Public Health & Clean Water',
  'Environmental Quality & Parks',
  'Public Transit & Commuters',
  'Consumer Rights & Agriculture',
  'Winter Shelters & Community Care',
  'Civic Education & Open Ballots',
  'Local Government & Policy',
  'Public School Funding',
];

const ALL_CHANNELS = [
  { id: 'Meta', name: 'Meta (Facebook)', icon: 'logo-facebook', color: '#1877f2' },
  { id: 'Instagram', name: 'Instagram', icon: 'logo-instagram', color: '#e1306c' },
  { id: 'Reddit', name: 'Reddit', icon: 'logo-reddit', color: '#ff4500' },
  { id: 'YouTube', name: 'YouTube', icon: 'logo-youtube', color: '#ff0000' },
  { id: 'X', name: 'X (Twitter)', icon: 'logo-twitter', color: '#0f172a' },
];

const DURATION_OPTIONS = [
  { days: 7, label: '7 Days', description: 'Sprint awareness around a vote or deadline' },
  { days: 14, label: '14 Days', description: 'Balanced community outreach period' },
  { days: 30, label: '30 Days', description: 'Full community cycle for deep message reach' },
];

interface Step4ReachProps {
  draft: Partial<CampaignDraft>;
  onChange: (fields: Partial<CampaignDraft>) => void;
}

export function Step4Reach({ draft, onChange }: Step4ReachProps) {
  const locations = draft.locations && draft.locations.length > 0
    ? draft.locations
    : ['Cook County'];

  const interests = draft.interests && draft.interests.length > 0
    ? draft.interests
    : ['Public Health & Clean Water'];

  const channels = draft.channels && draft.channels.length > 0
    ? draft.channels
    : ['Meta', 'Instagram'];

  const budgetAllocation = draft.budgetAllocation && Object.keys(draft.budgetAllocation).length > 0
    ? draft.budgetAllocation
    : { Meta: 60, Instagram: 40 };

  const durationDays = draft.durationDays || 30;

  // Toggle location chip
  const toggleLocation = (loc: string) => {
    let next: string[];
    if (locations.includes(loc)) {
      if (locations.length === 1) return; // Keep at least one
      next = locations.filter((l) => l !== loc);
    } else {
      next = [...locations, loc];
    }
    onChange({ locations: next });
  };

  // Toggle interest chip
  const toggleInterest = (interest: string) => {
    let next: string[];
    if (interests.includes(interest)) {
      if (interests.length === 1) return; // Keep at least one
      next = interests.filter((i) => i !== interest);
    } else {
      next = [...interests, interest];
    }
    onChange({ interests: next });
  };

  // Toggle channel
  const toggleChannel = (chId: string) => {
    let nextChannels: string[];
    const nextAlloc = { ...budgetAllocation };

    if (channels.includes(chId)) {
      if (channels.length === 1) return; // Keep at least one channel
      nextChannels = channels.filter((c) => c !== chId);
      delete nextAlloc[chId];
      // Re-distribute to remaining
      const count = nextChannels.length;
      const basePct = Math.floor(100 / count);
      const rem = 100 - (basePct * count);
      nextChannels.forEach((c, idx) => {
        nextAlloc[c] = basePct + (idx === 0 ? rem : 0);
      });
    } else {
      nextChannels = [...channels, chId];
      // Re-distribute evenly
      const count = nextChannels.length;
      const basePct = Math.floor(100 / count);
      const rem = 100 - (basePct * count);
      nextChannels.forEach((c, idx) => {
        nextAlloc[c] = basePct + (idx === 0 ? rem : 0);
      });
    }

    onChange({
      channels: nextChannels,
      budgetAllocation: nextAlloc,
    });
  };

  // Adjust percentage for a channel
  const adjustAllocation = (chId: string, delta: number) => {
    const current = budgetAllocation[chId] || 0;
    const nextVal = Math.max(5, Math.min(95, current + delta));
    const nextAlloc = {
      ...budgetAllocation,
      [chId]: nextVal,
    };
    onChange({ budgetAllocation: nextAlloc });
  };

  // Distribute evenly helper
  const distributeEvenly = () => {
    const count = channels.length;
    if (count === 0) return;
    const basePct = Math.floor(100 / count);
    const rem = 100 - (basePct * count);
    const nextAlloc: Record<string, number> = {};
    channels.forEach((c, idx) => {
      nextAlloc[c] = basePct + (idx === 0 ? rem : 0);
    });
    onChange({ budgetAllocation: nextAlloc });
  };

  // Calculate current allocation sum
  const currentTotalPct = channels.reduce(
    (sum, ch) => sum + (budgetAllocation[ch] || 0),
    0
  );
  const isBudgetValid = currentTotalPct === 100;

  return (
    <View>
      {/* Step Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
          Audience & Reach
        </Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4, lineHeight: 20 }}>
          Define who should see your message and how budget should be distributed across social channels.
        </Text>
      </View>

      {/* SECTION 1: YOU CHOOSE */}
      <View
        style={{
          borderLeftWidth: 4,
          borderLeftColor: '#4f46e5',
          paddingLeft: 12,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Section 1: You Choose
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 }}>
          Your Desired Reach Profile
        </Text>
      </View>

      {/* 1. Locations */}
      <Card style={{ marginBottom: 18, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Ionicons name="location-outline" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
            Target Locations
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Select the geographic areas where your ad messages should be displayed.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {LOCATION_OPTIONS.map((loc) => {
            const isSelected = locations.includes(loc);
            return (
              <TouchableOpacity
                key={loc}
                onPress={() => toggleLocation(loc)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                  borderWidth: 1,
                  borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                }}
              >
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={14} color="#fff" style={{ marginRight: 5 }} />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#fff' : '#334155',
                  }}
                >
                  {loc}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* 2. Interests */}
      <Card style={{ marginBottom: 18, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Ionicons name="sparkles-outline" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
            Audience Interests
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Connect with audiences engaged in related civic, local, and community topics.
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {INTEREST_OPTIONS.map((interest) => {
            const isSelected = interests.includes(interest);
            return (
              <TouchableOpacity
                key={interest}
                onPress={() => toggleInterest(interest)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 20,
                  backgroundColor: isSelected ? '#eef2ff' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: isSelected ? '#6366f1' : '#e2e8f0',
                }}
              >
                <Ionicons
                  name={isSelected ? 'checkbox' : 'square-outline'}
                  size={14}
                  color={isSelected ? '#4f46e5' : '#94a3b8'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#3730a3' : '#334155',
                  }}
                >
                  {interest}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* 3. Channels & Budget Allocation */}
      <Card style={{ marginBottom: 18, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pie-chart-outline" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
              Advertising Channels
            </Text>
          </View>
          <TouchableOpacity
            onPress={distributeEvenly}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 6,
              backgroundColor: '#f1f5f9',
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#4f46e5' }}>
              Distribute Evenly
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Choose active networks and allocate percentage of ad spend. Budget must total 100%.
        </Text>

        {/* Channel Selection Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {ALL_CHANNELS.map((ch) => {
            const isSelected = channels.includes(ch.id);
            return (
              <TouchableOpacity
                key={ch.id}
                onPress={() => toggleChannel(ch.id)}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: 12,
                  backgroundColor: isSelected ? '#1e293b' : '#f8fafc',
                  borderWidth: 1,
                  borderColor: isSelected ? '#0f172a' : '#cbd5e1',
                }}
              >
                <Ionicons
                  name={ch.icon as any}
                  size={15}
                  color={isSelected ? '#fff' : '#64748b'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#fff' : '#334155',
                  }}
                >
                  {ch.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Budget Allocation Steppers per Selected Channel */}
        <View style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#f1f5f9' }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginBottom: 10 }}>
            Budget Allocation Across Channels
          </Text>

          {channels.map((chId) => {
            const chMeta = ALL_CHANNELS.find((c) => c.id === chId);
            const pct = budgetAllocation[chId] || 0;
            return (
              <View
                key={chId}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingVertical: 8,
                  borderBottomWidth: 1,
                  borderBottomColor: '#e2e8f0',
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={chMeta?.icon as any || 'megaphone-outline'}
                    size={16}
                    color={chMeta?.color || '#4f46e5'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>
                    {chMeta?.name || chId}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    onPress={() => adjustAllocation(chId, -5)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#e2e8f0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="remove" size={16} color="#0f172a" />
                  </TouchableOpacity>

                  <View style={{ minWidth: 50, alignItems: 'center' }}>
                    <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
                      {pct}%
                    </Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => adjustAllocation(chId, 5)}
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 15,
                      backgroundColor: '#e2e8f0',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={16} color="#0f172a" />
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Running Total Indicator & Validation */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 12,
              paddingTop: 8,
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>
              Total Allocation:
            </Text>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
                backgroundColor: isBudgetValid ? '#dcfce7' : '#fee2e2',
              }}
            >
              <Ionicons
                name={isBudgetValid ? 'checkmark-circle' : 'alert-circle'}
                size={16}
                color={isBudgetValid ? '#16a34a' : '#dc2626'}
                style={{ marginRight: 5 }}
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '800',
                  color: isBudgetValid ? '#15803d' : '#b91c1c',
                }}
              >
                {currentTotalPct}%
              </Text>
            </View>
          </View>

          {!isBudgetValid && (
            <View style={{ marginTop: 8, backgroundColor: '#fef2f2', padding: 8, borderRadius: 8 }}>
              <Text style={{ fontSize: 12, color: '#b91c1c', fontWeight: '500' }}>
                Budget allocations must total exactly 100% (currently {currentTotalPct}%). Tap "Distribute Evenly" or adjust manually.
              </Text>
            </View>
          )}
        </View>
      </Card>

      {/* 4. Campaign Duration */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Ionicons name="calendar-outline" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
            Campaign Flight Duration
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          How long ad campaigns run once funded and approved for launch.
        </Text>
        <View style={{ gap: 8 }}>
          {DURATION_OPTIONS.map((d) => {
            const isSelected = durationDays === d.days;
            return (
              <TouchableOpacity
                key={d.days}
                onPress={() => onChange({ durationDays: d.days })}
                activeOpacity={0.7}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: 12,
                  borderRadius: 12,
                  backgroundColor: isSelected ? '#eef2ff' : '#fff',
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                }}
              >
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    borderWidth: 2,
                    borderColor: isSelected ? '#4f46e5' : '#cbd5e1',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: '#4f46e5',
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                    {d.label}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    {d.description}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* SECTION 2: THE PLATFORM MAY FINALISE DURING REVIEW */}
      <View
        style={{
          borderLeftWidth: 4,
          borderLeftColor: '#0284c7',
          paddingLeft: 12,
          marginBottom: 16,
        }}
      >
        <Text style={{ fontSize: 13, fontWeight: '800', color: '#0284c7', textTransform: 'uppercase', letterSpacing: 0.8 }}>
          Section 2: The Platform May Finalise During Review
        </Text>
        <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginTop: 2 }}>
          Platform Calibration & Safeguards
        </Text>
      </View>

      <Card style={{ marginBottom: 24, padding: 16, backgroundColor: '#f0f9ff', borderColor: '#bae6fd' }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 }}>
          <Ionicons name="shield-checkmark" size={20} color="#0284c7" style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369a1' }}>
              Review Team Optimization & Compliance
            </Text>
            <Text style={{ fontSize: 13, color: '#334155', marginTop: 4, lineHeight: 18 }}>
              To ensure ad approvals across strict ad network policies (Meta, Reddit, Google), our review team may fine-tune the final parameters:
            </Text>
          </View>
        </View>

        <View style={{ gap: 6, paddingLeft: 8, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={14} color="#0284c7" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
              Bidding strategies, auction pacing, and impression distribution
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={14} color="#0284c7" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
              Negative keyword exclusions and policy safety boundary checks
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={14} color="#0284c7" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 12, color: '#334155', fontWeight: '500' }}>
              Cross-network demographic balancing to prevent click fatigue
            </Text>
          </View>
        </View>

        {/* Mandatory Copy Notice */}
        <View
          style={{
            marginTop: 14,
            padding: 10,
            backgroundColor: '#ffffff',
            borderRadius: 8,
            borderWidth: 1,
            borderColor: '#e0f2fe',
          }}
        >
          <Text
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              color: '#475569',
              textAlign: 'center',
              fontWeight: '600',
            }}
          >
            "Actual reach depends on inventory, prices, targeting, delivery and performance."
          </Text>
        </View>
      </Card>

      {/* AUDIENCE PREVIEW CARD */}
      <View style={{ marginBottom: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
          Audience Preview
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Summary of intended recipients and sample ad layout. Promised audience sizes are never shown.
        </Text>

        <Card style={{ padding: 16, borderColor: '#cbd5e1' }}>
          {/* Target Profile Summary */}
          <View style={{ marginBottom: 14 }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: 6 }}>
              Intended Audience Profile
            </Text>
            <Text style={{ fontSize: 14, color: '#0f172a', lineHeight: 20 }}>
              Residents in <Text style={{ fontWeight: '700' }}>{locations.join(', ')}</Text> interested in{' '}
              <Text style={{ fontWeight: '700' }}>{interests.join(', ')}</Text>.
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
              <Text style={{ fontSize: 12, color: '#64748b' }}>Active on:</Text>
              {channels.map((c) => (
                <View
                  key={c}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                    backgroundColor: '#f1f5f9',
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#334155' }}>
                    {c} ({budgetAllocation[c] || 0}%)
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Sample Ad Mockup */}
          <View
            style={{
              borderRadius: 12,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: '#e2e8f0',
              backgroundColor: '#fff',
            }}
          >
            <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc' }}>
              <Ionicons name="megaphone" size={16} color="#4f46e5" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, fontWeight: '700', color: '#0f172a' }}>
                {draft.creatorName || 'Campaign Organizer'}
              </Text>
              <Text style={{ fontSize: 11, color: '#64748b', marginLeft: 4 }}>• Sponsored Ad</Text>
            </View>

            {draft.coverUrl ? (
              <Image
                source={{ uri: draft.coverUrl }}
                style={{ width: '100%', height: 140 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ height: 120, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="image-outline" size={32} color="#94a3b8" />
                <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Cover Visual</Text>
              </View>
            )}

            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }} numberOfLines={2}>
                {draft.headline || draft.title || 'Campaign Title'}
              </Text>
              <Text style={{ fontSize: 12, color: '#475569', marginTop: 4 }} numberOfLines={2}>
                {draft.adDescription || draft.summary || 'Summary and checkable facts for the public.'}
              </Text>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 10,
                backgroundColor: '#f8fafc',
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
              }}
            >
              <Text style={{ fontSize: 11, color: '#64748b' }}>campaigns.app</Text>
              <View style={{ backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#fff' }}>
                  {draft.cta || 'Learn More'}
                </Text>
              </View>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}
