import React from 'react';
import { View, Text, Modal, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tokens } from '../../theme/tokens';
import { Headline, MetaLabel } from './Typography';

interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: number;
}

const { height: SCREEN_H } = Dimensions.get('window');

export function BottomSheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = SCREEN_H * 0.75,
}: BottomSheetProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View
        style={{
          flex: 1,
          backgroundColor: 'rgba(22, 19, 15, 0.5)',
          justifyContent: 'flex-end',
        }}
      >
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: tokens.radius.md,
            borderTopRightRadius: tokens.radius.md,
            borderTopWidth: 1,
            borderLeftWidth: 1,
            borderRightWidth: 1,
            borderColor: colors.hairline,
            paddingTop: 12,
            paddingHorizontal: tokens.spacing.lg,
            paddingBottom: 32,
            maxHeight,
          }}
        >
          {/* Grab handle */}
          <View
            style={{
              width: 36,
              height: 3,
              borderRadius: 1.5,
              backgroundColor: colors.hairline,
              alignSelf: 'center',
              marginBottom: 14,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: subtitle ? 4 : 14,
            }}
          >
            <Headline style={{ fontSize: 18, color: colors.ink }}>
              {title}
            </Headline>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              style={{
                width: 30,
                height: 30,
                borderRadius: tokens.radius.xs,
                backgroundColor: colors.paperSecondary,
                borderWidth: 1,
                borderColor: colors.hairline,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={16} color={colors.ink} />
            </TouchableOpacity>
          </View>

          {subtitle && (
            <MetaLabel style={{ marginBottom: 14 }}>
              {subtitle}
            </MetaLabel>
          )}

          <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
