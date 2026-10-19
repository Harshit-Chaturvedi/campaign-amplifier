import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Alert,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  useAudioRecorder,
  RecordingPresets,
  requestRecordingPermissionsAsync,
  getRecordingPermissionsAsync,
  setAudioModeAsync,
} from 'expo-audio';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { apiClient } from '../../api/client';
import { useDraftStore, CampaignDraft } from '../../store/useDraftStore';
import { useAuthStore } from '../../store/useAuthStore';
import { generateId } from '../../utils/formatting';
import { colors, fonts, tokens } from '../../theme/tokens';
import {
  Headline,
  Subheading,
  BodyText,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';

interface GuidedQuestion {
  id: number;
  question: string;
  subtitle: string;
  helperExample: string;
  demoAnswer: string;
}

const GUIDED_QUESTIONS: GuidedQuestion[] = [
  {
    id: 1,
    question: 'What is this about?',
    subtitle: 'Describe the specific issue, situation, or local policy problem.',
    helperExample: 'e.g. "Thirty public schools in this county still draw drinking water through lead pipes laid before 1970."',
    demoAnswer:
      'Thirty public schools in this county still draw drinking water through lead service lines installed before 1970. Testing last spring found elevated lead in eleven of them.',
  },
  {
    id: 2,
    question: 'Who should see it?',
    subtitle: 'Target audience: residents, commuters, parents, voters, or specific local communities.',
    helperExample: 'e.g. "Parents, teachers, and school-board voters in the county, aged 28 to 55."',
    demoAnswer:
      'Parents, teachers, and school-board voters in the county, aged 28 to 55, plus municipal leaders.',
  },
  {
    id: 3,
    question: 'Why does it matter?',
    subtitle: 'The community impact, urgency, consequences of inaction, or what changes if resolved.',
    helperExample: 'e.g. "The replacement programme is already funded at the state level, but districts have to apply before the deadline."',
    demoAnswer:
      'The replacement programme is already funded at the state level, but districts have to apply before the deadline, and most lack grant staff to do it.',
  },
  {
    id: 4,
    question: 'What evidence supports it?',
    subtitle: 'Public records, test results, meeting minutes, studies, or audit documents.',
    helperExample: 'e.g. "Documented in county water testing reports from last spring and state replacement fund records."',
    demoAnswer:
      'Documented in county water testing reports from last spring and the official state lead service line replacement fund records.',
  },
];

export function VoiceDraftScreen({ navigation }: any) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const saveDraft = useDraftStore((s) => s.saveDraft);
  const setActiveDraft = useDraftStore((s) => s.setActiveDraft);

  useEffect(() => {
    if (!isAuthenticated) {
      Alert.alert(
        'Sign in required',
        'Creating a campaign requires signing in so your drafts and campaigns are linked to your account.',
        [
          { text: 'Cancel', onPress: () => navigation.goBack() },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
    }
  }, [isAuthenticated]);

  // Guided questions state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<number, string>>({
    1: '',
    2: '',
    3: '',
    4: '',
  });

  // Permission & Recording State
  const [permissionStatus, setPermissionStatus] = useState<'undetermined' | 'granted' | 'denied'>('undetermined');
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isTranscribing, setIsTranscribing] = useState<boolean>(false);
  const [recordingDurationSec, setRecordingDurationSec] = useState<number>(0);
  const [isReviewStage, setIsReviewStage] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Pulse animation for recording indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerIntervalRef = useRef<any>(null);

  // expo-audio recorder hook
  const recorder = useAudioRecorder(
    RecordingPresets.HIGH_QUALITY,
    (status) => {
      // status callback if needed
    }
  );

  useEffect(() => {
    // Check initial permission status on mount
    checkMicrophonePermission();

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, []);

  const checkMicrophonePermission = async () => {
    try {
      const res = await getRecordingPermissionsAsync();
      if (res.granted) {
        setPermissionStatus('granted');
      } else if (res.status === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('undetermined');
      }
    } catch {
      setPermissionStatus('undetermined');
    }
  };

  const requestPermission = async () => {
    try {
      const res = await requestRecordingPermissionsAsync();
      if (res.granted) {
        setPermissionStatus('granted');
        setErrorMessage(null);
      } else {
        setPermissionStatus('denied');
        setErrorMessage(
          'Microphone permission denied. Microphone access is required to record audio. You can use demo mode with a canned sample draft or create manually.'
        );
      }
    } catch {
      setPermissionStatus('denied');
      setErrorMessage(
        'Unable to request microphone permissions. You can use demo mode or create manually.'
      );
    }
  };

  // Start recording answer
  const startRecording = async () => {
    if (permissionStatus !== 'granted') {
      const res = await requestRecordingPermissionsAsync();
      if (!res.granted) {
        setPermissionStatus('denied');
        setErrorMessage(
          'Microphone permission denied. Microphone access is required to record audio. You can use demo mode with a canned sample draft or create manually.'
        );
        return;
      }
      setPermissionStatus('granted');
    }

    try {
      await setAudioModeAsync({
        allowsRecording: true,
        playsInSilentMode: true,
      });

      await recorder.prepareToRecordAsync();
      recorder.record();

      setIsRecording(true);
      setRecordingDurationSec(0);
      setErrorMessage(null);

      // Pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.25, duration: 600, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      ).start();

      // Duration counter
      timerIntervalRef.current = setInterval(() => {
        setRecordingDurationSec((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setErrorMessage(
        'Recording could not start on this device. You can type your answer, use demo mode, or create manually.'
      );
    }
  };

  // Stop recording answer and transcribe with backend AI
  const stopRecording = async () => {
    let recordedUri = '';
    try {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      await recorder.stop();
      recordedUri = recorder.uri || '';
    } catch {
      // Ignore stop errors if already stopped
    } finally {
      setIsRecording(false);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }

    if (!recordedUri) {
      return;
    }

    // Call real backend transcription endpoint POST /ai/transcribe
    setIsTranscribing(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.transcribeAudio(recordedUri);
      if (res && res.transcript && res.transcript.trim()) {
        const currentQ = GUIDED_QUESTIONS[currentQuestionIndex];
        setAnswers((prev) => ({
          ...prev,
          [currentQ.id]: res.transcript.trim(),
        }));
      } else {
        setErrorMessage('Could not transcribe, please type your answer.');
      }
    } catch (err: any) {
      setErrorMessage('Could not transcribe, please type your answer.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleTextChange = (text: string) => {
    const currentQ = GUIDED_QUESTIONS[currentQuestionIndex];
    setAnswers((prev) => ({
      ...prev,
      [currentQ.id]: text,
    }));
  };

  const handleNextQuestion = () => {
    if (isRecording) {
      stopRecording();
    }

    if (currentQuestionIndex < GUIDED_QUESTIONS.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Proceed to review stage
      setIsReviewStage(true);
    }
  };

  const handlePrevQuestion = () => {
    if (isReviewStage) {
      setIsReviewStage(false);
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    } else {
      navigation.goBack();
    }
  };

  // Compile full transcript from answers without demoAnswer fallbacks
  const getCompiledTranscript = () => {
    const parts: string[] = [];
    if (answers[1] && answers[1].trim()) {
      parts.push(`What is this about: ${answers[1].trim()}`);
    }
    if (answers[2] && answers[2].trim()) {
      parts.push(`Who should see it: ${answers[2].trim()}`);
    }
    if (answers[3] && answers[3].trim()) {
      parts.push(`Why does it matter: ${answers[3].trim()}`);
    }
    if (answers[4] && answers[4].trim()) {
      parts.push(`What evidence supports it: ${answers[4].trim()}`);
    }
    return parts.join('\n\n');
  };

  // Build draft and ALWAYS land on Step 1 (funding goal is NEVER filled in by AI!)
  const populateAndLandOnStep1 = async (aiResult: {
    title: string;
    category: string;
    summary: string;
    tagline: string;
    target_audience: string;
    ad_headline: string;
    ad_description: string;
    suggested_sources: string[];
    suggested_channels: string[];
    demo_mode?: boolean;
  }) => {
    // 1. Create draft on server first to obtain server-assigned ID
    let serverId: string | null = null;
    try {
      const createRes = await apiClient.createDraft({
        title: aiResult.title.slice(0, 60),
        category: (aiResult.category as any) || 'health',
        creator_name: user?.name || 'Campaign Organizer',
        summary: aiResult.summary,
      });
      if (createRes.draft && createRes.draft.id && !createRes.isOffline) {
        serverId = createRes.draft.id;
      }
    } catch {
      // Handled below
    }

    if (!serverId) {
      Alert.alert('Connection Error', 'Could not reach the server. Check your connection and try again.');
      return;
    }

    const draftId = serverId;

    const newDraft: CampaignDraft = {
      id: draftId,
      step: 1, // ALWAYS land on Step 1!
      updatedAt: new Date().toISOString(),
      title: aiResult.title.slice(0, 60),
      category: (aiResult.category as any) || 'health',
      creatorName: user?.name || 'Campaign Organizer',
      summary: aiResult.summary,
      headline: aiResult.ad_headline.slice(0, 60),
      adDescription: aiResult.ad_description,
      cta: 'Learn More',
      storyBlocks: [
        {
          id: `blk-${generateId()}`,
          type: 'heading',
          text: 'The Situation & What Needs to Change',
          level: 2,
        },
        {
          id: `blk-${generateId()}`,
          type: 'paragraph',
          text: answers[1] || aiResult.summary,
        },
        {
          id: `blk-${generateId()}`,
          type: 'quote',
          text: aiResult.tagline || 'The documentation exists. Amplification puts it in front of people who can act.',
          cite: 'Community Campaign Brief',
        },
        {
          id: `blk-${generateId()}`,
          type: 'heading',
          text: 'Why This Matters to the Community',
          level: 2,
        },
        {
          id: `blk-${generateId()}`,
          type: 'paragraph',
          text: answers[3] || 'Every resident deserves checkable facts. Targeted digital reach ensures this message reaches decision makers and affected families.',
        },
        {
          id: `blk-${generateId()}`,
          type: 'heading',
          text: 'Grounded Evidence & Public Records',
          level: 2,
        },
        {
          id: `blk-${generateId()}`,
          type: 'paragraph',
          text: answers[4] || 'All claims in this campaign are drawn from public documentation and documented local records.',
        },
      ],
      sources: (aiResult.suggested_sources || []).map((url: string, idx: number) => ({
        id: `src-${generateId()}`,
        title: `Source Link ${idx + 1}`,
        url,
      })),
      adImages: [],
      locations: ['Cook County', 'Chicago Metro'],
      interests: [aiResult.category.replace('_', ' ') || 'Public Health'],
      channels: aiResult.suggested_channels || ['Meta', 'Instagram'],
      budgetAllocation: { Meta: 60, Instagram: 40 },
      durationDays: 30,
      // FUNDING GOAL IS NEVER FILLED IN BY AI!
      fundingGoal: undefined,
      isDemoSample: !!(aiResult as any).demo_mode || !!(aiResult as any).isDemoSample,
    };

    // 2. Save locally in Zustand
    saveDraft(newDraft);
    setActiveDraft(draftId);

    // 3. Sync full draft fields to server
    try {
      await apiClient.patchDraft(draftId, {
        title: newDraft.title,
        category: newDraft.category,
        creator_name: newDraft.creatorName,
        summary: newDraft.summary,
        headline: newDraft.headline,
        ad_description: newDraft.adDescription,
        cta: newDraft.cta,
        draft_step: 1,
        duration_days: 30,
        story_blocks: newDraft.storyBlocks?.map((b: any, idx: number) => ({
          id: b.id || `blk-${idx}`,
          position: idx,
          type: b.type,
          content: b,
        })),
        sources: newDraft.sources,
      });
    } catch {
      // Stored locally, will sync on autosave
    }

    // 4. ALWAYS land on editable Step 1! Never skip ahead to submission!
    navigation.replace('CreateFlow', { draftId, step: 1 });
  };

  // Handle AI draft generation
  const handleGenerateAIDraft = async () => {
    const transcript = getCompiledTranscript();
    if (!transcript.trim()) {
      Alert.alert(
        'Input required',
        'Please record or type an answer to at least one question before generating an AI draft, or tap "Use demo mode".'
      );
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const aiResult = await apiClient.generateVoiceDraft(transcript);
      await populateAndLandOnStep1(aiResult);
    } catch (err: any) {
      setErrorMessage(
        'AI drafting encountered an error. You can use demo mode with canned sample data or create manually.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  // Canned demo mode fallback - explicitly labelled Demo sample
  const handleUseDemoMode = async () => {
    setIsGenerating(true);
    const cannedAnswers = {
      1: '[Demo sample] Thirty public schools in this county still draw drinking water through lead service lines installed before 1970. Testing last spring found elevated lead in eleven of them.',
      2: '[Demo sample] Parents, teachers, and school-board voters in the county, aged 28 to 55, plus municipal leaders.',
      3: '[Demo sample] The replacement programme is already funded at the state level, but districts have to apply before the deadline, and most lack grant staff to do it.',
      4: '[Demo sample] Documented in county water testing reports from last spring and the official state lead service line replacement fund records.',
    };
    setAnswers(cannedAnswers);

    const cannedResult = {
      title: '[Demo sample] Clean Drinking Water for Every Public School',
      category: 'health',
      summary:
        '[Demo sample] Elevated lead was documented across 11 county public schools. State replacement funds are active but require immediate district application.',
      tagline: 'Fixing school drinking water with existing state infrastructure grants.',
      target_audience: 'Parents, teachers, and municipal voters in the school district.',
      ad_headline: '[Demo sample] Eleven schools. Elevated lead. One deadline.',
      ad_description:
        'The state will pay to replace the pipes, but only if the district applies. See the water test results.',
      suggested_sources: [], // NEVER invent sources; empty list so creator adds sources manually in Step 2
      suggested_channels: ['Meta', 'Instagram', 'Reddit'],
      demo_mode: true,
      isDemoSample: true,
    };

    await populateAndLandOnStep1(cannedResult);
    setIsGenerating(false);
  };

  // Create manually fallback
  const handleCreateManually = async () => {
    try {
      const res = await apiClient.createDraft({
        title: '',
        category: 'community',
        creator_name: user?.name || 'Campaign Organizer',
      });
      if (!res.draft || !res.draft.id || res.isOffline) {
        Alert.alert('Connection Error', 'Could not reach the server. Check your connection and try again.');
        return;
      }
      const draftId = res.draft.id;
      saveDraft({
        id: draftId,
        step: 1,
        title: '',
        category: 'community',
        creatorName: user?.name || '',
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
        fundingGoal: undefined,
      });
      setActiveDraft(draftId);
      navigation.replace('CreateFlow', { draftId, step: 1 });
    } catch {
      Alert.alert('Connection Error', 'Could not reach the server. Check your connection and try again.');
    }
  };

  const currentQ = GUIDED_QUESTIONS[currentQuestionIndex];
  const currentAnswer = answers[currentQ?.id] || '';

  // Format timer MM:SS
  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.paper }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: tokens.spacing.lg,
          backgroundColor: colors.surface,
          borderBottomWidth: 1,
          borderBottomColor: colors.hairline,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <TouchableOpacity
          onPress={handlePrevQuestion}
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
            Create with Your Voice
          </Headline>
          <MetaLabel style={{ marginTop: 1 }}>
            {isReviewStage
              ? 'Review Transcript'
              : `Question ${currentQuestionIndex + 1} of ${GUIDED_QUESTIONS.length}`}
          </MetaLabel>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
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
          <SmallCapsLabel style={{ fontSize: 11, color: colors.mutedInk }}>Cancel</SmallCapsLabel>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: tokens.spacing.lg, paddingBottom: 100 }}
      >
        {/* Permission Request Card (shown if permission is not yet granted) */}
        {permissionStatus === 'undetermined' && (
          <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.md, backgroundColor: colors.paperSecondary }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="mic-outline" size={20} color={colors.accent} style={{ marginRight: 8 }} />
              <Subheading style={{ fontSize: 15, color: colors.ink }}>
                Microphone Permission Explanation
              </Subheading>
            </View>
            <BodyText style={{ fontSize: 13, color: colors.mutedInk, lineHeight: 19, marginBottom: 14 }}>
              Campaign Amplifier requires microphone access to record your spoken answers to 4 guided questions. Your answers will be transcribed to draft your title, story, and ad creative. You will always review and edit everything on Step 1.
            </BodyText>
            <Button
              title="Grant Microphone Access"
              variant="primary"
              size="md"
              icon="mic-outline"
              onPress={requestPermission}
            />
          </Card>
        )}

        {/* Fallback Banner (if permission denied or error occurs) */}
        {(permissionStatus === 'denied' || errorMessage) && (
          <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.md, backgroundColor: colors.dangerFaint, borderColor: colors.border }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="alert-circle-outline" size={20} color={colors.danger} style={{ marginRight: 8, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.danger }}>
                  Microphone or Recording Unavailable
                </Text>
                <BodyText style={{ fontSize: 13, color: colors.danger, marginTop: 4, lineHeight: 18 }}>
                  {errorMessage || 'Microphone permission was denied. You can proceed with demo mode using a pre-recorded campaign sample or create manually.'}
                </BodyText>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Use Demo Mode"
                  variant="primary"
                  size="sm"
                  icon="sparkles-outline"
                  onPress={handleUseDemoMode}
                  fullWidth
                />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  title="Create Manually"
                  variant="secondary"
                  size="sm"
                  icon="create-outline"
                  onPress={handleCreateManually}
                  fullWidth
                />
              </View>
            </View>
          </Card>
        )}

        {!isReviewStage ? (
          /* QUESTION STAGE */
          <View>
            {/* Question Progress Dots */}
            <View style={{ flexDirection: 'row', gap: 6, marginBottom: tokens.spacing.lg }}>
              {GUIDED_QUESTIONS.map((q, idx) => {
                const isActive = idx === currentQuestionIndex;
                const isAnswered = Boolean(answers[q.id]?.trim());
                return (
                  <View
                    key={q.id}
                    style={{
                      flex: 1,
                      height: 3,
                      borderRadius: 1.5,
                      backgroundColor: isActive
                        ? colors.accent
                        : isAnswered
                        ? colors.hairlineDark
                        : colors.hairline,
                    }}
                  />
                );
              })}
            </View>

            {/* Current Question Display */}
            <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.lg }}>
              <SmallCapsLabel style={{ color: colors.accent, marginBottom: 4 }}>
                QUESTION {currentQuestionIndex + 1} OF {GUIDED_QUESTIONS.length}
              </SmallCapsLabel>
              <Headline style={{ fontSize: 22, color: colors.ink, marginBottom: 6 }}>
                {currentQ.question}
              </Headline>
              <BodyText style={{ fontSize: 14, color: colors.mutedInk, lineHeight: 20, marginBottom: 12 }}>
                {currentQ.subtitle}
              </BodyText>
              <View style={{ backgroundColor: colors.paperSecondary, padding: 10, borderRadius: tokens.radius.xs, borderLeftWidth: 3, borderLeftColor: colors.hairlineDark }}>
                <MetaLabel style={{ fontStyle: 'italic', color: colors.mutedInk }}>
                  {currentQ.helperExample}
                </MetaLabel>
              </View>
            </Card>

            {/* Voice Recording Control */}
            <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.xl, alignItems: 'center' }}>
              {isRecording ? (
                <View style={{ alignItems: 'center' }}>
                  <Animated.View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: colors.dangerFaint,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 14,
                      transform: [{ scale: pulseAnim }],
                    }}
                  >
                    <View
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 28,
                        backgroundColor: colors.danger,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="mic" size={28} color={colors.surface} />
                    </View>
                  </Animated.View>
                  <Text style={{ fontSize: 18, fontFamily: fonts.sansBold, color: colors.danger }}>
                    Recording... {formatTimer(recordingDurationSec)}
                  </Text>
                  <MetaLabel style={{ marginTop: 4, marginBottom: 16 }}>
                    Speak your answer clearly into the microphone
                  </MetaLabel>
                  <Button
                    title="Stop Recording"
                    variant="danger"
                    size="md"
                    icon="stop"
                    onPress={stopRecording}
                  />
                </View>
              ) : (
                <View style={{ alignItems: 'center', width: '100%' }}>
                  <TouchableOpacity
                    accessibilityRole="button"
                    accessibilityLabel={currentAnswer ? 'Tap to Re-record Answer' : 'Tap to Record Answer'}
                    onPress={startRecording}
                    activeOpacity={0.8}
                    style={{
                      width: 68,
                      height: 68,
                      borderRadius: 34,
                      backgroundColor: colors.accent,
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                      borderWidth: 1,
                      borderColor: colors.accent,
                    }}
                  >
                    <Ionicons name="mic" size={32} color={colors.surface} />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                    {currentAnswer ? 'Tap to Re-record Answer' : 'Tap to Record Answer'}
                  </Text>
                  <MetaLabel style={{ marginTop: 2 }}>
                    Uses expo-audio with clear microphone permission
                  </MetaLabel>
                </View>
              )}
            </Card>

            {/* Transcribing Indicator */}
            {isTranscribing && (
              <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.md, alignItems: 'center', backgroundColor: colors.paperSecondary }}>
                <ActivityIndicator size="small" color={colors.accent} style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                  Transcribing your audio with AI...
                </Text>
                <MetaLabel style={{ marginTop: 2 }}>
                  Your spoken words will appear in the editable box below.
                </MetaLabel>
              </Card>
            )}

            {/* Answer Transcript & Manual Edit Box */}
            <Card style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <SmallCapsLabel style={{ color: colors.ink }}>
                  ANSWER TRANSCRIPT (EDITABLE)
                </SmallCapsLabel>
                {!currentAnswer && (
                  <TouchableOpacity
                    onPress={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: `[Demo sample] ${currentQ.demoAnswer}`,
                      }))
                    }
                    style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: colors.paperSecondary, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}
                  >
                    <SmallCapsLabel style={{ fontSize: 10, color: colors.accent }}>USE DEMO SAMPLE</SmallCapsLabel>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                accessibilityLabel="Answer Transcript"
                value={currentAnswer}
                onChangeText={handleTextChange}
                placeholder="Spoken response transcript will appear here, or type your answer directly..."
                placeholderTextColor={colors.secondaryCaption}
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: colors.paperSecondary,
                  borderWidth: 1,
                  borderColor: colors.hairline,
                  borderRadius: tokens.radius.sm,
                  padding: 12,
                  fontSize: 14,
                  fontFamily: fonts.sansRegular,
                  color: colors.ink,
                  lineHeight: 20,
                  textAlignVertical: 'top',
                  minHeight: 100,
                }}
              />
            </Card>

            {/* Navigation Actions */}
            <View style={{ flexDirection: 'row', gap: 10 }}>
              {currentQuestionIndex > 0 && (
                <View style={{ flex: 1 }}>
                  <Button
                    title="Previous"
                    variant="secondary"
                    size="md"
                    onPress={handlePrevQuestion}
                    fullWidth
                  />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Button
                  title={
                    currentQuestionIndex === GUIDED_QUESTIONS.length - 1
                      ? 'Review Transcript'
                      : 'Next Question'
                  }
                  variant="primary"
                  size="md"
                  icon="arrow-forward"
                  iconPosition="right"
                  onPress={handleNextQuestion}
                  fullWidth
                />
              </View>
            </View>
          </View>
        ) : (
          /* REVIEW & GENERATION STAGE */
          <View>
            <View style={{ marginBottom: tokens.spacing.md }}>
              <Headline style={{ fontSize: 22, color: colors.ink }}>
                Review Full Transcript
              </Headline>
              <MetaLabel style={{ marginTop: 4 }}>
                Review your 4 spoken responses before generating your draft. AI will formulate title, story, and ad creative.
              </MetaLabel>
            </View>

            {/* Compiled Transcript Cards */}
            {GUIDED_QUESTIONS.map((q) => {
              const ans = answers[q.id]?.trim();
              return (
                <Card key={q.id} style={{ marginBottom: 10, padding: tokens.spacing.md }}>
                  <SmallCapsLabel style={{ color: colors.accent, marginBottom: 4 }}>
                    {q.id}. {q.question}
                  </SmallCapsLabel>
                  <BodyText style={{ fontSize: 13, color: ans ? colors.ink : colors.secondaryCaption, fontStyle: ans ? 'normal' : 'italic', lineHeight: 19 }}>
                    {ans || '(No answer provided)'}
                  </BodyText>
                </Card>
              );
            })}

            {/* Notice regarding funding goal */}
            <View
              style={{
                backgroundColor: colors.paperSecondary,
                padding: 12,
                borderRadius: tokens.radius.sm,
                borderWidth: 1,
                borderColor: colors.hairline,
                marginBottom: tokens.spacing.lg,
              }}
            >
              <BodyText style={{ fontSize: 12, color: colors.mutedInk, lineHeight: 17, fontFamily: fonts.sansMedium }}>
                Note: AI will populate your title, category, story blocks, and ad creative. The funding goal is NEVER filled in by AI and must be entered by you on Step 5.
              </BodyText>
            </View>

            {/* Primary Action Button */}
            <View style={{ gap: 10 }}>
              <Button
                title={isGenerating ? 'Generating Draft...' : 'Generate Campaign Draft with AI'}
                variant="primary"
                size="lg"
                icon={isGenerating ? undefined : 'sparkles-outline'}
                iconPosition="right"
                loading={isGenerating}
                onPress={handleGenerateAIDraft}
                fullWidth
              />

              <Button
                title="Edit Questions"
                variant="secondary"
                size="md"
                onPress={() => setIsReviewStage(false)}
                fullWidth
              />
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
