import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tokens } from '../../theme/tokens';
import { Headline, BodyText, SmallCapsLabel } from './Typography';

interface InfoTooltipProps {
  title: string;
  description: string;
  size?: number;
  color?: string;
}

export function InfoTooltip({
  title,
  description,
  size = 18,
  color = colors.mutedInk,
}: InfoTooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={{ padding: 2 }}
      >
        <Ionicons name="information-circle-outline" size={size} color={color} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={{
            flex: 1,
            backgroundColor: 'rgba(22, 19, 15, 0.5)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 24,
          }}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View
            style={{
              backgroundColor: colors.surface,
              borderRadius: tokens.radius.sm,
              padding: tokens.spacing.lg,
              width: '100%',
              maxWidth: 380,
              borderWidth: 1,
              borderColor: colors.hairline,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                <Ionicons name="information-circle-outline" size={18} color={colors.accent} style={{ marginRight: 6 }} />
                <Headline style={{ fontSize: 16, color: colors.ink }}>
                  {title}
                </Headline>
              </View>
              <TouchableOpacity onPress={() => setVisible(false)}>
                <Ionicons name="close" size={18} color={colors.mutedInk} />
              </TouchableOpacity>
            </View>
            <BodyText style={{ fontSize: 13, color: colors.mutedInk, lineHeight: 19, marginBottom: 16 }}>
              {description}
            </BodyText>
            <TouchableOpacity
              onPress={() => setVisible(false)}
              style={{
                backgroundColor: colors.paperSecondary,
                paddingVertical: 9,
                borderRadius: tokens.radius.xs,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: 'center',
              }}
            >
              <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink }}>
                Got it
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}
