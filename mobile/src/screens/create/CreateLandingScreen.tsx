import React, { useMemo } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../store/useAuthStore';
import { useDraftStore, CampaignDraft } from '../../store/useDraftStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import {
  Headline,
  Subheading,
  BodyText,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { formatDate } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';
import { colors, fonts, tokens } from '../../theme/tokens';

const STEP_LABELS: Record<number, string> = {
  1: 'Step 1: Basics',
  2: 'Step 2: Story & Evidence',
  3: 'Step 3: Visuals & Creatives',
  4: 'Step 4: Reach & Distribution',
  5: 'Step 5: Goal & Review',
};

export function CreateLandingScreen({ navigation }: any) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const draftsMap = useDraftStore((s) => s.drafts);
  const drafts = useMemo(() => {
    return Object.values(draftsMap).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }, [draftsMap]);
  const deleteDraft = useDraftStore((s) => s.deleteDraft);
  const setActiveDraft = useDraftStore((s) => s.setActiveDraft);

  const handleStartManual = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'You can browse campaigns as a guest, but creating a campaign requires signing in so your drafts and campaigns are linked to your account.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    // Start fresh draft
    const newId = `cmp-${Date.now().toString(36)}`;
    setActiveDraft(newId);
    navigation.navigate('CreateFlow', { draftId: newId, step: 1 });
  };

  const handleStartVoice = () => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Campaigns undergo editorial review. Please sign in or create an account to start creating campaigns.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }
    navigation.navigate('VoiceDraft');
  };

  const handleResume = (draft: CampaignDraft) => {
    setActiveDraft(draft.id);
    navigation.navigate('CreateFlow', {
      draftId: draft.id,
      step: draft.step || 1,
    });
  };

  const handleDelete = (id: string, title: string) => {
    Alert.alert(
      'Delete Draft',
      `Are you sure you want to delete "${title || 'Untitled Draft'}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteDraft(id),
        },
      ]
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 54,
          paddingBottom: 16,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
        }}
      >
        <Headline style={{ fontSize: 24, color: colors.ink }}>
          Create Campaign
        </Headline>
        <MetaLabel style={{ marginTop: 4 }}>
          Turn evidence and public records into a community-funded reach campaign
        </MetaLabel>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: tokens.spacing.lg, paddingBottom: 60 }}
      >
        {/* Guest Banner if not signed in */}
        {!isAuthenticated && (
          <Card
            style={{
              padding: tokens.spacing.md,
              marginBottom: tokens.spacing.lg,
              backgroundColor: colors.paperSecondary,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Subheading style={{ fontSize: 15, color: colors.ink }}>
                Sign in to save and launch campaigns
              </Subheading>
            </View>
            <BodyText style={{ fontSize: 13, color: colors.mutedInk, lineHeight: 19, marginBottom: 14 }}>
              Campaigns undergo editorial and evidence review before funding. Please sign in to draft and manage your campaign.
            </BodyText>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Sign In"
                  variant="primary"
                  size="sm"
                  onPress={() => navigation.navigate('Login')}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Create Account"
                  variant="outline"
                  size="sm"
                  onPress={() => navigation.navigate('Register')}
                  fullWidth
                />
              </View>
            </View>
          </Card>
        )}

        {/* Section: Start New Campaign */}
        <SmallCapsLabel style={{ fontSize: 12, color: colors.ink, marginBottom: 10 }}>
          START A NEW CAMPAIGN
        </SmallCapsLabel>

        <View style={{ flexDirection: 'column', gap: 10, marginBottom: tokens.spacing.xl }}>
          {/* Card 1: Create Manually */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Create Manually: step-by-step editorial composer"
            activeOpacity={0.8}
            onPress={handleStartManual}
            style={{
              backgroundColor: colors.surface,
              borderRadius: tokens.radius.md,
              padding: tokens.spacing.md,
              borderWidth: 1,
              borderColor: colors.hairline,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: tokens.radius.sm,
                backgroundColor: colors.paperSecondary,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: tokens.spacing.md,
              }}
            >
              <Ionicons name="create-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                Create Manually
              </Text>
              <MetaLabel style={{ marginTop: 2 }}>
                Step-by-step editorial composer with citations and ad previews
              </MetaLabel>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedInk} />
          </TouchableOpacity>

          {/* Card 2: Create with Your Voice */}
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Create with Your Voice: guided questions and AI formulation"
            activeOpacity={0.8}
            onPress={handleStartVoice}
            style={{
              backgroundColor: colors.surface,
              borderRadius: tokens.radius.md,
              padding: tokens.spacing.md,
              borderWidth: 1,
              borderColor: colors.hairline,
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: tokens.radius.sm,
                backgroundColor: colors.paperSecondary,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: tokens.spacing.md,
              }}
            >
              <Ionicons name="mic-outline" size={22} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                  Create with Your Voice
                </Text>
                <View
                  style={{
                    backgroundColor: colors.paperSecondary,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                    borderRadius: tokens.radius.xs,
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                  }}
                >
                  <SmallCapsLabel style={{ fontSize: 9, color: colors.accent }}>
                    AI GUIDED
                  </SmallCapsLabel>
                </View>
              </View>
              <MetaLabel style={{ marginTop: 2 }}>
                Speak your answers to 4 guided questions and let AI formulate your campaign draft
              </MetaLabel>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedInk} />
          </TouchableOpacity>
        </View>

        {/* Section: Saved Drafts */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
            SAVED DRAFTS
          </SmallCapsLabel>
          <MetaLabel>
            {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
          </MetaLabel>
        </View>

        {drafts.length === 0 ? (
          <Card style={{ padding: tokens.spacing.xl, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={32} color={colors.secondaryCaption} />
            <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.mutedInk, marginTop: 10 }}>
              No saved drafts yet
            </Text>
            <MetaLabel style={{ textAlign: 'center', marginTop: 4, maxWidth: 260 }}>
              Drafts are autosaved locally and synced when online so you can safely leave and return at any time.
            </MetaLabel>
          </Card>
        ) : (
          <View style={{ flexDirection: 'column', gap: 10 }}>
            {drafts.map((d) => {
              const catColor = getCategoryColor(d.category || 'community');
              return (
                <Card
                  key={d.id}
                  style={{
                    padding: tokens.spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text
                        style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}
                        numberOfLines={2}
                      >
                        {d.title || 'Untitled Draft'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                        <View
                          style={{
                            backgroundColor: colors.paperSecondary,
                            borderWidth: 1,
                            borderColor: colors.hairline,
                            paddingHorizontal: 6,
                            paddingVertical: 1,
                            borderRadius: tokens.radius.xs,
                          }}
                        >
                          <SmallCapsLabel style={{ fontSize: 10, color: colors.ink }}>
                            {d.category ? d.category.replace('_', ' ').toUpperCase() : 'COMMUNITY'}
                          </SmallCapsLabel>
                        </View>
                        <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.accent }}>
                          {STEP_LABELS[d.step || 1] || `Step ${d.step || 1}`}
                        </Text>
                        <MetaLabel>•</MetaLabel>
                        <MetaLabel>
                          Saved {formatDate(d.updatedAt)}
                        </MetaLabel>
                      </View>
                    </View>

                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Delete draft ${d.title || 'Untitled Draft'}`}
                      onPress={() => handleDelete(d.id, d.title)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.danger} />
                    </TouchableOpacity>
                  </View>

                  {d.summary ? (
                    <BodyText
                      style={{ fontSize: 13, color: colors.mutedInk, marginTop: 8, lineHeight: 18 }}
                      numberOfLines={2}
                    >
                      {d.summary}
                    </BodyText>
                  ) : null}

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 12 }}>
                    <Button
                      title="Resume Draft"
                      size="sm"
                      variant="primary"
                      icon="arrow-forward"
                      iconPosition="right"
                      onPress={() => handleResume(d)}
                    />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
