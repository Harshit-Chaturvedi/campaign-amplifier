import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import {
  Headline,
  Subheading,
  BodyText,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { apiClient } from '../../api/client';
import { colors, fonts, tokens } from '../../theme/tokens';
import type { CampaignCategory } from '../../types/campaign';

interface Step1BasicsProps {
  draft: any;
  onChange: (fields: any) => void;
}

const CATEGORIES: { key: CampaignCategory; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'environment', label: 'Environment', icon: 'leaf-outline' },
  { key: 'health', label: 'Health', icon: 'heart-outline' },
  { key: 'science', label: 'Science', icon: 'flask-outline' },
  { key: 'education', label: 'Education', icon: 'school-outline' },
  { key: 'public_policy', label: 'Public Policy', icon: 'document-text-outline' },
  { key: 'economic_policy', label: 'Economic Policy', icon: 'trending-up-outline' },
  { key: 'community', label: 'Community', icon: 'people-outline' },
  { key: 'arts_culture', label: 'Arts & Culture', icon: 'color-palette-outline' },
  { key: 'business', label: 'Business', icon: 'business-outline' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal-circle-outline' },
];

export function Step1Basics({ draft, onChange }: Step1BasicsProps) {
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<any | null>(null);

  const titleLength = (draft.title || '').length;

  const handlePickCover = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo access to upload a campaign cover image.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.85,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // Validate image size (< 10MB)
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Please choose an image under 10MB.');
          return;
        }
        onChange({ coverUrl: asset.uri });
      }
    } catch (e: any) {
      Alert.alert('Image error', 'Unable to select image. Please try again.');
    }
  };

  const handleRequestAISuggestions = async () => {
    const seedText = draft.summary || draft.title;
    if (!seedText || seedText.trim().length < 5) {
      Alert.alert(
        'Provide a brief topic first',
        'Please enter a title or a few words in the summary before asking for AI suggestions.'
      );
      return;
    }

    setIsSuggesting(true);
    try {
      const data = await apiClient.suggestFromText(seedText);
      setAiSuggestions(data);
    } catch {
      Alert.alert('Suggestion error', 'Unable to reach suggestion service. Please try again.');
    } finally {
      setIsSuggesting(false);
    }
  };

  const applySuggestion = (field: string, value: any) => {
    onChange({ [field]: value });
  };

  return (
    <View style={{ gap: tokens.spacing.lg }}>
      {/* Demo Sample Banner */}
      {(draft.isDemoSample || draft.demo_mode) && (
        <View
          style={{
            backgroundColor: colors.paperSecondary,
            borderColor: colors.hairline,
            borderWidth: 1,
            borderRadius: tokens.radius.sm,
            padding: tokens.spacing.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              backgroundColor: colors.accent,
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: tokens.radius.xs,
            }}
          >
            <SmallCapsLabel style={{ fontSize: 10, color: colors.surface }}>
              Demo sample
            </SmallCapsLabel>
          </View>
          <BodyText style={{ flex: 1, fontSize: 12, color: colors.mutedInk, lineHeight: 17 }}>
            This draft was pre-filled with demo sample content. All fields are editable and deletable. Funding goal is never set by AI.
          </BodyText>
        </View>
      )}

      {/* 1. Title */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
            Campaign Title <Text style={{ color: colors.danger }}>*</Text>
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontFamily: fonts.sansMedium,
              color: titleLength > 60 ? colors.danger : titleLength >= 50 ? colors.warning : colors.secondaryCaption,
            }}
          >
            {titleLength}/60
          </Text>
        </View>
        <Input
          accessibilityLabel="Campaign Title"
          value={draft.title || ''}
          onChangeText={(val) => onChange({ title: val })}
          maxLength={60}
          placeholder="e.g. Clean drinking water in every public school"
          helper="The beginning of the title may be used as the headline across ad placements."
        />
      </View>

      {/* 2. Category */}
      <View>
        <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 4 }}>
          Category <Text style={{ color: colors.danger }}>*</Text>
        </Text>
        <MetaLabel style={{ marginBottom: 10 }}>
          Select the topic that best matches your evidence and public policy focus.
        </MetaLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {CATEGORIES.map((cat) => {
            const isSelected = (draft.category || 'environment') === cat.key;
            return (
              <TouchableOpacity
                key={cat.key}
                accessibilityRole="button"
                accessibilityLabel={`Category ${cat.label}`}
                onPress={() => onChange({ category: cat.key })}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  borderRadius: tokens.radius.sm,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.hairline,
                  backgroundColor: isSelected ? colors.surface : colors.paperSecondary,
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={14}
                  color={isSelected ? colors.accent : colors.mutedInk}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: isSelected ? fonts.sansSemiBold : fonts.sansRegular,
                    color: isSelected ? colors.accent : colors.ink,
                  }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Creator / Organisation Name */}
      <View>
        <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 6 }}>
          Creator or Organisation Name <Text style={{ color: colors.danger }}>*</Text>
        </Text>
        <Input
          accessibilityLabel="Creator or Organisation Name"
          value={draft.creatorName || ''}
          onChangeText={(val) => onChange({ creatorName: val })}
          placeholder="e.g. County Clean Water Coalition or Jane Doe"
          helper="Appears on public campaign listings and ad disclosure banners."
        />
      </View>

      {/* 4. Short Summary */}
      <View>
        <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 6 }}>
          Short Summary
        </Text>
        <Input
          accessibilityLabel="Short Summary"
          value={draft.summary || ''}
          onChangeText={(val) => onChange({ summary: val })}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
          placeholder="A concise, 1-3 sentence explanation of the documented problem and the desired change."
          helper="This is shown in discovery feeds and search cards."
        />
      </View>

      {/* 5. Cover Image */}
      <View>
        <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 4 }}>
          Cover Image (Optional)
        </Text>
        <MetaLabel style={{ marginBottom: 10 }}>
          Recommended: 16:9 ratio, JPEG or PNG, under 10MB.
        </MetaLabel>

        {draft.coverUrl ? (
          <View style={{ borderRadius: tokens.radius.md, overflow: 'hidden', borderWidth: 1, borderColor: colors.hairline }}>
            <Image
              source={{ uri: draft.coverUrl }}
              style={{ width: '100%', height: 180 }}
              resizeMode="cover"
            />
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                padding: 10,
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.hairline,
              }}
            >
              <TouchableOpacity
                onPress={handlePickCover}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="refresh-outline" size={15} color={colors.accent} style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.accent }}>Replace photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onChange({ coverUrl: '' })}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="trash-outline" size={15} color={colors.danger} style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.danger }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Select Cover Image"
            onPress={handlePickCover}
            style={{
              height: 120,
              borderRadius: tokens.radius.md,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.hairlineDark,
              backgroundColor: colors.paperSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="cloud-upload-outline" size={26} color={colors.mutedInk} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink, marginTop: 6 }}>
              Select Cover Image
            </Text>
            <MetaLabel style={{ marginTop: 2 }}>
              From Photo Library (Max 10MB)
            </MetaLabel>
          </TouchableOpacity>
        )}
      </View>

      {/* 6. Suggest with AI Card */}
      <Card style={{ padding: tokens.spacing.md, backgroundColor: colors.paperSecondary }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles-outline" size={16} color={colors.accent} />
            <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
              Suggest with AI
            </SmallCapsLabel>
          </View>
          <Button
            title={isSuggesting ? 'Drafting...' : 'Suggest Ideas'}
            size="sm"
            variant="outline"
            icon="bulb-outline"
            loading={isSuggesting}
            onPress={handleRequestAISuggestions}
          />
        </View>

        <MetaLabel style={{ marginTop: 6, lineHeight: 17 }}>
          Calls our Gemini draft assistant to suggest titles, category, summary, and ad headlines. Suggestions are never auto-applied and never touch your funding goal.
        </MetaLabel>

        {aiSuggestions && (
          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.hairline, gap: 10 }}>
            {/* Suggestion 1: Title */}
            <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
              <SmallCapsLabel style={{ fontSize: 10, color: colors.mutedInk }}>
                SUGGESTED TITLE
              </SmallCapsLabel>
              <Text style={{ fontSize: 14, fontFamily: fonts.serifBold, color: colors.ink, marginVertical: 4 }}>
                {aiSuggestions.title}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => applySuggestion('title', aiSuggestions.title)}
                  style={{ backgroundColor: colors.paperSecondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}
                >
                  <SmallCapsLabel style={{ color: colors.accent }}>USE TITLE</SmallCapsLabel>
                </TouchableOpacity>
              </View>
            </View>

            {/* Suggestion 2: Category */}
            {aiSuggestions.category && (
              <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
                <SmallCapsLabel style={{ fontSize: 10, color: colors.mutedInk }}>
                  SUGGESTED CATEGORY
                </SmallCapsLabel>
                <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink, marginVertical: 4 }}>
                  {aiSuggestions.category.replace('_', ' ').toUpperCase()}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => applySuggestion('category', aiSuggestions.category)}
                    style={{ backgroundColor: colors.paperSecondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}
                  >
                    <SmallCapsLabel style={{ color: colors.accent }}>APPLY CATEGORY</SmallCapsLabel>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Suggestion 3: Summary */}
            {aiSuggestions.summary && (
              <View style={{ backgroundColor: colors.surface, padding: 12, borderRadius: tokens.radius.sm, borderWidth: 1, borderColor: colors.hairline }}>
                <SmallCapsLabel style={{ fontSize: 10, color: colors.mutedInk }}>
                  SUGGESTED SUMMARY
                </SmallCapsLabel>
                <BodyText style={{ fontSize: 13, color: colors.mutedInk, marginVertical: 4, lineHeight: 18 }}>
                  {aiSuggestions.summary}
                </BodyText>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => applySuggestion('summary', aiSuggestions.summary)}
                    style={{ backgroundColor: colors.paperSecondary, paddingHorizontal: 10, paddingVertical: 5, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}
                  >
                    <SmallCapsLabel style={{ color: colors.accent }}>USE SUMMARY</SmallCapsLabel>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setAiSuggestions(null)}
              style={{ alignItems: 'center', paddingVertical: 4 }}
            >
              <MetaLabel>Dismiss Suggestions</MetaLabel>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </View>
  );
}
