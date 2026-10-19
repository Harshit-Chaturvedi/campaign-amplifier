import React from 'react';
import { View, Text, TouchableOpacity, Linking, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { Source } from '../../types/campaign';
import { colors, fonts, tokens } from '../../theme/tokens';

interface SourceItemProps {
  source: Source;
  index?: number;
  style?: StyleProp<ViewStyle>;
}

export function SourceItem({ source, index, style }: SourceItemProps) {
  const handleOpen = () => {
    if (source.url) {
      Linking.openURL(source.url).catch(() => {});
    }
  };

  // Clean domain display
  let domain = '';
  try {
    const urlObj = new URL(source.url);
    domain = urlObj.hostname.replace(/^www\./, '');
  } catch {
    domain = source.url.replace(/^https?:\/\//, '').split('/')[0];
  }

  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={`Open source: ${source.title || domain || source.url}`}
      onPress={handleOpen}
      activeOpacity={0.7}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: colors.paperSecondary,
          borderWidth: 1,
          borderColor: colors.hairline,
          borderRadius: tokens.radius.xs,
          padding: 10,
          marginBottom: 8,
        },
        style,
      ]}
    >
      <View
        style={{
          width: 30,
          height: 30,
          borderRadius: tokens.radius.xs,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.hairline,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <Ionicons name="document-text-outline" size={15} color={colors.accent} />
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <Text
          style={{
            fontSize: 13,
            fontFamily: fonts.sansSemiBold,
            color: colors.ink,
            lineHeight: 18,
          }}
          numberOfLines={2}
        >
          {source.title || `Source ${index !== undefined ? index + 1 : ''}`}
        </Text>
        <Text
          style={{
            fontSize: 11,
            fontFamily: fonts.sansRegular,
            color: colors.mutedInk,
            marginTop: 2,
          }}
          numberOfLines={1}
        >
          {domain || source.url}
        </Text>
      </View>
      <Ionicons name="open-outline" size={14} color={colors.mutedInk} />
    </TouchableOpacity>
  );
}
