import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDraftStore, CampaignDraft } from '../../store/useDraftStore';
import { apiClient } from '../../api/client';
import { Step1Basics } from './Step1Basics';
import { Step2Story } from './Step2Story';
import { Step3Visuals } from './Step3Visuals';
import { Button } from '../../components/ui/Button';

const STEPS = [
  { step: 1, title: 'Basics' },
  { step: 2, title: 'Story' },
  { step: 3, title: 'Visuals' },
  { step: 4, title: 'Reach' },
  { step: 5, title: 'Goal' },
];

export function CreateFlowScreen({ route, navigation }: any) {
  const { draftId, step: initialStep = 1 } = route.params || {};

  const getDraft = useDraftStore((s) => s.getDraft);
  const saveDraft = useDraftStore((s) => s.saveDraft);
  const deleteDraft = useDraftStore((s) => s.deleteDraft);

  // Initialize draft state from store or defaults
  const existingDraft = getDraft(draftId);
  const [currentStep, setCurrentStep] = useState<number>(initialStep);
  const [draftState, setDraftState] = useState<Partial<CampaignDraft>>(
    existingDraft || {
      id: draftId,
      step: initialStep,
      title: '',
      category: 'environment',
      creatorName: '',
      summary: '',
      storyBlocks: [],
      sources: [],
      adImages: [],
      headline: '',
      adDescription: '',
      cta: 'Learn More',
    }
  );

  const [saveStatus, setSaveStatus] = useState<'saved_local' | 'synced' | 'saving'>('saved_local');
  const debounceTimerRef = useRef<any>(null);

  // Autosave handler (debounce 800ms)
  const triggerAutosave = (updated: Partial<CampaignDraft>, nextStep?: number) => {
    const nextDraft: CampaignDraft = {
      ...(existingDraft || {}),
      ...draftState,
      ...updated,
      id: draftId,
      step: nextStep ?? currentStep,
      updatedAt: new Date().toISOString(),
    } as CampaignDraft;

    setDraftState(nextDraft);
    // 1. Immediately persist locally via Zustand store
    saveDraft(nextDraft);
    setSaveStatus('saving');

    // 2. Debounce PATCH to backend if online
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const patchPayload: any = {
          title: nextDraft.title,
          category: nextDraft.category,
          creator_name: nextDraft.creatorName,
          summary: nextDraft.summary,
          cover_url: nextDraft.coverUrl,
          headline: nextDraft.headline,
          ad_description: nextDraft.adDescription,
          cta: nextDraft.cta,
          draft_step: nextDraft.step,
          story_blocks: nextDraft.storyBlocks?.map((b: any, idx: number) => ({
            id: b.id || `blk-${idx}`,
            position: idx,
            type: b.type,
            content: b,
          })),
          sources: nextDraft.sources,
        };

        const res = await apiClient.patchDraft(draftId, patchPayload);
        if (res.isOffline) {
          setSaveStatus('saved_local');
        } else {
          setSaveStatus('synced');
        }
      } catch {
        setSaveStatus('saved_local');
      }
    }, 800);
  };

  const handleFieldChange = (fields: any) => {
    triggerAutosave(fields);
  };

  // Step navigation validations
  const canContinue = () => {
    if (currentStep === 1) {
      return Boolean(draftState.title?.trim() && draftState.creatorName?.trim());
    }
    if (currentStep === 2) {
      return true; // Allow proceeding with draft story
    }
    if (currentStep === 3) {
      return true;
    }
    return true;
  };

  const goToNextStep = () => {
    if (currentStep === 1) {
      if (!draftState.title?.trim()) {
        Alert.alert('Required field', 'Please provide a campaign title.');
        return;
      }
      if (!draftState.creatorName?.trim()) {
        Alert.alert('Required field', 'Please provide your name or organization name.');
        return;
      }
    }

    if (currentStep < 3) {
      const next = currentStep + 1;
      setCurrentStep(next);
      triggerAutosave({ step: next }, next);
    } else if (currentStep === 3) {
      // Step 4 is Phase 5B; prompt explicitly notes:
      // "the Continue button on Step 3 goes to a temporary 'Step 4 coming next' screen ONLY inside this unfinished build"
      setCurrentStep(4);
      triggerAutosave({ step: 4 }, 4);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      triggerAutosave({ step: prev }, prev);
    } else {
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#f8fafc' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* Shared Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: 16,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity
            onPress={goToPrevStep}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={20} color="#0f172a" />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
              Step {currentStep} of 5: {STEPS[currentStep - 1]?.title}
            </Text>
            {/* Autosave status pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
              <Ionicons
                name={
                  saveStatus === 'synced'
                    ? 'cloud-done-outline'
                    : saveStatus === 'saving'
                    ? 'sync-outline'
                    : 'save-outline'
                }
                size={12}
                color={
                  saveStatus === 'synced'
                    ? '#16a34a'
                    : saveStatus === 'saving'
                    ? '#4f46e5'
                    : '#64748b'
                }
              />
              <Text
                style={{
                  fontSize: 11,
                  color:
                    saveStatus === 'synced'
                      ? '#16a34a'
                      : saveStatus === 'saving'
                      ? '#4f46e5'
                      : '#64748b',
                  fontWeight: '500',
                }}
              >
                {saveStatus === 'synced'
                  ? 'All changes synced'
                  : saveStatus === 'saving'
                  ? 'Saving changes...'
                  : 'Saved on this device'}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => navigation.navigate('CreateLanding')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 6,
              borderRadius: 8,
              backgroundColor: '#f1f5f9',
            }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Close</Text>
          </TouchableOpacity>
        </View>

        {/* 5-Step Progress Indicator */}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 12 }}>
          {STEPS.map((s) => {
            const isActive = s.step === currentStep;
            const isCompleted = s.step < currentStep;
            return (
              <View
                key={s.step}
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: isActive
                    ? '#4f46e5'
                    : isCompleted
                    ? '#818cf8'
                    : '#e2e8f0',
                }}
              />
            );
          })}
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 18, paddingBottom: 120 }}
      >
        {currentStep === 1 && (
          <Step1Basics draft={draftState} onChange={handleFieldChange} />
        )}

        {currentStep === 2 && (
          <Step2Story draft={draftState} onChange={handleFieldChange} />
        )}

        {currentStep === 3 && (
          <Step3Visuals draft={draftState} onChange={handleFieldChange} />
        )}

        {currentStep >= 4 && (
          <View
            style={{
              padding: 24,
              backgroundColor: '#fff',
              borderRadius: 16,
              borderWidth: 1,
              borderColor: '#e2e8f0',
              alignItems: 'center',
            }}
          >
            <Ionicons name="construct-outline" size={48} color="#4f46e5" />
            <Text style={{ fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 12 }}>
              Step {currentStep} Coming Next
            </Text>
            <Text
              style={{
                fontSize: 13,
                color: '#64748b',
                textAlign: 'center',
                marginTop: 6,
                lineHeight: 19,
                maxWidth: 280,
              }}
            >
              Steps 1-3 (Basics, Story & Citations, Visuals & Previews) are complete and saved. Steps 4 (Audience & Targeting) and 5 (Funding Goal & Review) will be built in Phase 5B.
            </Text>
            <View style={{ marginTop: 20 }}>
              <Button
                title="Return to Step 3 (Visuals)"
                variant="outline"
                size="sm"
                onPress={() => setCurrentStep(3)}
              />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom Sticky Action Bar */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          padding: 16,
          paddingBottom: Platform.OS === 'ios' ? 32 : 16,
          flexDirection: 'row',
          gap: 12,
        }}
      >
        {currentStep > 1 && (
          <Button
            title="Back"
            variant="secondary"
            size="md"
            onPress={goToPrevStep}
          />
        )}
        <View style={{ flex: 1 }}>
          <Button
            title={
              currentStep === 3
                ? 'Save & Continue'
                : currentStep > 3
                ? 'Done (Saved)'
                : 'Continue'
            }
            variant="primary"
            size="md"
            icon={currentStep <= 3 ? 'arrow-forward' : undefined}
            iconPosition="right"
            disabled={!canContinue()}
            onPress={goToNextStep}
            fullWidth
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
