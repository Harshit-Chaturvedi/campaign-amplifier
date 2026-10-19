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
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useDraftStore, CampaignDraft } from '../../store/useDraftStore';
import { useAuthStore } from '../../store/useAuthStore';
import { apiClient } from '../../api/client';
import { Step1Basics } from './Step1Basics';
import { Step2Story } from './Step2Story';
import { Step3Visuals } from './Step3Visuals';
import { Step4Reach } from './Step4Reach';
import { Step5Submit } from './Step5Submit';
import { SubmitConfirmationModal } from './SubmitConfirmationModal';
import { Button } from '../../components/ui/Button';

const STEPS = [
  { step: 1, title: 'Basics' },
  { step: 2, title: 'Story' },
  { step: 3, title: 'Visuals' },
  { step: 4, title: 'Reach' },
  { step: 5, title: 'Submit' },
];

export function CreateFlowScreen({ route, navigation }: any) {
  const { draftId, step: initialStep = 1 } = route.params || {};
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Creating a campaign requires signing in.', [
        { text: 'Cancel', onPress: () => navigation.goBack() },
        { text: 'Sign In', onPress: () => navigation.navigate('Login') },
      ]);
    }
  }, [isAuthenticated]);

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
      locations: ['Cook County'],
      interests: ['Public Health & Clean Water'],
      channels: ['Meta', 'Instagram'],
      budgetAllocation: { Meta: 60, Instagram: 40 },
      durationDays: 30,
    }
  );

  const [saveStatus, setSaveStatus] = useState<'saved_local' | 'synced' | 'saving'>('saved_local');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
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
          duration_days: nextDraft.durationDays || 30,
          reach: {
            locations: nextDraft.locations || ['Cook County'],
            interests: nextDraft.interests || ['Public Health & Clean Water'],
            channels: nextDraft.channels || ['Meta', 'Instagram'],
            budget_alloc: nextDraft.budgetAllocation || { Meta: 60, Instagram: 40 },
          },
          story_blocks: nextDraft.storyBlocks?.map((b: any, idx: number) => ({
            id: b.id || `blk-${idx}`,
            position: idx,
            type: b.type,
            content: b,
          })),
          sources: nextDraft.sources,
        };

        if (nextDraft.fundingGoal && nextDraft.fundingGoal >= 500) {
          patchPayload.funding_goal = nextDraft.fundingGoal;
        }

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
      return true;
    }
    if (currentStep === 3) {
      return true;
    }
    if (currentStep === 4) {
      const chs = draftState.channels || ['Meta', 'Instagram'];
      const alloc = draftState.budgetAllocation || { Meta: 60, Instagram: 40 };
      const sum = chs.reduce((s, c) => s + (alloc[c] || 0), 0);
      return chs.length > 0 && sum === 100;
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

    if (currentStep === 4) {
      const chs = draftState.channels || [];
      if (chs.length === 0) {
        Alert.alert('Select Channels', 'Please select at least one advertising channel.');
        return;
      }
      const alloc = draftState.budgetAllocation || {};
      const sum = chs.reduce((s, c) => s + (alloc[c] || 0), 0);
      if (sum !== 100) {
        Alert.alert(
          'Invalid Budget Allocation',
          `Budget allocation must sum to exactly 100% (currently ${sum}%). Please adjust before continuing.`
        );
        return;
      }
    }

    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      triggerAutosave({ step: next }, next);
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

  // Submit for review handler
  const handleSubmitForReview = async () => {
    if (!draftState.fundingGoal || draftState.fundingGoal < 500) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      Alert.alert('Required Field', 'Please enter a funding goal of at least $500.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Immediately sync latest draft payload to backend
      const patchPayload: any = {
        title: draftState.title,
        category: draftState.category,
        creator_name: draftState.creatorName,
        summary: draftState.summary,
        cover_url: draftState.coverUrl,
        headline: draftState.headline,
        ad_description: draftState.adDescription,
        cta: draftState.cta,
        draft_step: 5,
        funding_goal: draftState.fundingGoal,
        duration_days: draftState.durationDays || 30,
        reach: {
          locations: draftState.locations || ['Cook County'],
          interests: draftState.interests || ['Public Health & Clean Water'],
          channels: draftState.channels || ['Meta', 'Instagram'],
          budget_alloc: draftState.budgetAllocation || { Meta: 60, Instagram: 40 },
        },
        story_blocks: draftState.storyBlocks?.map((b: any, idx: number) => ({
          id: b.id || `blk-${idx}`,
          position: idx,
          type: b.type,
          content: b,
        })),
        sources: draftState.sources,
      };

      await apiClient.patchDraft(draftId, patchPayload);

      // 2. Call backend transition endpoint
      const submitRes = await apiClient.submitDraft(draftId);

      // 3. Mark draft locally as submitted
      saveDraft({
        ...draftState,
        id: draftId,
        step: 5,
      });

      setSaveStatus('synced');
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
      setShowConfirmation(true);
    } catch (err: any) {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
      const msg = err.message || 'Submission failed. Please check your fields and try again.';
      if (msg.toLowerCase().includes('title')) {
        Alert.alert('Missing Title', msg, [{ text: 'Go to Basics', onPress: () => setCurrentStep(1) }]);
      } else if (msg.toLowerCase().includes('goal') || msg.toLowerCase().includes('500')) {
        Alert.alert('Invalid Funding Goal', msg);
      } else if (msg.toLowerCase().includes('channel') || msg.toLowerCase().includes('reach')) {
        Alert.alert('Targeting Settings', msg, [{ text: 'Go to Reach', onPress: () => setCurrentStep(4) }]);
      } else {
        Alert.alert('Submission Error', msg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSave = () => {
    triggerAutosave(draftState);
    Alert.alert('Draft Saved', 'Your campaign draft has been saved. You can resume editing anytime.');
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
            accessibilityRole="button"
            accessibilityLabel="Go back to previous step"
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
            accessibilityRole="button"
            accessibilityLabel="Close draft and exit"
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
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ padding: 18, paddingBottom: currentStep === 5 ? 60 : 130 }}
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

          {currentStep === 4 && (
            <Step4Reach draft={draftState} onChange={handleFieldChange} />
          )}

          {currentStep === 5 && (
            <Step5Submit
              draft={draftState}
              onChange={handleFieldChange}
              onBack={goToPrevStep}
              onSaveAsDraft={handleManualSave}
              onSubmitForReview={handleSubmitForReview}
              isSubmitting={isSubmitting}
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Sticky Action Bar (visible on Steps 1 to 4; Step 5 has its own full action buttons) */}
      {currentStep < 5 && (
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
              title={currentStep === 4 ? 'Continue to Submit' : 'Continue'}
              variant="primary"
              size="md"
              icon="arrow-forward"
              iconPosition="right"
              disabled={!canContinue()}
              onPress={goToNextStep}
              fullWidth
            />
          </View>
        </View>
      )}

      {/* Confirmation Modal */}
      <SubmitConfirmationModal
        visible={showConfirmation}
        campaignTitle={draftState.title || 'Untitled Campaign'}
        campaignId={draftId}
        fundingGoal={draftState.fundingGoal || 0}
        onGoToMyCampaigns={() => {
          setShowConfirmation(false);
          navigation.navigate('ProfileTab');
        }}
        onGoHome={() => {
          setShowConfirmation(false);
          navigation.navigate('HomeTab');
        }}
      />
    </KeyboardAvoidingView>
  );
}
