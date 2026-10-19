import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
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
    const draftId = `cmp-${generateId()}`;

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

    // 1. Save locally in Zustand
    saveDraft(newDraft);
    setActiveDraft(draftId);

    // 2. Try creating draft on server
    try {
      await apiClient.createDraft({
        title: newDraft.title,
        category: newDraft.category,
        creator_name: newDraft.creatorName,
        summary: newDraft.summary,
      });

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
      // Stored locally
    }

    // 3. ALWAYS land on editable Step 1! Never skip ahead to submission!
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
  const handleCreateManually = () => {
    const draftId = `cmp-${generateId()}`;
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
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View
        style={{
          paddingTop: 52,
          paddingBottom: 14,
          paddingHorizontal: 16,
          backgroundColor: '#fff',
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
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
            Create with Your Voice
          </Text>
          <Text style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>
            {isReviewStage
              ? 'Review Transcript'
              : `Question ${currentQuestionIndex + 1} of ${GUIDED_QUESTIONS.length}`}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={{
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 8,
            backgroundColor: '#f1f5f9',
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Cancel</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 20, paddingBottom: 100 }}
      >
        {/* Permission Request Card (shown if permission is not yet granted) */}
        {permissionStatus === 'undetermined' && (
          <Card style={{ marginBottom: 18, padding: 18, backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
              <Ionicons name="mic" size={22} color="#4f46e5" style={{ marginRight: 8 }} />
              <Text style={{ fontSize: 16, fontWeight: '800', color: '#312e81' }}>
                Microphone Permission Explanation
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: '#3730a3', lineHeight: 19, marginBottom: 14 }}>
              Campaign Amplifier requires microphone access to record your spoken answers to 4 guided questions. Your answers will be transcribed to draft your title, story, and ad creative. You will always review and edit everything on Step 1.
            </Text>
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
          <Card style={{ marginBottom: 18, padding: 16, backgroundColor: '#fef2f2', borderColor: '#fecaca' }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 }}>
              <Ionicons name="alert-circle" size={22} color="#dc2626" style={{ marginRight: 8, marginTop: 1 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#991b1b' }}>
                  Microphone or Recording Unavailable
                </Text>
                <Text style={{ fontSize: 13, color: '#7f1d1d', marginTop: 4, lineHeight: 18 }}>
                  {errorMessage || 'Microphone permission was denied. You can proceed with demo mode using a pre-recorded campaign sample or create manually.'}
                </Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <View style={{ flex: 1 }}>
                <Button
                  title="Use Demo Mode"
                  variant="primary"
                  size="sm"
                  icon="sparkles"
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
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
              {GUIDED_QUESTIONS.map((q, idx) => {
                const isActive = idx === currentQuestionIndex;
                const isAnswered = Boolean(answers[q.id]?.trim());
                return (
                  <View
                    key={q.id}
                    style={{
                      flex: 1,
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: isActive
                        ? '#4f46e5'
                        : isAnswered
                        ? '#818cf8'
                        : '#e2e8f0',
                    }}
                  />
                );
              })}
            </View>

            {/* Current Question Display */}
            <Card style={{ marginBottom: 18, padding: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
                Question {currentQuestionIndex + 1} of {GUIDED_QUESTIONS.length}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a', marginBottom: 6 }}>
                {currentQ.question}
              </Text>
              <Text style={{ fontSize: 14, color: '#64748b', lineHeight: 20, marginBottom: 12 }}>
                {currentQ.subtitle}
              </Text>
              <View style={{ backgroundColor: '#f8fafc', padding: 10, borderRadius: 8, borderLeftWidth: 3, borderLeftColor: '#cbd5e1' }}>
                <Text style={{ fontSize: 12, color: '#475569', fontStyle: 'italic' }}>
                  {currentQ.helperExample}
                </Text>
              </View>
            </Card>

            {/* Voice Recording Control */}
            <Card style={{ marginBottom: 18, padding: 24, alignItems: 'center' }}>
              {isRecording ? (
                <View style={{ alignItems: 'center' }}>
                  <Animated.View
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: '#fee2e2',
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
                        backgroundColor: '#dc2626',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="mic" size={32} color="#ffffff" />
                    </View>
                  </Animated.View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#dc2626' }}>
                    Recording... {formatTimer(recordingDurationSec)}
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4, marginBottom: 16 }}>
                    Speak your answer clearly into the microphone
                  </Text>
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
                    onPress={startRecording}
                    activeOpacity={0.8}
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 36,
                      backgroundColor: '#4f46e5',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: 12,
                      shadowColor: '#4f46e5',
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 4,
                    }}
                  >
                    <Ionicons name="mic" size={36} color="#ffffff" />
                  </TouchableOpacity>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
                    {currentAnswer ? 'Tap to Re-record Answer' : 'Tap to Record Answer'}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>
                    Uses expo-audio with clear microphone permission
                  </Text>
                </View>
              )}
            </Card>

            {/* Transcribing Indicator */}
            {isTranscribing && (
              <Card style={{ marginBottom: 16, padding: 16, alignItems: 'center', backgroundColor: '#eef2ff', borderColor: '#c7d2fe' }}>
                <ActivityIndicator size="small" color="#4f46e5" style={{ marginBottom: 6 }} />
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#312e81' }}>
                  Transcribing your audio with AI...
                </Text>
                <Text style={{ fontSize: 12, color: '#4338ca', marginTop: 2 }}>
                  Your spoken words will appear in the editable box below.
                </Text>
              </Card>
            )}

            {/* Answer Transcript & Manual Edit Box */}
            <Card style={{ marginBottom: 20, padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
                  Answer Transcript (Editable)
                </Text>
                {!currentAnswer && (
                  <TouchableOpacity
                    onPress={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQ.id]: `[Demo sample] ${currentQ.demoAnswer}`,
                      }))
                    }
                    style={{ paddingHorizontal: 8, paddingVertical: 3, backgroundColor: '#f1f5f9', borderRadius: 6 }}
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#4f46e5' }}>Use Demo Sample Answer</Text>
                  </TouchableOpacity>
                )}
              </View>
              <TextInput
                value={currentAnswer}
                onChangeText={handleTextChange}
                placeholder="Spoken response transcript will appear here, or type your answer directly..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={4}
                style={{
                  backgroundColor: '#f8fafc',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
                  borderRadius: 12,
                  padding: 12,
                  fontSize: 14,
                  color: '#0f172a',
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
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 22, fontWeight: '900', color: '#0f172a' }}>
                Review Full Transcript
              </Text>
              <Text style={{ fontSize: 13, color: '#64748b', marginTop: 4, lineHeight: 18 }}>
                Review your 4 spoken responses before generating your draft. AI will formulate title, story, and ad creative.
              </Text>
            </View>

            {/* Compiled Transcript Cards */}
            {GUIDED_QUESTIONS.map((q) => {
              const ans = answers[q.id]?.trim();
              return (
                <Card key={q.id} style={{ marginBottom: 12, padding: 14 }}>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: '#4f46e5', marginBottom: 4 }}>
                    {q.id}. {q.question}
                  </Text>
                  <Text style={{ fontSize: 13, color: ans ? '#334155' : '#94a3b8', fontStyle: ans ? 'normal' : 'italic', lineHeight: 19 }}>
                    {ans || '(No answer provided)'}
                  </Text>
                </Card>
              );
            })}

            {/* Notice regarding funding goal */}
            <View
              style={{
                backgroundColor: '#eff6ff',
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: '#bfdbfe',
                marginBottom: 20,
              }}
            >
              <Text style={{ fontSize: 12, color: '#1e40af', lineHeight: 17, fontWeight: '600' }}>
                Note: AI will populate your title, category, story blocks, and ad creative. The funding goal is NEVER filled in by AI and must be entered by you on Step 5.
              </Text>
            </View>

            {/* Primary Action Button */}
            <View style={{ gap: 10 }}>
              <Button
                title={isGenerating ? 'Generating Draft...' : 'Generate Campaign Draft with AI'}
                variant="primary"
                size="lg"
                icon={isGenerating ? undefined : 'sparkles'}
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
