import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tokens } from '../../theme/tokens';

interface AmplificationNoticeProps {
  compact?: boolean;
}

export function AmplificationNotice({ compact = false }: AmplificationNoticeProps) {
  return (
    <View
      style={{
        backgroundColor: colors.surfaceSecondary,
        borderRadius: tokens.radii.md,
        padding: compact ? 12 : 14,
        borderWidth: 1,
        borderColor: colors.border,
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <Ionicons
        name="information-circle-outline"
        size={18}
        color={colors.inkSecondary}
        style={{ marginRight: 10, marginTop: 1 }}
      />
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: compact ? 11 : 12,
            fontFamily: fonts.sansSemiBold,
            color: colors.ink,
            letterSpacing: 0.5,
            textTransform: 'uppercase',
            marginBottom: 2,
          }}
        >
          Message amplification, not a donation
        </Text>
        <Text
          style={{
            fontSize: compact ? 12 : 13,
            fontFamily: fonts.sansRegular,
            color: colors.inkSecondary,
            lineHeight: compact ? 17 : 19,
          }}
        >
          Your contribution pays for advertising that spreads this message. It is not a donation to the cause, person, or organisation.
        </Text>
      </View>
    </View>
  );
}
