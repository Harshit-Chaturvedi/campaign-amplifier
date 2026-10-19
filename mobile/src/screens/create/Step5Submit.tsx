import React, { useState } from 'react';
import {
  View,
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
import {
  Headline,
  Subheading,
  BodyText,
  StatHero,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { estimateReach } from '../../services/reach';
import { demoConfig } from '../../config/demoConfig';
import { CampaignDraft } from '../../store/useDraftStore';
import { colors, fonts, tokens } from '../../theme/tokens';

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
      <View style={{ marginBottom: tokens.spacing.lg }}>
        <Headline style={{ fontSize: 22, color: colors.ink }}>
          Funding Goal & Submit
        </Headline>
        <MetaLabel style={{ marginTop: 4 }}>
          Set your required funding goal, review your complete campaign draft, and submit for editorial review.
        </MetaLabel>
      </View>

      {/* 1. REQUIRED FUNDING GOAL (NO DEFAULT VALUE) */}
      <Card
        style={{
          marginBottom: tokens.spacing.md,
          padding: tokens.spacing.md,
          borderWidth: 1,
          borderColor: isGoalValid ? colors.accent : isGoalTyped ? colors.danger : colors.hairline,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="cash-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
              Required Funding Goal (USD)
            </Text>
          </View>
          <View
            style={{
              backgroundColor: colors.paperSecondary,
              paddingHorizontal: 6,
              paddingVertical: 2,
              borderRadius: tokens.radius.xs,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <SmallCapsLabel style={{ fontSize: 10, color: colors.danger }}>REQUIRED</SmallCapsLabel>
          </View>
        </View>

        <MetaLabel style={{ marginBottom: 12 }}>
          Type the exact amount needed to fund advertising reach for this campaign. Must be between ${demoConfig.minGoal.toLocaleString()} and ${demoConfig.maxGoal.toLocaleString()}.
        </MetaLabel>

        {/* Amount Input with $ Prefix */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: colors.paperSecondary,
            borderWidth: 1,
            borderColor: isGoalValid ? colors.accent : isGoalTyped ? colors.danger : colors.hairline,
            borderRadius: tokens.radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontSize: 22, fontFamily: fonts.sansBold, color: colors.ink, marginRight: 6 }}>
            $
          </Text>
          <TextInput
            accessibilityLabel="Campaign funding goal in dollars"
            value={goalText}
            onChangeText={handleGoalChange}
            placeholder="e.g. 5000 (No default value)"
            placeholderTextColor={colors.secondaryCaption}
            keyboardType="number-pad"
            style={{
              flex: 1,
              fontSize: 20,
              fontFamily: fonts.sansBold,
              color: colors.ink,
            }}
          />
          {isGoalValid && (
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.positive} />
          )}
        </View>

        {/* Validation Error / Helper Text */}
        {!isGoalTyped ? (
          <MetaLabel style={{ marginTop: 8 }}>
            * Please type a funding target. No default is prefilled.
          </MetaLabel>
        ) : !isGoalValid ? (
          <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.danger, marginTop: 8 }}>
            Funding goal must be between ${demoConfig.minGoal.toLocaleString()} and ${demoConfig.maxGoal.toLocaleString()} (entered: ${numericGoal.toLocaleString()}).
          </Text>
        ) : null}

        {/* Live Estimated Reach Indicator (Labelled clearly as Estimate) */}
        {reachCalc && (
          <View
            style={{
              marginTop: 14,
              padding: tokens.spacing.md,
              backgroundColor: colors.surface,
              borderRadius: tokens.radius.sm,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="people-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
              <SmallCapsLabel style={{ fontSize: 11, color: colors.accent }}>
                ESTIMATED REACH (ESTIMATE, NOT A GUARANTEE)
              </SmallCapsLabel>
            </View>
            <StatHero style={{ fontSize: 24, color: colors.ink }}>
              ~{reachCalc.estimate.toLocaleString()} people
            </StatHero>
            <MetaLabel style={{ marginTop: 4, lineHeight: 16 }}>
              At ${numericGoal.toLocaleString()} goal: ~${reachCalc.adBudget.toLocaleString()} dedicated ad budget creates ~{reachCalc.impressions.toLocaleString()} ad impressions at ${(demoConfig.cpmUsd).toFixed(2)} CPM.
            </MetaLabel>
          </View>
        )}
      </Card>

      {/* 2. FEES & FUNDING POLICY */}
      <Card style={{ marginBottom: tokens.spacing.md, padding: tokens.spacing.md, backgroundColor: colors.paperSecondary }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
          <Ionicons name="shield-outline" size={16} color={colors.ink} style={{ marginRight: 6 }} />
          <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
            FEES & FUNDING POLICY
          </SmallCapsLabel>
        </View>

        <View style={{ gap: 6 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <BodyText style={{ fontSize: 13, color: colors.mutedInk }}>Platform Maintenance & Editorial Review</BodyText>
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>5.0%</Text>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <BodyText style={{ fontSize: 13, color: colors.mutedInk }}>Payment Processing (Stripe / Banking)</BodyText>
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>2.9% + $0.30</Text>
          </View>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingTop: 6,
              borderTopWidth: 1,
              borderTopColor: colors.hairline,
            }}
          >
            <BodyText style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.positive }}>
              Direct Ad Spend on Selected Channels
            </BodyText>
            <Text style={{ fontSize: 13, fontFamily: fonts.sansBold, color: colors.positive }}>~92.1%</Text>
          </View>
        </View>

        <MetaLabel style={{ marginTop: 10, lineHeight: 16 }}>
          Policy: All net contributions are deployed directly to ad network delivery once the campaign is funded and approved. If a campaign is not funded within the duration window, contributions are returned or credited per backer preference.
        </MetaLabel>
      </Card>

      {/* 3. COMPLETE CAMPAIGN PREVIEW SECTION */}
      <View style={{ marginBottom: tokens.spacing.md }}>
        <TouchableOpacity
          onPress={() => setPreviewExpanded(!previewExpanded)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: colors.surface,
            padding: tokens.spacing.md,
            borderRadius: tokens.radius.sm,
            borderWidth: 1,
            borderColor: colors.hairline,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Ionicons name="eye-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
            <Text style={{ fontSize: 15, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
              Complete Campaign Preview
            </Text>
          </View>
          <Ionicons
            name={previewExpanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.mutedInk}
          />
        </TouchableOpacity>

        {previewExpanded && (
          <View style={{ marginTop: 10, gap: 10 }}>
            {/* Basics Header Preview */}
            <Card style={{ padding: tokens.spacing.md }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <View
                  style={{
                    backgroundColor: colors.paperSecondary,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: tokens.radius.xs,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                  }}
                >
                  <SmallCapsLabel style={{ fontSize: 10, color: colors.ink }}>
                    {draft.category || 'COMMUNITY'}
                  </SmallCapsLabel>
                </View>
                <MetaLabel>
                  by {draft.creatorName || 'Campaign Organizer'}
                </MetaLabel>
              </View>

              <Headline style={{ fontSize: 18, color: colors.ink, marginBottom: 6 }}>
                {draft.title || 'Untitled Campaign'}
              </Headline>

              {draft.summary ? (
                <BodyText style={{ fontSize: 13, color: colors.mutedInk, lineHeight: 18 }}>
                  {draft.summary}
                </BodyText>
              ) : null}

              {draft.coverUrl && (
                <View style={{ marginTop: 10, borderRadius: tokens.radius.sm, overflow: 'hidden', height: 160 }}>
                  <Image source={{ uri: draft.coverUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                </View>
              )}
            </Card>

            {/* Story Blocks Preview */}
            {draft.storyBlocks && draft.storyBlocks.length > 0 && (
              <Card style={{ padding: tokens.spacing.md }}>
                <SmallCapsLabel style={{ color: colors.ink, marginBottom: 10 }}>
                  EDITORIAL STORY
                </SmallCapsLabel>
                {draft.storyBlocks.map((block: any, idx: number) => (
                  <StoryBlockRenderer key={block.id || idx} block={block} index={idx} />
                ))}
              </Card>
            )}

            {/* Grounding Sources Preview */}
            {draft.sources && draft.sources.length > 0 && (
              <Card style={{ padding: tokens.spacing.md }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Ionicons name="library-outline" size={16} color={colors.accent} style={{ marginRight: 6 }} />
                  <SmallCapsLabel style={{ color: colors.ink }}>
                    GROUNDING SOURCES ({draft.sources.length})
                  </SmallCapsLabel>
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

            {/* Visuals & Ad Preview */}
            <Card style={{ padding: tokens.spacing.md }}>
              <SmallCapsLabel style={{ color: colors.ink, marginBottom: 10 }}>
                SOCIAL AD CREATIVE
              </SmallCapsLabel>
              <FeedPlacementPreview
                headline={draft.headline || draft.title || 'Ad Headline'}
                description={draft.adDescription || draft.summary || 'Ad primary text'}
                imageUrl={draft.adImages?.[0] || draft.coverUrl}
                cta={draft.cta || 'Learn More'}
                creatorName={draft.creatorName || 'Campaign Organizer'}
              />
            </Card>

            {/* Audience & Distribution Breakdown */}
            <Card style={{ padding: tokens.spacing.md, backgroundColor: colors.paperSecondary }}>
              <SmallCapsLabel style={{ color: colors.ink, marginBottom: 8 }}>
                AUDIENCE & DISTRIBUTION
              </SmallCapsLabel>
              <View style={{ gap: 4 }}>
                <BodyText style={{ fontSize: 13, color: colors.ink }}>
                  <Text style={{ fontFamily: fonts.sansSemiBold }}>Locations: </Text>
                  {draft.locations?.join(', ') || 'Cook County'}
                </BodyText>
                <BodyText style={{ fontSize: 13, color: colors.ink }}>
                  <Text style={{ fontFamily: fonts.sansSemiBold }}>Interests: </Text>
                  {draft.interests?.join(', ') || 'Public Health'}
                </BodyText>
                <BodyText style={{ fontSize: 13, color: colors.ink }}>
                  <Text style={{ fontFamily: fonts.sansSemiBold }}>Channels: </Text>
                  {draft.channels?.join(', ') || 'Meta, Instagram'}
                </BodyText>
                <BodyText style={{ fontSize: 13, color: colors.ink }}>
                  <Text style={{ fontFamily: fonts.sansSemiBold }}>Duration: </Text>
                  {draft.durationDays || 30} days
                </BodyText>
              </View>
            </Card>
          </View>
        )}
      </View>

      {/* 4. REQUIRED SUBMISSION CHECKBOXES */}
      <Card style={{ marginBottom: tokens.spacing.lg, padding: tokens.spacing.md }}>
        <SmallCapsLabel style={{ color: colors.ink, marginBottom: 10 }}>
          SUBMISSION AGREEMENTS & REVIEW
        </SmallCapsLabel>

        {/* Checkbox 1: Grounded Claims */}
        <TouchableOpacity
          onPress={() => setConfirmGroundedSources(!confirmGroundedSources)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 }}
        >
          <Ionicons
            name={confirmGroundedSources ? 'checkbox-outline' : 'square-outline'}
            size={20}
            color={confirmGroundedSources ? colors.accent : colors.mutedInk}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <BodyText style={{ fontSize: 13, color: colors.ink, flex: 1, lineHeight: 18 }}>
            I confirm that all factual claims in this campaign are grounded in the listed public sources and official records.
          </BodyText>
        </TouchableOpacity>

        {/* Checkbox 2: Rules & Policies */}
        <TouchableOpacity
          onPress={() => setAgreePolicies(!agreePolicies)}
          activeOpacity={0.7}
          style={{ flexDirection: 'row', alignItems: 'flex-start' }}
        >
          <Ionicons
            name={agreePolicies ? 'checkbox-outline' : 'square-outline'}
            size={20}
            color={agreePolicies ? colors.accent : colors.mutedInk}
            style={{ marginRight: 8, marginTop: 1 }}
          />
          <BodyText style={{ fontSize: 13, color: colors.ink, flex: 1, lineHeight: 18 }}>
            I agree to the campaign guidelines, fees, and advertising policies. I understand that actual reach depends on market inventory and delivery performance.
          </BodyText>
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
