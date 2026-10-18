import React from 'react';
import {
  View,
  Text,
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
import { formatDate } from '../../utils/formatting';
import { getCategoryColor } from '../../theme/colors';

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
  const drafts = useDraftStore((s) => s.getAllDrafts());
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
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 54,
          paddingBottom: 16,
          paddingHorizontal: 20,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
          Create Campaign
        </Text>
        <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
          Turn evidence and public records into a community-funded reach campaign
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 18, paddingBottom: 60 }}
      >
        {/* Guest Banner if not signed in */}
        {!isAuthenticated && (
          <Card
            style={{
              padding: 16,
              marginBottom: 20,
              backgroundColor: '#eef2ff',
              borderWidth: 1,
              borderColor: '#c7d2fe',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Ionicons name="information-circle-outline" size={20} color="#4f46e5" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 15, fontWeight: '700', color: '#1e1b4b' }}>
                Sign in to save and launch campaigns
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#3730a3', lineHeight: 19, marginBottom: 14 }}>
              Campaigns undergo editorial and evidence review before funding. Please sign in to draft and manage your campaign.
            </Text>
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
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>
          Start a New Campaign
        </Text>

        <View style={{ flexDirection: 'column', gap: 12, marginBottom: 26 }}>
          {/* Card 1: Create Manually */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStartManual}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#e2e8f0',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="create-outline" size={24} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                Create Manually
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                Step-by-step editorial composer with citations and ad previews
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>

          {/* Card 2: Create with Your Voice */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleStartVoice}
            style={{
              backgroundColor: '#fff',
              borderRadius: 16,
              padding: 18,
              borderWidth: 1.5,
              borderColor: '#e2e8f0',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#eef2ff',
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: 14,
              }}
            >
              <Ionicons name="mic" size={24} color="#4f46e5" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}>
                  Create with Your Voice
                </Text>
                <View
                  style={{
                    backgroundColor: '#e0e7ff',
                    borderRadius: 6,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '700', color: '#4338ca' }}>
                    AI Guided
                  </Text>
                </View>
              </View>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>
                Speak your answers to 4 guided questions and let AI formulate your campaign draft
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#94a3b8" />
          </TouchableOpacity>
        </View>

        {/* Section: Saved Drafts */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
            Saved Drafts
          </Text>
          <Text style={{ fontSize: 12, color: '#64748b', fontWeight: '600' }}>
            {drafts.length} {drafts.length === 1 ? 'draft' : 'drafts'}
          </Text>
        </View>

        {drafts.length === 0 ? (
          <Card style={{ padding: 24, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="document-text-outline" size={38} color="#cbd5e1" />
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#64748b', marginTop: 10 }}>
              No saved drafts yet
            </Text>
            <Text style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', marginTop: 4, maxWidth: 260 }}>
              Drafts are autosaved locally and synced when online so you can safely leave and return at any time.
            </Text>
          </Card>
        ) : (
          <View style={{ flexDirection: 'column', gap: 10 }}>
            {drafts.map((d) => {
              const catColor = getCategoryColor(d.category || 'community');
              return (
                <Card
                  key={d.id}
                  style={{
                    padding: 16,
                    borderWidth: 1,
                    borderColor: '#e2e8f0',
                  }}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text
                        style={{ fontSize: 16, fontWeight: '700', color: '#0f172a' }}
                        numberOfLines={2}
                      >
                        {d.title || 'Untitled Draft'}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, flexWrap: 'wrap', gap: 6 }}>
                        <View
                          style={{
                            backgroundColor: catColor + '18',
                            paddingHorizontal: 8,
                            paddingVertical: 2,
                            borderRadius: 6,
                          }}
                        >
                          <Text style={{ fontSize: 11, fontWeight: '700', color: catColor }}>
                            {d.category ? d.category.replace('_', ' ').toUpperCase() : 'COMMUNITY'}
                          </Text>
                        </View>
                        <Text style={{ fontSize: 12, color: '#4f46e5', fontWeight: '600' }}>
                          {STEP_LABELS[d.step || 1] || `Step ${d.step || 1}`}
                        </Text>
                        <Text style={{ fontSize: 12, color: '#94a3b8' }}>•</Text>
                        <Text style={{ fontSize: 12, color: '#64748b' }}>
                          Saved {formatDate(d.updatedAt)}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDelete(d.id, d.title)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>

                  {d.summary ? (
                    <Text
                      style={{ fontSize: 13, color: '#475569', marginTop: 8, lineHeight: 18 }}
                      numberOfLines={2}
                    >
                      {d.summary}
                    </Text>
                  ) : null}

                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 14 }}>
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
