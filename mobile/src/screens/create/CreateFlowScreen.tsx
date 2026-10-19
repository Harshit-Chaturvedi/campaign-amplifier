import React, { useState, useEffect, useRef } from 'react';
import {
  View,
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
import { colors, fonts, tokens } from '../../theme/tokens';
import { Headline, Subheading, BodyText, SmallCapsLabel, MetaLabel, Text } from '../../components/ui/Typography';

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
  const remapDraftId = useDraftStore((s) => s.remapDraftId);

  const [activeDraftId, setActiveDraftId] = useState<string>(draftId);
  const draftIdRef = useRef<string>(draftId);
  draftIdRef.current = activeDraftId;

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

  const [saveStatus, setSaveStatus] = useState<'saved_local' | 'synced' | 'saving' | 'error'>('saved_local');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);
  const debounceTimerRef = useRef<any>(null);

  const buildPatchPayload = (d: Partial<CampaignDraft>) => {
    const patchPayload: any = {
      title: d.title,
      category: d.category,
      creator_name: d.creatorName,
      summary: d.summary,
      cover_url: d.coverUrl,
      headline: d.headline,
      ad_description: d.adDescription,
      cta: d.cta,
      draft_step: d.step,
      duration_days: d.durationDays || 30,
      reach: {
        locations: d.locations || ['Cook County'],
        interests: d.interests || ['Public Health & Clean Water'],
        channels: d.channels || ['Meta', 'Instagram'],
        budget_alloc: d.budgetAllocation || { Meta: 60, Instagram: 40 },
      },
      story_blocks: d.storyBlocks?.map((b: any, idx: number) => ({
        id: b.id || `blk-${idx}`,
        position: idx,
        type: b.type,
        content: b,
      })),
      sources: d.sources,
    };

    if (d.fundingGoal && d.fundingGoal >= 500) {
      patchPayload.funding_goal = d.fundingGoal;
    }
    return patchPayload;
  };

  // Autosave handler (debounce 800ms)
  const triggerAutosave = (updated: Partial<CampaignDraft>, nextStep?: number) => {
    const currentId = draftIdRef.current;
    const nextDraft: CampaignDraft = {
      ...(existingDraft || {}),
      ...draftState,
      ...updated,
      id: currentId,
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
      let targetId = draftIdRef.current;
      const patchPayload = buildPatchPayload(nextDraft);

      try {
        const res = await apiClient.patchDraft(targetId, patchPayload);
        if (res.isOffline) {
          setSaveStatus('saved_local');
        } else {
          setSaveStatus('synced');
        }
      } catch (err: any) {
        if (err.status === 404) {
          // Draft not found on server -> auto-recover by creating draft and remapping
          try {
            const createRes = await apiClient.createDraft({
              title: nextDraft.title,
              category: nextDraft.category,
              creator_name: nextDraft.creatorName,
              summary: nextDraft.summary,
              funding_goal: nextDraft.fundingGoal,
            });

            if (createRes.draft && createRes.draft.id && !createRes.isOffline) {
              const newServerId = createRes.draft.id;
              remapDraftId(targetId, newServerId);
              draftIdRef.current = newServerId;
              setActiveDraftId(newServerId);
              navigation.setParams({ draftId: newServerId });

              // Retry PATCH once
              const retryRes = await apiClient.patchDraft(newServerId, patchPayload);
              if (retryRes.isOffline) {
                setSaveStatus('saved_local');
              } else {
                setSaveStatus('synced');
              }
              return;
            }
          } catch {
            setSaveStatus('error');
            return;
          }
        }
        if (err.isHttpError || err.status) {
          setSaveStatus('error');
        } else {
          setSaveStatus('saved_local');
        }
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
    let targetId = draftIdRef.current;
    const patchPayload = buildPatchPayload({ ...draftState, id: targetId, step: 5 });

    try {
      // 1. Immediately sync latest draft payload to backend
      try {
        await apiClient.patchDraft(targetId, patchPayload);
      } catch (patchErr: any) {
        if (patchErr.status === 404) {
          // Draft not found on server -> auto-recover by creating draft and remapping
          const createRes = await apiClient.createDraft({
            title: draftState.title,
            category: draftState.category,
            creator_name: draftState.creatorName,
            summary: draftState.summary,
            funding_goal: draftState.fundingGoal,
          });

          if (createRes.draft && createRes.draft.id && !createRes.isOffline) {
            const newServerId = createRes.draft.id;
            remapDraftId(targetId, newServerId);
            draftIdRef.current = newServerId;
            targetId = newServerId;
            setActiveDraftId(newServerId);
            navigation.setParams({ draftId: newServerId });
            await apiClient.patchDraft(newServerId, patchPayload);
          } else {
            throw patchErr;
          }
        } else {
          throw patchErr;
        }
      }

      // 2. Call backend transition endpoint
      const submitRes = await apiClient.submitDraft(targetId);

      // 3. Mark draft locally as submitted
      saveDraft({
        ...draftState,
        id: targetId,
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
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar barStyle="dark-content" />

      {/* Shared Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 12,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
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
              borderRadius: tokens.radius.sm,
              backgroundColor: colors.paperSecondary,
              borderWidth: 1,
              borderColor: colors.hairline,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="arrow-back" size={18} color={colors.ink} />
          </TouchableOpacity>

          <View style={{ alignItems: 'center' }}>
            <Headline style={{ fontSize: 16, color: colors.ink }}>
              Step {currentStep} of 5: {STEPS[currentStep - 1]?.title}
            </Headline>
            {/* Autosave status pill */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
              <Ionicons
                name={
                  saveStatus === 'synced'
                    ? 'cloud-done-outline'
                    : saveStatus === 'saving'
                    ? 'sync-outline'
                    : saveStatus === 'error'
                    ? 'alert-circle-outline'
                    : 'save-outline'
                }
                size={12}
                color={
                  saveStatus === 'synced'
                    ? colors.positive
                    : saveStatus === 'saving'
                    ? colors.accent
                    : saveStatus === 'error'
                    ? colors.warning
                    : colors.mutedInk
                }
              />
              <Text
                style={{
                  fontSize: 11,
                  fontFamily: fonts.sansMedium,
                  color:
                    saveStatus === 'synced'
                      ? colors.positive
                      : saveStatus === 'saving'
                      ? colors.accent
                      : saveStatus === 'error'
                      ? colors.warning
                      : colors.mutedInk,
                }}
              >
                {saveStatus === 'synced'
                  ? 'Saved'
                  : saveStatus === 'saving'
                  ? 'Saving…'
                  : saveStatus === 'error'
                  ? "Couldn't sync, retrying"
                  : 'Saved'}
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
              borderRadius: tokens.radius.sm,
              backgroundColor: colors.paperSecondary,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <SmallCapsLabel style={{ fontSize: 11, color: colors.mutedInk }}>Close</SmallCapsLabel>
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
                  height: 3,
                  borderRadius: 1.5,
                  backgroundColor: isActive
                    ? colors.accent
                    : isCompleted
                    ? colors.hairlineDark
                    : colors.hairline,
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
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
            padding: tokens.spacing.md,
            paddingBottom: Platform.OS === 'ios' ? 32 : tokens.spacing.md,
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
