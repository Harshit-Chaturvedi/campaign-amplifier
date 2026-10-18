import React, { useState } from 'react';
import {
  View,
  Text,
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
import { apiClient } from '../../api/client';
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
    <View style={{ gap: 20 }}>
      {/* Demo Sample Banner */}
      {(draft.isDemoSample || draft.demo_mode) && (
        <View
          style={{
            backgroundColor: '#eff6ff',
            borderColor: '#93c5fd',
            borderWidth: 1,
            borderRadius: 12,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <View
            style={{
              backgroundColor: '#3b82f6',
              paddingHorizontal: 8,
              paddingVertical: 3,
              borderRadius: 6,
            }}
          >
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#ffffff', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Demo sample
            </Text>
          </View>
          <Text style={{ flex: 1, fontSize: 12, color: '#1e40af', lineHeight: 17 }}>
            This draft was pre-filled with demo sample content. All fields are editable and deletable. Funding goal is never set by AI.
          </Text>
        </View>
      )}

      {/* 1. Title */}
      <View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a' }}>
            Campaign Title <Text style={{ color: '#ef4444' }}>*</Text>
          </Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '600',
              color: titleLength > 60 ? '#ef4444' : titleLength >= 50 ? '#f59e0b' : '#94a3b8',
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
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 8 }}>
          Category <Text style={{ color: '#ef4444' }}>*</Text>
        </Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
          Select the topic that best matches your evidence and public policy focus.
        </Text>
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
                  paddingVertical: 9,
                  borderRadius: 10,
                  borderWidth: 1.5,
                  borderColor: isSelected ? '#4f46e5' : '#e2e8f0',
                  backgroundColor: isSelected ? '#eef2ff' : '#fff',
                }}
              >
                <Ionicons
                  name={cat.icon}
                  size={15}
                  color={isSelected ? '#4f46e5' : '#64748b'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: isSelected ? '700' : '500',
                    color: isSelected ? '#3730a3' : '#334155',
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
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
          Creator or Organisation Name <Text style={{ color: '#ef4444' }}>*</Text>
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
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
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
        <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginBottom: 6 }}>
          Cover Image (Optional)
        </Text>
        <Text style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
          Recommended: 16:9 ratio, JPEG or PNG, under 10MB.
        </Text>

        {draft.coverUrl ? (
          <View style={{ borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#e2e8f0' }}>
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
                backgroundColor: '#fff',
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
              }}
            >
              <TouchableOpacity
                onPress={handlePickCover}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="refresh-outline" size={16} color="#4f46e5" style={{ marginRight: 6 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#4f46e5' }}>Replace photo</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onChange({ coverUrl: '' })}
                style={{ flexDirection: 'row', alignItems: 'center' }}
              >
                <Ionicons name="trash-outline" size={16} color="#ef4444" style={{ marginRight: 4 }} />
                <Text style={{ fontSize: 13, fontWeight: '600', color: '#ef4444' }}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity
            onPress={handlePickCover}
            style={{
              height: 120,
              borderRadius: 14,
              borderWidth: 1.5,
              borderStyle: 'dashed',
              borderColor: '#cbd5e1',
              backgroundColor: '#f8fafc',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="cloud-upload-outline" size={30} color="#64748b" />
            <Text style={{ fontSize: 13, fontWeight: '700', color: '#475569', marginTop: 6 }}>
              Select Cover Image
            </Text>
            <Text style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              From Photo Library (Max 10MB)
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* 6. Suggest with AI Card */}
      <Card style={{ padding: 16, backgroundColor: '#fdf4ff', borderWidth: 1, borderColor: '#f0abfc' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="sparkles" size={18} color="#c026d3" />
            <Text style={{ fontSize: 14, fontWeight: '800', color: '#701a75' }}>
              Suggest with AI
            </Text>
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

        <Text style={{ fontSize: 12, color: '#86198f', marginTop: 6, lineHeight: 17 }}>
          Calls our Gemini draft assistant to suggest titles, category, summary, and ad headlines. Suggestions are never auto-applied and never touch your funding goal.
        </Text>

        {aiSuggestions && (
          <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#fae8ff', gap: 10 }}>
            {/* Suggestion 1: Title */}
            <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 10 }}>
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                Suggested Title
              </Text>
              <Text style={{ fontSize: 14, fontWeight: '700', color: '#0f172a', marginVertical: 4 }}>
                {aiSuggestions.title}
              </Text>
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => applySuggestion('title', aiSuggestions.title)}
                  style={{ backgroundColor: '#fdf4ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                >
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#c026d3' }}>Use Title</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Suggestion 2: Category */}
            {aiSuggestions.category && (
              <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                  Suggested Category
                </Text>
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0f172a', marginVertical: 4 }}>
                  {aiSuggestions.category.replace('_', ' ').toUpperCase()}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => applySuggestion('category', aiSuggestions.category)}
                    style={{ backgroundColor: '#fdf4ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#c026d3' }}>Apply Category</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Suggestion 3: Summary */}
            {aiSuggestions.summary && (
              <View style={{ backgroundColor: '#fff', padding: 12, borderRadius: 10 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                  Suggested Summary
                </Text>
                <Text style={{ fontSize: 13, color: '#334155', marginVertical: 4, lineHeight: 18 }}>
                  {aiSuggestions.summary}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                  <TouchableOpacity
                    onPress={() => applySuggestion('summary', aiSuggestions.summary)}
                    style={{ backgroundColor: '#fdf4ff', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 }}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#c026d3' }}>Use Summary</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            <TouchableOpacity
              onPress={() => setAiSuggestions(null)}
              style={{ alignItems: 'center', paddingVertical: 4 }}
            >
              <Text style={{ fontSize: 12, color: '#94a3b8' }}>Dismiss Suggestions</Text>
            </TouchableOpacity>
          </View>
        )}
      </Card>
    </View>
  );
}
