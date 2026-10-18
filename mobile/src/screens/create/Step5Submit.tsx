import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { StoryBlockRenderer } from '../../components/story/StoryBlockRenderer';
import { SourceItem } from '../../components/ui/SourceItem';
import { FeedPlacementPreview } from '../../components/campaign/PlacementPreviews';
import { estimateReach } from '../../services/reach';
import { demoConfig } from '../../config/demoConfig';
import { CampaignDraft } from '../../store/useDraftStore';

interface Step5SubmitProps {
  draft: Partial<CampaignDraft>;
  onChange: (fields: Partial<CampaignDraft>) => void;
  onBack: () => void;
  onSaveAsDraft: () => void;
  onSubmitForReview: () => void;
  isSubmitting?: boolean;
}

export function Step5Submit({
  draft,
  onChange,
  onBack,
  onSaveAsDraft,
  onSubmitForReview,
  isSubmitting = false,
}: Step5SubmitProps) {
  // Goal input state (strictly no default value, user must type it!)
  const [goalText, setGoalText] = useState<string>(
    draft.fundingGoal ? String(draft.fundingGoal) : ''
  );
  const [previewExpanded, setPreviewExpanded] = useState<boolean>(true);

  // Required checkboxes
  const [confirmGroundedSources, setConfirmGroundedSources] = useState<boolean>(false);
  const [agreePolicies, setAgreePolicies] = useState<boolean>(false);

  // Parse numeric goal
  const numericGoal = parseFloat(goalText.replace(/[^0-9.]/g, '')) || 0;

  // Validation rules
  const isGoalTyped = goalText.trim().length > 0;
  const isGoalValid = numericGoal >= demoConfig.minGoal && numericGoal <= demoConfig.maxGoal;
  const bothCheckboxesChecked = confirmGroundedSources && agreePolicies;

  // Can submit check
  const canSubmit = isGoalValid && bothCheckboxesChecked && !isSubmitting;

  const handleGoalChange = (text: string) => {
    // Only allow digits
    const cleaned = text.replace(/[^0-9]/g, '');
    setGoalText(cleaned);
    const parsed = parseFloat(cleaned) || 0;
    onChange({ fundingGoal: parsed > 0 ? parsed : undefined });
  };

  // Live estimated reach calculation
  const reachCalc = isGoalValid ? estimateReach(numericGoal) : null;

  return (
    <View>
      {/* Header */}
      <View style={{ marginBottom: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a' }}>
          Funding Goal & Submit
        </Text>
        <Text style={{ fontSize: 14, color: '#64748b', marginTop: 4, lineHeight: 20 }}>
          Set your required funding goal, review your complete campaign draft, and submit for editorial review.
        </Text>
      </View>

      {/* 1. REQUIRED FUNDING GOAL (NO DEFAULT VALUE) */}
      <Card
        style={{
          marginBottom: 20,
          padding: 18,
          borderWidth: 2,
          borderColor: isGoalValid ? '#4f46e5' : isGoalTyped ? '#ef4444' : '#cbd5e1',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cash-outline" size={20} color="#4f46e5" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
              Required Funding Goal (USD)
            </Text>
          </View>
          <View
            style={{
              backgroundColor: '#fee2e2',
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '700', color: '#dc2626' }}>Required</Text>
          </View>
        </View>

        <Text style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>
          Type the exact amount needed to fund advertising reach for this campaign. Must be between ${demoConfig.minGoal.toLocaleString()} and ${demoConfig.maxGoal.toLocaleString()}.
        </Text>

        {/* Amount Input with $ Prefix */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#f8fafc',
            borderWidth: 1.5,
            borderColor: isGoalValid ? '#4f46e5' : isGoalTyped ? '#ef4444' : '#cbd5e1',
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontSize: 24, fontWeight: '800', color: '#0f172a', marginRight: 8 }}>
            $
          </Text>
          <TextInput
            value={goalText}
            onChangeText={handleGoalChange}
            placeholder="e.g. 5000 (No default value)"
            placeholderTextColor="#94a3b8"
            keyboardType="number-pad"
            style={{
              flex: 1,
              fontSize: 22,
              fontWeight: '800',
              color: '#0f172a',
            }}
          />
          {isGoalValid && (
            <Ionicons name="checkmark-circle" size={24} color="#16a34a" />
          )}
        </View>

        {/* Validation Error / Helper Text */}
        {!isGoalTyped ? (
          <Text style={{ fontSize: 12, color: '#64748b', marginTop: 8 }}>
            * Please type a funding target. No default is prefilled.
          </Text>
        ) : !isGoalValid ? (
          <Text style={{ fontSize: 12, color: '#dc2626', fontWeight: '600', marginTop: 8 }}>
            Funding goal must be between ${demoConfig.minGoal.toLocaleString()} and ${demoConfig.maxGoal.toLocaleString()} (entered: ${numericGoal.toLocaleString()}).
          </Text>
        ) : null}

        {/* Live Estimated Reach Indicator (Labelled clearly as Estimate) */}
        {reachCalc && (
          <View
            style={{
              marginTop: 16,
              padding: 14,
              backgroundColor: '#eef2ff',
              borderRadius: 12,
              borderWidth: 1,
              borderColor: '#c7d2fe',
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="people" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#4338ca', textTransform: 'uppercase' }}>
                Estimated Reach (Estimate, not a guarantee)
              </Text>
            </View>
            <Text style={{ fontSize: 22, fontWeight: '900', color: '#312e81' }}>
              ~{reachCalc.estimate.toLocaleString()} people
            </Text>
            <Text style={{ fontSize: 12, color: '#4338ca', marginTop: 4, lineHeight: 16 }}>
              At ${numericGoal.toLocaleString()} goal: ~${reachCalc.adBudget.toLocaleString()} dedicated ad budget creates ~{reachCalc.impressions.toLocaleString()} ad impressions at ${(demoConfig.cpmUsd).toFixed(2)} CPM.
            </Text>
          </View>
        )}
      </Card>

      {/* 2. FEES & FUNDING POLICY */}
      <Card style={{ marginBottom: 20, padding: 16, backgroundColor: '#f8fafc' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          <Ionicons name="shield-outline" size={18} color="#0f172a" style={{ marginRight: 6 }} />
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a' }}>
            Fees & Funding Policy
          </Text>
        </View>

        <View style={{ gap: 8 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Platform Maintenance & Editorial Review</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>5.0%</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 13, color: '#64748b' }}>Payment Processing (Stripe / Banking)</Text>
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}>2.9% + $0.30</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 8,
              borderTopWidth: 1,
              borderTopColor: '#e2e8f0',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#16a34a' }}>
              Direct Ad Spend on Selected Channels
            </Text>
            <Text style={{ fontSize: 13, fontWeight: '800', color: '#16a34a' }}>~92.1%</Text>
          </View>
        </View>

        <Text style={{ fontSize: 12, color: '#64748b', marginTop: 12, lineHeight: 17 }}>
          Policy: All net contributions are deployed directly to ad network delivery once the campaign is funded and approved. If a campaign is not funded within the duration window, contributions are returned or credited per backer preference.
        </Text>
      </Card>

      {/* 3. COMPLETE CAMPAIGN PREVIEW SECTION */}
      <View style={{ marginBottom: 20 }}>
        <TouchableOpacity
          onPress={() => setPreviewExpanded(!previewExpanded)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#ffffff',
            padding: 16,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: '#e2e8f0',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="eye-outline" size={20} color="#4f46e5" style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a' }}>
              Complete Campaign Preview
            </Text>
          </View>
          <Ionicons
            name={previewExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#64748b"
          />
        </TouchableOpacity>

        {previewExpanded && (
          <View style={{ marginTop: 12, gap: 14 }}>
            {/* Basics Header Preview */}
            <Card style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <View
                  style={{
                    backgroundColor: '#eef2ff',
                    paddingHorizontal: 8,
                    paddingVertical: 3,
                    borderRadius: 6,
                  }}
                >
                  <Text style={{ fontSize: 11, fontWeight: '800', color: '#4f46e5', textTransform: 'uppercase' }}>
                    {draft.category || 'Community'}
                  </Text>
                </View>
                <Text style={{ fontSize: 12, color: '#64748b' }}>
                  by {draft.creatorName || 'Campaign Organizer'}
                </Text>
              </View>

              <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 8 }}>
                {draft.title || 'Untitled Campaign'}
              </Text>

              {draft.summary ? (
                <Text style={{ fontSize: 14, color: '#475569', lineHeight: 21 }}>
                  {draft.summary}
                </Text>
              ) : null}

              {draft.coverUrl && (
                <View style={{ marginTop: 12, borderRadius: 12, overflow: 'hidden', height: 180 }}>
                  <Image source={{ uri: draft.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              )}
            </Card>

            {/* Story Blocks Preview (using StoryBlockRenderer) */}
            {draft.storyBlocks && draft.storyBlocks.length > 0 && (
              <Card style={{ padding: 16 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>
                  Editorial Story
                </Text>
                {draft.storyBlocks.map((block: any, idx: number) => (
                  <StoryBlockRenderer key={block.id || idx} block={block} index={idx} />
                ))}
              </Card>
            )}

            {/* Grounding Sources Preview (using SourceItem) */}
            {draft.sources && draft.sources.length > 0 && (
              <Card style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                  <Ionicons name="library-outline" size={18} color="#4f46e5" style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }}>
                    Grounding Sources ({draft.sources.length})
                  </Text>
                </View>
                {draft.sources.map((src: any, idx: number) => (
                  <SourceItem
                    key={src.id || idx}
                    source={{
                      id: src.id || String(idx),
                      title: src.title,
                      url: src.url,
                    }}
                    index={idx}
                  />
                ))}
              </Card>
            )}

            {/* Visuals & Ad Preview (using FeedPlacementPreview) */}
            <Card style={{ padding: 16 }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 10 }}>
                Social Ad Creative
              </Text>
              <FeedPlacementPreview
                headline={draft.headline || draft.title || 'Ad Headline'}
                description={draft.adDescription || draft.summary || 'Ad primary text'}
                imageUrl={draft.adImages?.[0] || draft.coverUrl}
                cta={draft.cta || 'Learn More'}
                creatorName={draft.creatorName || 'Campaign Organizer'}
              />
            </Card>

            {/* Audience & Distribution Breakdown */}
            <Card style={{ padding: 16, backgroundColor: '#f8fafc' }}>
              <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 10 }}>
                Audience & Distribution
              </Text>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 13, color: '#334155' }}>
                  <Text style={{ fontWeight: '700' }}>Locations: </Text>
                  {draft.locations?.join(', ') || 'Cook County'}
                </Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>
                  <Text style={{ fontWeight: '700' }}>Interests: </Text>
                  {draft.interests?.join(', ') || 'Public Health'}
                </Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>
                  <Text style={{ fontWeight: '700' }}>Channels: </Text>
                  {draft.channels?.join(', ') || 'Meta, Instagram'}
                </Text>
                <Text style={{ fontSize: 13, color: '#334155' }}>
                  <Text style={{ fontWeight: '700' }}>Duration: </Text>
                  {draft.durationDays || 30} days
                </Text>
              </View>
            </Card>
          </View>
        )}
      </View>

      {/* 4. REQUIRED SUBMISSION CHECKBOXES */}
      <Card style={{ marginBottom: 24, padding: 16 }}>
        <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a', marginBottom: 12 }}>
          Submission Agreements & Review
        </Text>

        {/* Checkbox 1: Grounded Claims */}
        <TouchableOpacity
          onPress={() => setConfirmGroundedSources(!confirmGroundedSources)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14 }}
        >
          <Ionicons
            name={confirmGroundedSources ? 'checkbox' : 'square-outline'}
            size={22}
            color={confirmGroundedSources ? '#4f46e5' : '#94a3b8'}
            style={{ marginRight: 10, marginTop: 1 }}
          />
          <Text style={{ fontSize: 13, color: '#334155', flex: 1, lineHeight: 19 }}>
            I confirm that all factual claims in this campaign are grounded in the listed public sources and official records.
          </Text>
        </TouchableOpacity>

        {/* Checkbox 2: Rules & Policies */}
        <TouchableOpacity
          onPress={() => setAgreePolicies(!agreePolicies)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'flex-start' }}
        >
          <Ionicons
            name={agreePolicies ? 'checkbox' : 'square-outline'}
            size={22}
            color={agreePolicies ? '#4f46e5' : '#94a3b8'}
            style={{ marginRight: 10, marginTop: 1 }}
          />
          <Text style={{ fontSize: 13, color: '#334155', flex: 1, lineHeight: 19 }}>
            I agree to the campaign guidelines, fees, and advertising policies. I understand that actual reach depends on market inventory and delivery performance.
          </Text>
        </TouchableOpacity>
      </Card>

      {/* 5. ACTION BUTTONS */}
      <View style={{ gap: 10, marginBottom: 20 }}>
        {/* Primary CTA: Submit for Review */}
        <Button
          title={isSubmitting ? 'Submitting...' : 'Submit for Review'}
          variant="primary"
          size="lg"
          icon={isSubmitting ? undefined : 'send'}
          iconPosition="right"
          disabled={!canSubmit}
          loading={isSubmitting}
          onPress={onSubmitForReview}
          fullWidth
        />

        {/* Preview toggle button */}
        <Button
          title={previewExpanded ? 'Hide Campaign Preview' : 'Preview Campaign'}
          variant="outline"
          size="md"
          icon="eye-outline"
          onPress={() => setPreviewExpanded(!previewExpanded)}
          fullWidth
        />

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Button
              title="Back"
              variant="secondary"
              size="md"
              icon="arrow-back"
              onPress={onBack}
              fullWidth
            />
          </View>
          <View style={{ flex: 1 }}>
            <Button
              title="Save as Draft"
              variant="secondary"
              size="md"
              icon="save-outline"
              onPress={onSaveAsDraft}
              fullWidth
            />
          </View>
        </View>
      </View>
    </View>
  );
}
