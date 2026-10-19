import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { StoryBlockRenderer } from '../../components/story/StoryBlockRenderer';
import { SourceItem } from '../../components/ui/SourceItem';
import {
  Headline,
  Subheading,
  BodyText,
  SmallCapsLabel,
  MetaLabel,
  Text,
} from '../../components/ui/Typography';
import { colors, fonts, tokens } from '../../theme/tokens';
import type { StoryBlock, Source } from '../../types/campaign';

interface Step2StoryProps {
  draft: any;
  onChange: (fields: any) => void;
}

export function Step2Story({ draft, onChange }: Step2StoryProps) {
  const [viewMode, setViewMode] = useState<'edit' | 'preview'>('edit');
  const [newSourceTitle, setNewSourceTitle] = useState('');
  const [newSourceUrl, setNewSourceUrl] = useState('');
  const [sourceError, setSourceError] = useState('');

  const storyBlocks: StoryBlock[] = draft.storyBlocks || [];
  const sources: Source[] = draft.sources || [];

  // 1. Block operations
  const addBlock = (type: StoryBlock['type']) => {
    let newBlock: StoryBlock;
    switch (type) {
      case 'heading':
        newBlock = { type: 'heading', text: '', level: 2 };
        break;
      case 'paragraph':
        newBlock = { type: 'paragraph', text: '' };
        break;
      case 'image':
        newBlock = { type: 'image', url: '', caption: '', credit: '' };
        break;
      case 'statistic':
        newBlock = { type: 'statistic', value: '', label: '' };
        break;
      case 'quote':
        newBlock = { type: 'quote', quote: '', attribution: '' };
        break;
      case 'action':
        newBlock = { type: 'action', title: '', description: '', url: '' };
        break;
      default:
        return;
    }
    onChange({ storyBlocks: [...storyBlocks, newBlock] });
  };

  const updateBlock = (index: number, patch: any) => {
    const next = [...storyBlocks];
    next[index] = { ...next[index], ...patch } as any;
    onChange({ storyBlocks: next });
  };

  const removeBlock = (index: number) => {
    onChange({ storyBlocks: storyBlocks.filter((_, idx) => idx !== index) });
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === storyBlocks.length - 1) return;
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    const next = [...storyBlocks];
    const temp = next[index];
    next[index] = next[targetIdx];
    next[targetIdx] = temp;
    onChange({ storyBlocks: next });
  };

  // Text formatting insertion helpers
  const wrapSelectedText = (index: number, tag: 'bold' | 'italic') => {
    const block = storyBlocks[index];
    if (block.type !== 'paragraph' && block.type !== 'heading') return;
    const current = block.text || '';
    if (!current) return;
    const updated = tag === 'bold' ? `**${current}**` : `_${current}_`;
    updateBlock(index, { text: updated });
  };

  // 2. Sources operations
  const isValidUrl = (url: string) => {
    return /^https?:\/\/.+\..+/i.test(url.trim());
  };

  const handleAddSource = () => {
    const url = newSourceUrl.trim();
    const title = newSourceTitle.trim() || url;
    if (!url) {
      setSourceError('Please provide a URL');
      return;
    }
    if (!isValidUrl(url)) {
      setSourceError('Please provide a valid URL starting with https:// or http://');
      return;
    }
    setSourceError('');
    const newSrc: Source = {
      id: `src-${Date.now().toString(36)}`,
      title,
      url,
    };
    onChange({ sources: [...sources, newSrc] });
    setNewSourceTitle('');
    setNewSourceUrl('');
  };

  const handleRemoveSource = (id: string) => {
    onChange({ sources: sources.filter((s) => s.id !== id) });
  };

  return (
    <View style={{ gap: tokens.spacing.lg }}>
      {/* View Mode Toggle: Edit vs Live Preview */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.paperSecondary,
          borderRadius: tokens.radius.sm,
          borderWidth: 1,
          borderColor: colors.hairline,
          padding: 3,
        }}
      >
        <TouchableOpacity
          onPress={() => setViewMode('edit')}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: tokens.radius.xs,
            backgroundColor: viewMode === 'edit' ? colors.surface : 'transparent',
            borderWidth: viewMode === 'edit' ? 1 : 0,
            borderColor: colors.hairline,
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="create-outline" size={15} color={viewMode === 'edit' ? colors.accent : colors.mutedInk} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: viewMode === 'edit' ? colors.ink : colors.mutedInk }}>
              Edit Story Blocks
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setViewMode('preview')}
          style={{
            flex: 1,
            paddingVertical: 8,
            borderRadius: tokens.radius.xs,
            backgroundColor: viewMode === 'preview' ? colors.surface : 'transparent',
            borderWidth: viewMode === 'preview' ? 1 : 0,
            borderColor: colors.hairline,
            alignItems: 'center',
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="eye-outline" size={15} color={viewMode === 'preview' ? colors.accent : colors.mutedInk} />
            <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: viewMode === 'preview' ? colors.ink : colors.mutedInk }}>
              Live Reader Preview
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* PREVIEW MODE */}
      {viewMode === 'preview' ? (
        <Card style={{ padding: tokens.spacing.lg, backgroundColor: colors.surface }}>
          <Headline style={{ fontSize: 20, color: colors.ink, marginBottom: tokens.spacing.md }}>
            Story Preview
          </Headline>

          {storyBlocks.length === 0 ? (
            <View style={{ paddingVertical: 30, alignItems: 'center' }}>
              <Ionicons name="reader-outline" size={32} color={colors.secondaryCaption} />
              <MetaLabel style={{ marginTop: 8 }}>
                No story blocks added yet. Switch to Edit to add blocks.
              </MetaLabel>
            </View>
          ) : (
            storyBlocks.map((b, idx) => <StoryBlockRenderer key={idx} block={b} index={idx} />)
          )}

          {/* Sources Section in Preview */}
          <View style={{ marginTop: tokens.spacing.lg, paddingTop: tokens.spacing.md, borderTopWidth: 1, borderTopColor: colors.hairline }}>
            <Headline style={{ fontSize: 16, color: colors.ink, marginBottom: 4 }}>
              Sources & Citations
            </Headline>
            <MetaLabel style={{ marginBottom: tokens.spacing.md }}>
              All sources are listed so readers can review the documented records themselves.
            </MetaLabel>
            {sources.length === 0 ? (
              <MetaLabel style={{ fontStyle: 'italic' }}>
                No external sources attached yet.
              </MetaLabel>
            ) : (
              sources.map((s, idx) => <SourceItem key={s.id || idx} source={s} index={idx} />)
            )}
          </View>
        </Card>
      ) : (
        /* EDIT MODE */
        <View style={{ gap: tokens.spacing.lg }}>
          {/* Add Block Toolbar */}
          <Card style={{ padding: tokens.spacing.md, backgroundColor: colors.paperSecondary }}>
            <SmallCapsLabel style={{ color: colors.ink, marginBottom: tokens.spacing.sm }}>
              ADD EDITORIAL BLOCK
            </SmallCapsLabel>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {[
                { type: 'heading', label: 'Heading', icon: 'text' },
                { type: 'paragraph', label: 'Paragraph', icon: 'reorder-four' },
                { type: 'statistic', label: 'Statistic', icon: 'stats-chart' },
                { type: 'quote', label: 'Quote', icon: 'chatbox-ellipses' },
                { type: 'image', label: 'Image', icon: 'image' },
                { type: 'action', label: 'Action Ask', icon: 'checkbox' },
              ].map((item) => (
                <TouchableOpacity
                  key={item.type}
                  onPress={() => addBlock(item.type as any)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: colors.surface,
                    paddingHorizontal: 12,
                    paddingVertical: 7,
                    borderRadius: tokens.radius.xs,
                    borderWidth: 1,
                    borderColor: colors.hairline,
                  }}
                >
                  <Ionicons name={item.icon as any} size={14} color={colors.accent} style={{ marginRight: 6 }} />
                  <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.ink }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Block Composer List */}
          {storyBlocks.length === 0 ? (
            <Card style={{ padding: tokens.spacing.xl, alignItems: 'center', borderStyle: 'dashed', borderWidth: 1, borderColor: colors.hairlineDark, backgroundColor: colors.paperSecondary }}>
              <Ionicons name="document-text-outline" size={32} color={colors.secondaryCaption} />
              <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, marginTop: 8 }}>
                Your story has no blocks yet
              </Text>
              <MetaLabel style={{ textAlign: 'center', marginTop: 4 }}>
                Choose a block above (Heading, Paragraph, Statistic, Quote, Image, or Action) to compose the argument.
              </MetaLabel>
            </Card>
          ) : (
            storyBlocks.map((block, idx) => (
              <Card
                key={idx}
                style={{
                  padding: tokens.spacing.md,
                  backgroundColor: colors.surface,
                }}
              >
                {/* Block Header: Type + Reorder / Delete */}
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                    paddingBottom: 8,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.hairline,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View
                      style={{
                        backgroundColor: colors.paperSecondary,
                        borderWidth: 1,
                        borderColor: colors.hairline,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: tokens.radius.xs,
                      }}
                    >
                      <SmallCapsLabel style={{ fontSize: 10, color: colors.ink }}>
                        {block.type}
                      </SmallCapsLabel>
                    </View>
                    <MetaLabel>#{idx + 1}</MetaLabel>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    {/* Move Up */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Move block ${idx + 1} up`}
                      onPress={() => moveBlock(idx, 'up')}
                      disabled={idx === 0}
                      style={{ padding: 4, opacity: idx === 0 ? 0.3 : 1 }}
                    >
                      <Ionicons name="arrow-up" size={17} color={colors.mutedInk} />
                    </TouchableOpacity>
                    {/* Move Down */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Move block ${idx + 1} down`}
                      onPress={() => moveBlock(idx, 'down')}
                      disabled={idx === storyBlocks.length - 1}
                      style={{ padding: 4, opacity: idx === storyBlocks.length - 1 ? 0.3 : 1 }}
                    >
                      <Ionicons name="arrow-down" size={17} color={colors.mutedInk} />
                    </TouchableOpacity>
                    {/* Delete */}
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Delete block ${idx + 1}`}
                      onPress={() => removeBlock(idx)}
                      style={{ padding: 4, marginLeft: 4 }}
                    >
                      <Ionicons name="trash-outline" size={17} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Block Form Fields by Type */}
                {block.type === 'heading' && (
                  <View>
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      {([1, 2, 3] as const).map((lvl) => (
                        <TouchableOpacity
                          key={lvl}
                          onPress={() => updateBlock(idx, { level: lvl })}
                          style={{
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            borderRadius: tokens.radius.xs,
                            backgroundColor: (block.level || 2) === lvl ? colors.accent : colors.paperSecondary,
                            borderWidth: 1,
                            borderColor: (block.level || 2) === lvl ? colors.accent : colors.hairline,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 12,
                              fontFamily: fonts.sansSemiBold,
                              color: (block.level || 2) === lvl ? colors.surface : colors.ink,
                            }}
                          >
                            H{lvl}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <Input
                      value={block.text || ''}
                      onChangeText={(val) => updateBlock(idx, { text: val })}
                      placeholder="Enter section heading..."
                    />
                  </View>
                )}

                {block.type === 'paragraph' && (
                  <View>
                    {/* Inline formatting buttons */}
                    <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                      <TouchableOpacity
                        onPress={() => wrapSelectedText(idx, 'bold')}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.paperSecondary, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: fonts.sansBold, color: colors.ink }}>B</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => wrapSelectedText(idx, 'italic')}
                        style={{ paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.paperSecondary, borderRadius: tokens.radius.xs, borderWidth: 1, borderColor: colors.hairline }}
                      >
                        <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, fontStyle: 'italic', color: colors.ink }}>I</Text>
                      </TouchableOpacity>
                    </View>
                    <Input
                      value={block.text || ''}
                      onChangeText={(val) => updateBlock(idx, { text: val })}
                      multiline
                      numberOfLines={4}
                      style={{ minHeight: 90, textAlignVertical: 'top' }}
                      placeholder="Compose paragraph text..."
                    />
                  </View>
                )}

                {block.type === 'statistic' && (
                  <View style={{ gap: 10 }}>
                    <Input
                      label="Key Metric / Value"
                      value={block.value || ''}
                      onChangeText={(val) => updateBlock(idx, { value: val })}
                      placeholder="e.g. 11 of 30 or $340"
                    />
                    <Input
                      label="Metric Label / Explanation"
                      value={block.label || ''}
                      onChangeText={(val) => updateBlock(idx, { label: val })}
                      placeholder="e.g. Schools tested with elevated lead lines"
                    />
                  </View>
                )}

                {block.type === 'quote' && (
                  <View style={{ gap: 10 }}>
                    <Input
                      label="Quote Text"
                      value={block.quote || ''}
                      onChangeText={(val) => updateBlock(idx, { quote: val })}
                      multiline
                      numberOfLines={3}
                      placeholder="Exact quotation from public records or subject expert..."
                    />
                    <Input
                      label="Attribution / Role"
                      value={block.attribution || ''}
                      onChangeText={(val) => updateBlock(idx, { attribution: val })}
                      placeholder="e.g. Elena Rostova, Water Coalition Director"
                    />
                  </View>
                )}

                {block.type === 'image' && (
                  <View style={{ gap: 10 }}>
                    <Input
                      label="Image Direct URL"
                      value={block.url || ''}
                      onChangeText={(val) => updateBlock(idx, { url: val })}
                      placeholder="https://..."
                    />
                    <Input
                      label="Caption"
                      value={block.caption || ''}
                      onChangeText={(val) => updateBlock(idx, { caption: val })}
                      placeholder="Explaining what this photo documents..."
                    />
                    <Input
                      label="Photo Credit"
                      value={block.credit || ''}
                      onChangeText={(val) => updateBlock(idx, { credit: val })}
                      placeholder="e.g. Coalition Field Inspection"
                    />
                  </View>
                )}

                {block.type === 'action' && (
                  <View style={{ gap: 10 }}>
                    <Input
                      label="Action Title"
                      value={block.title || ''}
                      onChangeText={(val) => updateBlock(idx, { title: val })}
                      placeholder="e.g. Check Your Local School District"
                    />
                    <Input
                      label="Action Description"
                      value={block.description || ''}
                      onChangeText={(val) => updateBlock(idx, { description: val })}
                      placeholder="What should the reader do right now?"
                    />
                    <Input
                      label="Action Link (URL)"
                      value={block.url || ''}
                      onChangeText={(val) => updateBlock(idx, { url: val })}
                      placeholder="https://..."
                    />
                  </View>
                )}
              </Card>
            ))
          )}

          {/* Sources Manager */}
          <Card style={{ padding: tokens.spacing.md, backgroundColor: colors.surface, marginTop: tokens.spacing.sm }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Ionicons name="link-outline" size={18} color={colors.accent} style={{ marginRight: 8 }} />
              <Headline style={{ fontSize: 16, color: colors.ink }}>
                Sources Manager
              </Headline>
            </View>
            <MetaLabel style={{ marginBottom: tokens.spacing.md }}>
              All campaigns must cite grounded public sources (government audits, published research, meeting minutes).
            </MetaLabel>

            {/* Existing Sources List */}
            {sources.length > 0 && (
              <View style={{ marginBottom: tokens.spacing.md, gap: 8 }}>
                {sources.map((src) => (
                  <View
                    key={src.id}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: colors.paperSecondary,
                      padding: 10,
                      borderRadius: tokens.radius.xs,
                      borderWidth: 1,
                      borderColor: colors.hairline,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }} numberOfLines={1}>
                        {src.title}
                      </Text>
                      <Text style={{ fontSize: 11, fontFamily: fonts.sansRegular, color: colors.accent }} numberOfLines={1}>
                        {src.url}
                      </Text>
                    </View>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Remove source ${src.title}`}
                      onPress={() => handleRemoveSource(src.id)}
                      style={{ padding: 4 }}
                    >
                      <Ionicons name="trash-outline" size={16} color={colors.danger} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {/* Add New Source Inputs */}
            <View style={{ gap: 8 }}>
              <Input
                label="Source Title"
                value={newSourceTitle}
                onChangeText={setNewSourceTitle}
                placeholder="e.g. County Public Health Water Quality Assessment 2025"
              />
              <Input
                label="Source URL (Required)"
                value={newSourceUrl}
                onChangeText={(val) => {
                  setNewSourceUrl(val);
                  setSourceError('');
                }}
                error={sourceError}
                placeholder="https://example.gov/report-2025.pdf"
                autoCapitalize="none"
              />
              <Button
                title="Add Source"
                size="sm"
                variant="secondary"
                icon="add-circle-outline"
                onPress={handleAddSource}
              />
            </View>
          </Card>
        </View>
      )}
    </View>
  );
}
