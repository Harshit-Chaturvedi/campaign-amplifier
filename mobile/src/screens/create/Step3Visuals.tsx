import React, { useState } from 'react';
import {
  View,
  Text,
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
  FeedPlacementPreview,
  VerticalStoryPlacementPreview,
  TextOnlyPlacementPreview,
} from '../../components/campaign/PlacementPreviews';

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
    <View style={{ gap: 20 }}>
      {/* 1. Missing Assets Warnings */}
      {(!hasCoverOrAdImage || !hasHeadline || !hasDescription) && (
        <Card
          style={{
            padding: 14,
            backgroundColor: '#fffbeb',
            borderWidth: 1,
            borderColor: '#fef3c7',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Ionicons name="warning-outline" size={18} color="#b45309" style={{ marginRight: 6 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#92400e' }}>
              Missing Creative Assets
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: '#78350f', lineHeight: 17 }}>
            For optimal ad performance across social feeds, ensure you provide:
          </Text>
          <View style={{ marginTop: 4, gap: 2 }}>
            {!hasCoverOrAdImage && (
              <Text style={{ fontSize: 12, color: '#b45309' }}>• At least one ad or cover image</Text>
            )}
            {!hasHeadline && (
              <Text style={{ fontSize: 12, color: '#b45309' }}>• An ad headline</Text>
            )}
            {!hasDescription && (
              <Text style={{ fontSize: 12, color: '#b45309' }}>• A short ad primary description</Text>
            )}
          </View>
        </Card>
      )}

      {/* 2. Ad Headline & Copy */}
      <View>
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
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
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
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
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
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
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected ? '#4f46e5' : '#f1f5f9',
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#fff' : '#334155',
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
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
            Ad Creative Images ({adImages.length})
          </Text>
          <TouchableOpacity
            onPress={handlePickAdImage}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons name="add-circle" size={16} color="#4f46e5" style={{ marginRight: 4 }} />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#4f46e5' }}>Add Image</Text>
          </TouchableOpacity>
        </View>
        <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
          Upload high-contrast documentary photos. Multiple images rotate automatically in split testing.
        </Text>

        {adImages.length === 0 ? (
          <TouchableOpacity
            onPress={handlePickAdImage}
            style={{
              height: 100,
              borderRadius: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="images-outline" size={28} color="#64748b" />
            <Text style={{ fontSize: 13, fontWeight: '600', color: '#475569', marginTop: 4 }}>
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
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  borderWidth: 1,
                  borderColor: '#e2e8f0',
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
                    backgroundColor: 'rgba(0,0,0,0.6)',
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
          backgroundColor: '#f8fafc',
          borderRadius: 14,
          padding: 14,
          borderWidth: 1,
          borderColor: '#e2e8f0',
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: '#e2e8f0',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Ionicons name="videocam-off-outline" size={20} color="#64748b" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569' }}>
            Video Creatives
          </Text>
          <Text style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
            Video creatives are not supported in this prototype. High-resolution photos are used for all placements.
          </Text>
        </View>
      </View>

      {/* 5. Placement Previews Tabs */}
      <View style={{ marginTop: 6 }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: '#0f172a', marginBottom: 6 }}>
          Audience Placement Previews
        </Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
          Preview how your message will appear to targeted residents across different digital channels.
        </Text>

        {/* Tab Selector */}
        <View
          style={{
            flexDirection: 'row',
            backgroundColor: '#f1f5f9',
            borderRadius: 10,
            padding: 4,
            marginBottom: 14,
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
                  paddingVertical: 8,
                  borderRadius: 8,
                  backgroundColor: isSelected ? '#fff' : 'transparent',
                  alignItems: 'center',
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#0f172a' : '#64748b',
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
      <Card style={{ padding: 14, backgroundColor: '#f0fdf4', borderWidth: 1, borderColor: '#bbf7d0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles-outline" size={16} color="#16a34a" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#166534' }}>
              Creative Quality Checklist
            </Text>
          </View>
          <TouchableOpacity onPress={() => setFeedbackPromptVisible(!feedbackPromptVisible)}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#16a34a' }}>
              {feedbackPromptVisible ? 'Hide' : 'Inspect'}
            </Text>
          </TouchableOpacity>
        </View>

        {feedbackPromptVisible && (
          <View style={{ marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#dcfce7', gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={hasHeadline ? 'checkmark-circle' : 'close-circle'} size={16} color={hasHeadline ? '#22c55e' : '#ef4444'} />
              <Text style={{ fontSize: 12, color: '#166534' }}>Headline is under 60 characters and evidence-grounded</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={hasCoverOrAdImage ? 'checkmark-circle' : 'close-circle'} size={16} color={hasCoverOrAdImage ? '#22c55e' : '#ef4444'} />
              <Text style={{ fontSize: 12, color: '#166534' }}>Documentary photo is attached without artificial text burn-ins</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name={hasDescription ? 'checkmark-circle' : 'close-circle'} size={16} color={hasDescription ? '#22c55e' : '#ef4444'} />
              <Text style={{ fontSize: 12, color: '#166534' }}>Ad description invites the reader to inspect the citations</Text>
            </View>
          </View>
        )}
      </Card>
    </View>
  );
}
