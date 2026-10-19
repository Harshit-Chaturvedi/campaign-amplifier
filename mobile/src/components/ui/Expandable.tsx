import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';
import { colors, fonts, tokens } from '../../theme/tokens';
import { SmallCapsLabel } from './Typography';

interface ExpandableProps {
  title: string;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  badgeText?: string;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export function Expandable({
  title,
  icon,
  iconColor = colors.accent,
  badgeText,
  defaultExpanded = false,
  children,
  style,
}: ExpandableProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card style={[{ marginTop: tokens.spacing.sm, padding: tokens.spacing.md }, style]}>
      <TouchableOpacity
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: 8 }}>
          {icon && (
            <Ionicons
              name={icon}
              size={18}
              color={iconColor}
              style={{ marginRight: 8 }}
            />
          )}
          <Text style={{ fontSize: 14, fontFamily: fonts.sansSemiBold, color: colors.ink, flex: 1 }}>
            {title}
          </Text>
          {badgeText && (
            <View
              style={{
                backgroundColor: colors.paperSecondary,
                paddingHorizontal: 6,
                paddingVertical: 2,
                borderRadius: tokens.radius.xs,
                borderWidth: 1,
                borderColor: colors.hairline,
                marginRight: 6,
              }}
            >
              <SmallCapsLabel style={{ fontSize: 9, color: colors.accent }}>
                {badgeText}
              </SmallCapsLabel>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.mutedInk}
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.hairline,
          }}
        >
          {children}
        </View>
      )}
    </Card>
  );
}
