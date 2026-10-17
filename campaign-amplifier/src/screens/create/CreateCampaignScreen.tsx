import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, StatusBar, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCampaignStore } from '../../store/useCampaignStore';
import { useAuthStore } from '../../store/useAuthStore';
import { generateCampaignContent } from '../../services/campaignAI';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getCategoryColor } from '../../theme/colors';
import type { CampaignCategory } from '../../types/campaign';

const STEPS = ['Describe', 'AI Enhance', 'Sources', 'Settings', 'Ad Creative', 'Review'];

const PLATFORMS = [
  { key: 'facebook', label: 'Facebook', icon: 'logo-facebook' },
  { key: 'instagram', label: 'Instagram', icon: 'logo-instagram' },
  { key: 'youtube', label: 'YouTube', icon: 'logo-youtube' },
  { key: 'reddit', label: 'Reddit', icon: 'logo-reddit' },
  { key: 'linkedin', label: 'LinkedIn', icon: 'logo-linkedin' },
  { key: 'tiktok', label: 'TikTok', icon: 'logo-tiktok' },
];

export function CreateCampaignScreen({ navigation }: any) {
  const [step, setStep] = useState(0);
  const [issueText, setIssueText] = useState('');
  const [title, setTitle] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [whyBack, setWhyBack] = useState('');
  const [category, setCategory] = useState<CampaignCategory>('public_policy');
  const [sources, setSources] = useState<string[]>([]);
  const [newSource, setNewSource] = useState('');
  const [fundingGoal, setFundingGoal] = useState('5000');
  const [durationDays, setDurationDays] = useState('30');
  const [targetAudience, setTargetAudience] = useState('');
  const [adHeadline, setAdHeadline] = useState('');
  const [adPrimaryText, setAdPrimaryText] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['facebook', 'instagram']);
  const [isGenerating, setIsGenerating] = useState(false);

  const user = useAuthStore((s) => s.user);
  const createCampaign = useCampaignStore((s) => s.createCampaign);

  const handleAIGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const generated = generateCampaignContent(issueText);
      setTitle(generated.title);
      setTagline(generated.tagline);
      setDescription(generated.descriptionHtml.replace(/<[^>]*>/g, '\n').trim());
      setWhyBack(generated.whyBackersShouldCareHtml.replace(/<[^>]*>/g, '').trim());
      setCategory(generated.category);
      setTargetAudience(generated.targetAudience);
      setAdHeadline(generated.adHeadline);
      setAdPrimaryText(generated.adPrimaryText);
      setIsGenerating(false);
    }, 1500);
  };

  const addSource = () => {
    const url = newSource.trim();
    if (url && !sources.includes(url)) {
      setSources([...sources, url.startsWith('http') ? url : 'https://' + url]);
      setNewSource('');
    }
  };

  const removeSource = (i: number) => setSources(sources.filter((_, idx) => idx !== i));

  const togglePlatform = (key: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const handleSubmit = () => {
    if (!title.trim()) { Alert.alert('Error', 'Please add a title'); return; }
    if (!user) {
      Alert.alert(
        'Sign In Required',
        'You can browse and back campaigns as a guest, but creating a campaign requires signing in so you can manage review and edits.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Sign In', onPress: () => navigation.navigate('Login') },
        ]
      );
      return;
    }

    const campaign = createCampaign({
      title,
      tagline,
      short_description: description.slice(0, 200),
      long_description: `<p>${description.replace(/\n/g, '</p><p>')}</p>`,
      why_backers_should_care: `<p>${whyBack}</p>`,
      category,
      funding_goal: parseInt(fundingGoal) || 5000,
      duration_days: parseInt(durationDays) || 30,
      target_audience: targetAudience,
      ad_headline: adHeadline,
      ad_primary_text: adPrimaryText,
      campaign_sources: sources,
      ad_platforms: selectedPlatforms,
      creator_name: user.name,
    }, user.uid);

    Alert.alert('Campaign Submitted!', 'Your campaign has been submitted for review.', [
      { text: 'View Campaigns', onPress: () => navigation.navigate('HomeTab') },
    ]);
  };

  const canNext = () => {
    if (step === 0) return issueText.length >= 20;
    if (step === 1) return title.length > 0;
    return true;
  };

  const catColor = getCategoryColor(category);

  const renderStep = () => {
    switch (step) {
      case 0: // Describe
        return (
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>What's the issue?</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 20, lineHeight: 20 }}>
              Describe the problem in your own words. Our AI will help you turn it into a compelling campaign.
            </Text>
            <TextInput
              value={issueText}
              onChangeText={setIssueText}
              placeholder="e.g., Thirty schools in our county still have lead pipes. The state has money to fix them, but districts haven't applied..."
              placeholderTextColor="#94a3b8"
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              style={{ backgroundColor: '#fff', borderWidth: 1.5, borderColor: issueText.length >= 20 ? '#4f46e5' : '#e2e8f0', borderRadius: 14, padding: 16, fontSize: 15, color: '#0f172a', minHeight: 200, lineHeight: 24 }}
            />
            <Text style={{ fontSize: 12, color: issueText.length >= 20 ? '#22c55e' : '#94a3b8', marginTop: 8, textAlign: 'right' }}>
              {issueText.length} characters {issueText.length < 20 ? '(min 20)' : '✓'}
            </Text>

            <Card style={{ marginTop: 16, backgroundColor: '#fffbeb' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons name="bulb" size={18} color="#f59e0b" />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#92400e', marginLeft: 8 }}>Tips for a strong campaign</Text>
              </View>
              <Text style={{ fontSize: 13, color: '#92400e', marginTop: 8, lineHeight: 20 }}>
                • Be specific about the problem{'\n'}
                • Include numbers or data if you have them{'\n'}
                • Mention what change you want to see{'\n'}
                • Note any existing evidence or sources
              </Text>
            </Card>
          </View>
        );

      case 1: // AI Enhance
        return (
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>AI-Enhanced Campaign</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
              Review and edit the AI-generated content below.
            </Text>

            {!title && (
              <Button title="Generate with AI" onPress={handleAIGenerate} icon="sparkles" loading={isGenerating} fullWidth />
            )}

            {title && (
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                  <View style={{ backgroundColor: catColor + '20', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: '600', color: catColor }}>{category.charAt(0).toUpperCase() + category.slice(1)}</Text>
                  </View>
                  <TouchableOpacity onPress={handleAIGenerate} style={{ marginLeft: 'auto', flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="refresh" size={16} color="#4f46e5" />
                    <Text style={{ fontSize: 13, color: '#4f46e5', marginLeft: 4 }}>Regenerate</Text>
                  </TouchableOpacity>
                </View>

                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Title</Text>
                <TextInput value={title} onChangeText={setTitle} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0f172a', marginBottom: 12 }} />

                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Tagline</Text>
                <TextInput value={tagline} onChangeText={setTagline} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0f172a', marginBottom: 12 }} />

                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Description</Text>
                <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={5} textAlignVertical="top" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a', minHeight: 120, marginBottom: 12 }} />

                <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Why should backers care?</Text>
                <TextInput value={whyBack} onChangeText={setWhyBack} multiline numberOfLines={3} textAlignVertical="top" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a', minHeight: 80, marginBottom: 12 }} />
              </View>
            )}
          </View>
        );

      case 2: // Sources
        return (
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>Add Sources</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 16, lineHeight: 20 }}>
              Link to evidence that supports your campaign message. Clear, public citations help moderators verify that claims are traceable.
            </Text>

            <View style={{ flexDirection: 'row', marginBottom: 16 }}>
              <TextInput
                value={newSource}
                onChangeText={setNewSource}
                placeholder="https://example.org/evidence"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                keyboardType="url"
                style={{ flex: 1, backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a', marginRight: 8 }}
              />
              <TouchableOpacity onPress={addSource} style={{ width: 44, height: 44, borderRadius: 10, backgroundColor: '#4f46e5', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {sources.map((src, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#f1f5f9' }}>
                <Ionicons name="link" size={16} color="#4f46e5" />
                <Text style={{ flex: 1, fontSize: 13, color: '#334155', marginLeft: 8 }} numberOfLines={1}>{src.replace(/^https?:\/\//, '')}</Text>
                <TouchableOpacity onPress={() => removeSource(i)}>
                  <Ionicons name="close-circle" size={20} color="#94a3b8" />
                </TouchableOpacity>
              </View>
            ))}

            <Card style={{ marginTop: 16, flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
              <Ionicons name="document-text-outline" size={24} color="#16a34a" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534' }}>
                  {sources.length} supporting source{sources.length !== 1 ? 's' : ''} added
                </Text>
                <Text style={{ fontSize: 12, color: '#15803d', marginTop: 2 }}>
                  Sources remain visible to backers on the published campaign page.
                </Text>
              </View>
            </Card>
          </View>
        );

      case 3: // Settings
        return (
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>Campaign Settings</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Set your funding goal and duration.</Text>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Funding Goal ($)</Text>
            <TextInput value={fundingGoal} onChangeText={setFundingGoal} keyboardType="numeric" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 18, fontWeight: '700', color: '#0f172a', marginBottom: 16 }} />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Duration (days)</Text>
            <TextInput value={durationDays} onChangeText={setDurationDays} keyboardType="numeric" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0f172a', marginBottom: 16 }} />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Target Audience</Text>
            <TextInput value={targetAudience} onChangeText={setTargetAudience} multiline style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a', minHeight: 60, marginBottom: 16 }} />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 8 }}>Ad Platforms</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {PLATFORMS.map((p) => {
                const sel = selectedPlatforms.includes(p.key);
                return (
                  <TouchableOpacity key={p.key} onPress={() => togglePlatform(p.key)} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, marginRight: 8, marginBottom: 8, backgroundColor: sel ? '#4f46e5' : '#fff', borderWidth: 1, borderColor: sel ? '#4f46e5' : '#e2e8f0' }}>
                    <Ionicons name={p.icon as any} size={16} color={sel ? '#fff' : '#64748b'} />
                    <Text style={{ fontSize: 13, fontWeight: '500', marginLeft: 6, color: sel ? '#fff' : '#334155' }}>{p.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        );

      case 4: // Ad Creative
        return (
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>Ad Creative</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Preview how your ad will appear to the audience.</Text>

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Ad Headline</Text>
            <TextInput value={adHeadline} onChangeText={setAdHeadline} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 15, color: '#0f172a', marginBottom: 12 }} />

            <Text style={{ fontSize: 13, fontWeight: '600', color: '#334155', marginBottom: 4 }}>Ad Primary Text</Text>
            <TextInput value={adPrimaryText} onChangeText={setAdPrimaryText} multiline numberOfLines={3} textAlignVertical="top" style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 10, padding: 12, fontSize: 14, color: '#0f172a', minHeight: 80, marginBottom: 16 }} />

            {/* Ad Preview */}
            <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>Preview</Text>
            <Card style={{ padding: 0, overflow: 'hidden' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12 }}>
                <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: '#eef2ff', alignItems: 'center', justifyContent: 'center', marginRight: 8 }}>
                  <Ionicons name="megaphone" size={14} color="#4f46e5" />
                </View>
                <View>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: '#0f172a' }}>Sponsored</Text>
                  <Text style={{ fontSize: 11, color: '#94a3b8' }}>Ad Preview</Text>
                </View>
              </View>
              <Text style={{ fontSize: 14, color: '#334155', paddingHorizontal: 12, marginBottom: 8 }}>{adPrimaryText || 'Your ad text will appear here...'}</Text>
              <View style={{ height: 160, backgroundColor: catColor + '10', alignItems: 'center', justifyContent: 'center' }}>
                <Ionicons name="image-outline" size={40} color={catColor} />
                <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 8 }}>Campaign Image</Text>
              </View>
              <View style={{ padding: 12, borderTopWidth: 1, borderTopColor: '#f1f5f9' }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>{adHeadline || 'Your headline here'}</Text>
              </View>
            </Card>
          </View>
        );

      case 5: // Review
        return (
          <View>
            <Text style={{ fontSize: 22, fontWeight: '800', color: '#0f172a', marginBottom: 4 }}>Review & Submit</Text>
            <Text style={{ fontSize: 14, color: '#64748b', marginBottom: 20 }}>Review your campaign before submitting.</Text>

            <Card style={{ marginBottom: 12 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <View style={{ backgroundColor: catColor + '20', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3, marginRight: 8 }}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: catColor }}>{category.toUpperCase()}</Text>
                </View>
                <View style={{ backgroundColor: '#fef3c7', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 }}>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: '#b45309' }}>Pending Review</Text>
                </View>
              </View>
              <Text style={{ fontSize: 18, fontWeight: '700', color: '#0f172a' }}>{title}</Text>
              <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>{tagline}</Text>
            </Card>

            {[
              { label: 'Funding Goal', value: `$${parseInt(fundingGoal).toLocaleString()}`, icon: 'cash-outline' },
              { label: 'Duration', value: `${durationDays} days`, icon: 'calendar-outline' },
              { label: 'Sources', value: `${sources.length} cited`, icon: 'document-text-outline' },
              { label: 'Platforms', value: selectedPlatforms.join(', '), icon: 'share-social-outline' },
            ].map((item) => (
              <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
                <Ionicons name={item.icon as any} size={18} color="#64748b" />
                <Text style={{ flex: 1, fontSize: 14, color: '#334155', marginLeft: 10 }}>{item.label}</Text>
                <Text style={{ fontSize: 14, fontWeight: '600', color: '#0f172a' }}>{item.value}</Text>
              </View>
            ))}

            <View style={{ marginTop: 24 }}>
              <Button title="Submit Campaign for Review" onPress={handleSubmit} icon="rocket-outline" fullWidth size="lg" />
            </View>

            <Text style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', marginTop: 12, lineHeight: 18 }}>
              Your campaign will be reviewed for message clarity, supporting sources, and advertising compliance before community funding opens.
            </Text>
          </View>
        );
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
        <StatusBar barStyle="dark-content" />

        {/* Header */}
        <View style={{ paddingTop: 52, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#f1f5f9' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <TouchableOpacity onPress={() => step > 0 ? setStep(step - 1) : navigation.goBack()}>
              <Ionicons name={step > 0 ? 'arrow-back' : 'close'} size={24} color="#0f172a" />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#0f172a' }}>Create Campaign</Text>
            <Text style={{ fontSize: 13, color: '#64748b' }}>{step + 1}/{STEPS.length}</Text>
          </View>

          {/* Step Indicator */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {STEPS.map((_, i) => (
              <View key={i} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: i <= step ? '#4f46e5' : '#e2e8f0' }} />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
          {renderStep()}
        </ScrollView>

        {/* Bottom Nav */}
        {step < 5 && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#f1f5f9', padding: 16, paddingBottom: 32, flexDirection: 'row' }}>
            {step > 0 && (
              <TouchableOpacity onPress={() => setStep(step - 1)} style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
                <Ionicons name="arrow-back" size={20} color="#334155" />
              </TouchableOpacity>
            )}
            <View style={{ flex: 1 }}>
              <Button
                title={step === 0 ? 'Generate Campaign' : step === 4 ? 'Review' : 'Continue'}
                onPress={() => {
                  if (step === 0 && !title) handleAIGenerate();
                  setStep(step + 1);
                }}
                disabled={!canNext()}
                icon={step === 0 ? 'sparkles' : 'arrow-forward'}
                iconPosition="right"
                fullWidth
              />
            </View>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}
