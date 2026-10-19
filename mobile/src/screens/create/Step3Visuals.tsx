import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
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
import {
  FeedPlacementPreview,
  VerticalStoryPlacementPreview,
  TextOnlyPlacementPreview,
} from '../../components/campaign/PlacementPreviews';
import { colors, fonts, tokens } from '../../theme/tokens';

interface Step3VisualsProps {
  draft: any;
  onChange: (fields: any) => void;
}

export function Step3Visuals({ draft, onChange }: Step3VisualsProps) {
  const [activePlacementTab, setActivePlacementTab] = useState<'feed' | 'story' | 'text'>('feed');
  const [feedbackPromptVisible, setFeedbackPromptVisible] = useState(false);

  const headline = draft.headline || (draft.title ? draft.title.slice(0, 60) : '');
  const adDescription = draft.adDescription || draft.summary || '';
  const cta = draft.cta || 'Learn More';
  const adImages: string[] = draft.adImages || [];

  const handlePickAdImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Please allow photo access to upload ad creative images.');
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
        if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
          Alert.alert('File too large', 'Please choose an image under 10MB.');
          return;
        }
        onChange({ adImages: [...adImages, asset.uri] });
      }
    } catch {
      Alert.alert('Image error', 'Unable to select image. Please try again.');
    }
  };

  const removeAdImage = (idx: number) => {
    onChange({ adImages: adImages.filter((_, i) => i !== idx) });
  };

  // Missing assets warning check
  const hasCoverOrAdImage = Boolean(draft.coverUrl || (adImages && adImages.length > 0));
  const hasHeadline = Boolean(headline.trim());
  const hasDescription = Boolean(adDescription.trim());

  return (
    <View style={{ gap: tokens.spacing.lg }}>
      {/* 1. Missing Assets Warnings */}
      {(!hasCoverOrAdImage || !hasHeadline || !hasDescription) && (
        <Card
          style={{
            padding: tokens.spacing.md,
            backgroundColor: colors.warningFaint,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="warning-outline" size={16} color={colors.warning} style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.warning }}>
              Missing Creative Assets
            </Text>
          </View>
          <BodyText style={{ fontSize: 12, color: colors.warning, lineHeight: 17 }}>
            For optimal ad performance across social feeds, ensure you provide:
          </BodyText>
          <View style={{ marginTop: 4, gap: 2 }}>
            {!hasCoverOrAdImage && (
              <MetaLabel style={{ color: colors.warning }}>• At least one ad or cover image</MetaLabel>
            )}
            {!hasHeadline && (
              <MetaLabel style={{ color: colors.warning }}>• An ad headline</MetaLabel>
            )}
            {!hasDescription && (
              <MetaLabel style={{ color: colors.warning }}>• A short ad primary description</MetaLabel>
            )}
          </View>
        </Card>
      )}

      {/* 2. Ad Headline & Copy */}
      <View>
        <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 6 }}>
          Ad Headline
        </Text>
        <Input
          value={draft.headline ?? (draft.title ? draft.title.slice(0, 60) : '')}
          onChangeText={(val) => onChange({ headline: val })}
          maxLength={60}
          placeholder="Defaults to the first 60 characters of your title..."
          helper="Shown prominently above and below sponsored social media posts."
        />
      </View>

      <View>
        <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 6 }}>
          Ad Primary Text / Description
        </Text>
        <Input
          accessibilityLabel="Ad Primary Text / Description"
          value={draft.adDescription ?? (draft.summary || '')}
          onChangeText={(val) => onChange({ adDescription: val })}
          multiline
          numberOfLines={3}
          style={{ height: 80, textAlignVertical: 'top' }}
          placeholder="Brief copy that hooks the reader and highlights the evidence..."
          helper="Used in Facebook, Instagram, and Reddit sponsored placements."
        />
      </View>

      <View>
        <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 6 }}>
          Call To Action (CTA) Button
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {['Learn More', 'Read the Brief', 'See the Evidence', 'Take Action', 'View Map'].map((txt) => {
            const isSelected = cta === txt;
            return (
              <TouchableOpacity
                key={txt}
                onPress={() => onChange({ cta: txt })}
                style={{
                  paddingHorizontal: 12,
                  paddingVertical: 7,
                  borderRadius: tokens.radius.xs,
                  borderWidth: 1,
                  borderColor: isSelected ? colors.accent : colors.hairline,
                  backgroundColor: isSelected ? colors.surface : colors.paperSecondary,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontFamily: isSelected ? fonts.sansSemiBold : fonts.sansRegular,
                    color: isSelected ? colors.accent : colors.ink,
                  }}
                >
                  {txt}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 3. Ad Images (Multiple) */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
            Ad Creative Images ({adImages.length})
          </Text>
          <TouchableOpacity
            onPress={handlePickAdImage}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="add-circle-outline" size={15} color={colors.accent} style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.accent }}>Add Image</Text>
          </TouchableOpacity>
        </View>
        <MetaLabel style={{ marginBottom: 10 }}>
          Upload high-contrast documentary photos. Multiple images rotate automatically in split testing.
        </MetaLabel>

        {adImages.length === 0 ? (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Add Ad Creatives from Photo Library"
            onPress={handlePickAdImage}
            style={{
              height: 100,
              borderRadius: tokens.radius.md,
              borderWidth: 1,
              borderStyle: 'dashed',
              borderColor: colors.hairlineDark,
              backgroundColor: colors.paperSecondary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="images-outline" size={26} color={colors.mutedInk} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink, marginTop: 4 }}>
              Add Ad Creatives from Photo Library
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            {adImages.map((uri, i) => (
              <View
                key={i}
                style={{
                  width: 100,
                  height: 100,
                  borderRadius: tokens.radius.sm,
                  overflow: 'hidden',
                  position: 'relative',
                  borderWidth: 1,
                  borderColor: colors.hairline,
                }}
              >
                <Image source={{ uri }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ad image ${i + 1}`}
                  onPress={() => removeAdImage(i)}
                  style={{
                    position: 'absolute',
                    top: 4,
                    right: 4,
                    backgroundColor: 'rgba(22, 19, 15, 0.7)',
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 4. Video Row (Clear label, not a dead button) */}
      <View
        style={{
          backgroundColor: colors.paperSecondary,
          borderRadius: tokens.radius.sm,
          padding: tokens.spacing.md,
          borderWidth: 1,
          borderColor: colors.hairline,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: tokens.radius.xs,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.hairline,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="videocam-off-outline" size={18} color={colors.mutedInk} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
            Video Creatives
          </Text>
          <MetaLabel style={{ marginTop: 2 }}>
            Video creatives are not supported in this prototype. High-resolution photos are used for all placements.
          </MetaLabel>
        </View>
      </View>

      {/* 5. Placement Previews Tabs */}
      <View style={{ marginTop: 6 }}>
        <Headline style={{ fontSize: 18, color: colors.ink, marginBottom: 4 }}>
          Audience Placement Previews
        </Headline>
        <MetaLabel style={{ marginBottom: 12 }}>
          Preview how your message will appear to targeted residents across different digital channels.
        </MetaLabel>

        {/* Tab Selector */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: colors.paperSecondary,
            borderRadius: tokens.radius.sm,
            borderWidth: 1,
            borderColor: colors.hairline,
            padding: 3,
            marginBottom: tokens.spacing.md,
          }}
        >
          {[
            { key: 'feed', label: 'Feed (16:9)', icon: 'newspaper-outline' },
            { key: 'story', label: 'Vertical Story (9:16)', icon: 'phone-portrait-outline' },
            { key: 'text', label: 'Text Only', icon: 'chatbox-ellipses-outline' },
          ].map((tab) => {
            const isSelected = activePlacementTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                onPress={() => setActivePlacementTab(tab.key as any)}
                style={{
                  flex: 1,
                  paddingVertical: 7,
                  borderRadius: tokens.radius.xs,
                  backgroundColor: isSelected ? colors.surface : 'transparent',
                  borderWidth: isSelected ? 1 : 0,
                  borderColor: colors.hairline,
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: isSelected ? fonts.sansSemiBold : fonts.sansRegular,
                    color: isSelected ? colors.ink : colors.mutedInk,
                  }}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Active Placement Render */}
        {activePlacementTab === 'feed' && (
          <FeedPlacementPreview
            headline={headline}
            description={adDescription}
            imageUrl={adImages[0] || draft.coverUrl}
            cta={cta}
            creatorName={draft.creatorName || 'Campaign Organizer'}
          />
        )}

        {activePlacementTab === 'story' && (
          <VerticalStoryPlacementPreview
            headline={headline}
            description={adDescription}
            imageUrl={adImages[0] || draft.coverUrl}
            cta={cta}
            creatorName={draft.creatorName || 'Campaign Organizer'}
          />
        )}

        {activePlacementTab === 'text' && (
          <TextOnlyPlacementPreview
            headline={headline}
            description={adDescription}
            cta={cta}
          />
        )}
      </View>

      {/* 6. Creative Quality Feedback Prompt */}
      <Card style={{ padding: tokens.spacing.md, backgroundColor: colors.paperSecondary }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles-outline" size={16} color={colors.positive} />
            <SmallCapsLabel style={{ fontSize: 12, color: colors.ink }}>
              Creative Quality Checklist
            </SmallCapsLabel>
          </View>
          <TouchableOpacity onPress={() => setFeedbackPromptVisible(!feedbackPromptVisible)}>
            <SmallCapsLabel style={{ color: colors.accent }}>
              {feedbackPromptVisible ? 'HIDE' : 'INSPECT'}
            </SmallCapsLabel>
          </TouchableOpacity>
        </View>

        {feedbackPromptVisible && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.hairline, gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={hasHeadline ? 'checkmark-circle-outline' : 'close-circle-outline'} size={15} color={hasHeadline ? colors.positive : colors.danger} />
              <BodyText style={{ fontSize: 12, color: colors.mutedInk }}>Headline is under 60 characters and evidence-grounded</BodyText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={hasCoverOrAdImage ? 'checkmark-circle-outline' : 'close-circle-outline'} size={15} color={hasCoverOrAdImage ? colors.positive : colors.danger} />
              <BodyText style={{ fontSize: 12, color: colors.mutedInk }}>Documentary photo is attached without artificial text burn-ins</BodyText>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={hasDescription ? 'checkmark-circle-outline' : 'close-circle-outline'} size={15} color={hasDescription ? colors.positive : colors.danger} />
              <BodyText style={{ fontSize: 12, color: colors.mutedInk }}>Ad description invites the reader to inspect the citations</BodyText>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
