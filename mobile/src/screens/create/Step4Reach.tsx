import React from 'react';
import {
  View,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import {
  Headline,
  Subheading,
  BodyText,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { CampaignDraft } from '../../store/useDraftStore';
import { colors, fonts, tokens } from '../../theme/tokens';

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
  { id: 'Meta', name: 'Meta (Facebook)', icon: 'logo-facebook' },
  { id: 'Instagram', name: 'Instagram', icon: 'logo-instagram' },
  { id: 'Reddit', name: 'Reddit', icon: 'logo-reddit' },
  { id: 'YouTube', name: 'YouTube', icon: 'logo-youtube' },
  { id: 'X', name: 'X (Twitter)', icon: 'logo-twitter' },
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
      <View style={{ marginBottom: tokens.spacing.lg }}>
        <Headline style={{ fontSize: 22, color: colors.ink }}>
          Audience & Reach
        </Headline>
        <MetaLabel style={{ marginTop: 4 }}>
          Define who should see your message and how budget should be distributed across social channels.
        </MetaLabel>
      </View>

      {/* SECTION 1: YOU CHOOSE */}
      <View
        style={{
          borderLeftWidth: 3,
          borderLeftColor: colors.accent,
          paddingLeft: 10,
          marginBottom: tokens.spacing.md,
        }}
      >
        <SmallCapsLabel style={{ fontSize: 11, color: colors.accent }}>
          SECTION 1: YOU CHOOSE
        </SmallCapsLabel>
        <Subheading style={{ fontSize: 15, color: colors.ink, marginTop: 2 }}>
          Your Desired Reach Profile
        </Subheading>
      </View>

      {/* 1. Locations */}
      <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="location-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
            Target Locations
          </Text>
        </View>
        <MetaLabel style={{ marginBottom: 10 }}>
          Select the geographic areas where your ad messages should be displayed.
        </MetaLabel>
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
                  borderRadius: tokens.radius.xs,
                  backgroundColor: isSelected ? colors.surface : colors.paperSecondary,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.hairline,
                }}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={13} color={colors.accent} style={{ marginRight: 5 }} />
                )}
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: isSelected ? fonts.sansSemiBold : fonts.sansRegular,
                    color: isSelected ? colors.accent : colors.ink,
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
      <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="sparkles-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
            Audience Interests
          </Text>
        </View>
        <MetaLabel style={{ marginBottom: 10 }}>
          Connect with audiences engaged in related civic, local, and community topics.
        </MetaLabel>
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
                  borderRadius: tokens.radius.xs,
                  backgroundColor: isSelected ? colors.surface : colors.paperSecondary,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.hairline,
                }}
              >
                <Ionicons
                  name={isSelected ? 'checkbox-outline' : 'square-outline'}
                  size={14}
                  color={isSelected ? colors.accent : colors.mutedInk}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: isSelected ? fonts.sansSemiBold : fonts.sansRegular,
                    color: isSelected ? colors.accent : colors.ink,
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
      <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="pie-chart-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
              Advertising Channels
            </Text>
          </View>
          <TouchableOpacity
            onPress={distributeEvenly}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: tokens.radius.xs,
              backgroundColor: colors.paperSecondary,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <SmallCapsLabel style={{ fontSize: 10, color: colors.accent }}>
              DISTRIBUTE EVENLY
            </SmallCapsLabel>
          </TouchableOpacity>
        </View>

        <MetaLabel style={{ marginBottom: 12 }}>
          Choose active networks and allocate percentage of ad spend. Budget must total 100%.
        </MetaLabel>

        {/* Channel Selection Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
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
                  borderRadius: tokens.radius.xs,
                  backgroundColor: isSelected ? colors.surface : colors.paperSecondary,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.hairline,
                }}
              >
                <Ionicons
                  name={ch.icon as any}
                  size={14}
                  color={isSelected ? colors.accent : colors.mutedInk}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: isSelected ? fonts.sansSemiBold : fonts.sansRegular,
                    color: isSelected ? colors.accent : colors.ink,
                  }}
                >
                  {ch.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Budget Allocation Steppers per Selected Channel */}
        <View style={{ backgroundColor: colors.paperSecondary, borderRadius: tokens.radius.sm, padding: 12, borderWidth: 1, borderColor: colors.hairline }}>
          <SmallCapsLabel style={{ color: colors.ink, marginBottom: 8 }}>
            BUDGET ALLOCATION ACROSS CHANNELS
          </SmallCapsLabel>

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
                  borderBottomColor: colors.hairline,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons
                    name={chMeta?.icon as any || 'megaphone-outline'}
                    size={15}
                    color={colors.mutedInk}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={{ fontSize: 14, fontFamily: fonts.sansMedium, color: colors.ink }}>
                    {chMeta?.name || chId}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Decrease ${chMeta?.name || chId} budget allocation`}
                    onPress={() => adjustAllocation(chId, -5)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: tokens.radius.xs,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="remove" size={14} color={colors.ink} />
                  </TouchableOpacity>

                  <View style={{ minWidth: 46, alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontFamily: fonts.sansBold, color: colors.ink }}>
                      {pct}%
                    </Text>
                  </View>

                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={`Increase ${chMeta?.name || chId} budget allocation`}
                    onPress={() => adjustAllocation(chId, 5)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: tokens.radius.xs,
                      backgroundColor: colors.surface,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Ionicons name="add" size={14} color={colors.ink} />
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
              marginTop: 10,
              paddingTop: 6,
            }}
          >
            <SmallCapsLabel style={{ color: colors.ink }}>
              TOTAL ALLOCATION:
            </SmallCapsLabel>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 8,
                paddingVertical: 3,
                borderRadius: tokens.radius.xs,
                backgroundColor: isBudgetValid ? colors.surface : colors.dangerFaint,
                borderWidth: 1,
                borderColor: isBudgetValid ? colors.hairline : colors.border,
              }}
            >
              <Ionicons
                name={isBudgetValid ? 'checkmark-circle-outline' : 'alert-circle-outline'}
                size={14}
                color={isBudgetValid ? colors.positive : colors.danger}
                style={{ marginRight: 4 }}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontFamily: fonts.sansBold,
                  color: isBudgetValid ? colors.positive : colors.danger,
                }}
              >
                {currentTotalPct}%
              </Text>
            </View>
          </View>

          {!isBudgetValid && (
            <View style={{ marginTop: 8, backgroundColor: colors.dangerFaint, padding: 8, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.border }}>
              <MetaLabel style={{ color: colors.danger }}>
                Budget allocations must total exactly 100% (currently {currentTotalPct}%). Tap "Distribute Evenly" or adjust manually.
              </MetaLabel>
            </View>
          )}
        </View>
      </Card>

      {/* 4. Campaign Duration */}
      <Card style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
          <Ionicons name="calendar-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
            Campaign Flight Duration
          </Text>
        </View>
        <MetaLabel style={{ marginBottom: 12 }}>
          How long ad campaigns run once funded and approved for launch.
        </MetaLabel>
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
                  borderRadius: tokens.radius.sm,
                  backgroundColor: isSelected ? colors.surface : colors.paperSecondary,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.hairline,
                }}
              >
                <View
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    borderWidth: 1.5,
                    borderColor: isSelected ? colors.accent : colors.hairlineDark,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 10,
                  }}
                >
                  {isSelected && (
                    <View
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: colors.accent,
                      }}
                    />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    {d.label}
                  </Text>
                  <MetaLabel style={{ marginTop: 2 }}>
                    {d.description}
                  </MetaLabel>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </Card>

      {/* SECTION 2: THE PLATFORM MAY FINALISE DURING REVIEW */}
      <View
        style={{
          borderLeftWidth: 3,
          borderLeftColor: colors.mutedInk,
          paddingLeft: 10,
          marginBottom: tokens.spacing.md,
        }}
      >
        <SmallCapsLabel style={{ fontSize: 11, color: colors.mutedInk }}>
          SECTION 2: THE PLATFORM MAY FINALISE DURING REVIEW
        </SmallCapsLabel>
        <Subheading style={{ fontSize: 15, color: colors.ink, marginTop: 2 }}>
          Platform Calibration & Safeguards
        </Subheading>
      </View>

      <Card style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md, backgroundColor: colors.paperSecondary }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
          <Ionicons name="shield-outline" size={18} color={colors.accent} style={{ marginRight: 8, marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
              Review Team Optimization & Compliance
            </Text>
            <BodyText style={{ fontSize: 13, color: colors.mutedInk, marginTop: 4, lineHeight: 18 }}>
              To ensure ad approvals across strict ad network policies (Meta, Reddit, Google), our review team may fine-tune the final parameters:
            </BodyText>
          </View>
        </View>

        <View style={{ gap: 6, paddingLeft: 8, marginTop: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={13} color={colors.mutedInk} style={{ marginRight: 6 }} />
            <BodyText style={{ fontSize: 12, color: colors.mutedInk }}>
              Bidding strategies, auction pacing, and impression distribution
            </BodyText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={13} color={colors.mutedInk} style={{ marginRight: 6 }} />
            <BodyText style={{ fontSize: 12, color: colors.mutedInk }}>
              Negative keyword exclusions and policy safety boundary checks
            </BodyText>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="chevron-forward" size={13} color={colors.mutedInk} style={{ marginRight: 6 }} />
            <BodyText style={{ fontSize: 12, color: colors.mutedInk }}>
              Cross-network demographic balancing to prevent click fatigue
            </BodyText>
          </View>
        </View>

        {/* Mandatory Copy Notice */}
        <View
          style={{
            marginTop: 12,
            padding: 10,
            backgroundColor: colors.surface,
            borderRadius: tokens.radius.xs,
            borderWidth: 1,
            borderColor: colors.hairline,
          }}
        >
          <BodyText
            style={{
              fontSize: 12,
              fontStyle: 'italic',
              color: colors.mutedInk,
              textAlign: 'center',
            }}
          >
            "Actual reach depends on inventory, prices, targeting, delivery and performance."
          </BodyText>
        </View>
      </Card>

      {/* AUDIENCE PREVIEW CARD */}
      <View style={{ marginBottom: 12 }}>
        <Headline style={{ fontSize: 18, color: colors.ink, marginBottom: 4 }}>
          Audience Preview
        </Headline>
        <MetaLabel style={{ marginBottom: 12 }}>
          Summary of intended recipients and sample ad layout. Promised audience sizes are never shown.
        </MetaLabel>

        <Card style={{ padding: tokens.spacing.md, backgroundColor: colors.surface }}>
          {/* Target Profile Summary */}
          <View style={{ marginBottom: 14 }}>
            <SmallCapsLabel style={{ color: colors.mutedInk, marginBottom: 6 }}>
              INTENDED AUDIENCE PROFILE
            </SmallCapsLabel>
            <BodyText style={{ fontSize: 14, color: colors.ink, lineHeight: 20 }}>
              Residents in <Text style={{ fontFamily: fonts.sansSemiBold }}>{locations.join(', ')}</Text> interested in{' '}
              <Text style={{ fontFamily: fonts.sansSemiBold }}>{interests.join(', ')}</Text>.
            </BodyText>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 6, flexWrap: 'wrap' }}>
              <MetaLabel>Active on:</MetaLabel>
              {channels.map((c) => (
                <View
                  key={c}
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: tokens.radius.xs,
                    backgroundColor: colors.paperSecondary,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                  }}
                >
                  <SmallCapsLabel style={{ fontSize: 10, color: colors.ink }}>
                    {c} ({budgetAllocation[c] || 0}%)
                  </SmallCapsLabel>
                </View>
              ))}
            </View>
          </View>

          {/* Sample Ad Mockup */}
          <View
            style={{
              borderRadius: tokens.radius.sm,
              overflow: 'hidden',
              borderWidth: 1,
              borderColor: colors.hairline,
              backgroundColor: colors.surface,
            }}
          >
            <View style={{ padding: 10, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.paperSecondary }}>
              <Ionicons name="megaphone-outline" size={15} color={colors.accent} style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 12, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                {draft.creatorName || 'Campaign Organizer'}
              </Text>
              <MetaLabel style={{ marginLeft: 4 }}>• Sponsored Ad</MetaLabel>
            </View>

            {draft.coverUrl ? (
              <Image
                source={{ uri: draft.coverUrl }}
                style={{ width: '100%', height: 140 }}
                resizeMode="cover"
              />
            ) : (
              <View style={{ height: 120, backgroundColor: colors.paperSecondary, alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="image-outline" size={28} color={colors.secondaryCaption} />
                <MetaLabel style={{ marginTop: 4 }}>Cover Visual</MetaLabel>
              </View>
            )}

            <View style={{ padding: 12 }}>
              <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }} numberOfLines={2}>
                {draft.headline || draft.title || 'Campaign Title'}
              </Text>
              <BodyText style={{ fontSize: 12, color: colors.mutedInk, marginTop: 4 }} numberOfLines={2}>
                {draft.adDescription || draft.summary || 'Summary and checkable facts for the public.'}
              </BodyText>
            </View>

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: 10,
                backgroundColor: colors.paperSecondary,
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
              }}
            >
              <MetaLabel>campaigns.app</MetaLabel>
              <View style={{ backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: tokens.radius.xs }}>
                <Text style={{ fontSize: 11, fontFamily: fonts.sansSemiBold, color: colors.surface }}>
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
