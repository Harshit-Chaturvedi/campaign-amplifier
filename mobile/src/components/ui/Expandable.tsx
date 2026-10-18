import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';

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
  iconColor = '#4f46e5',
  badgeText,
  defaultExpanded = false,
  children,
  style,
}: ExpandableProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card style={[{ marginTop: 12, padding: 16 }, style]}>
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
              size={20}
              color={iconColor}
              style={{ marginRight: 10 }}
            />
          )}
          <Text style={{ fontSize: 15, fontWeight: '700', color: '#0f172a', flex: 1 }}>
            {title}
          </Text>
          {badgeText && (
            <View
              style={{
                backgroundColor: '#eef2ff',
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
                marginRight: 6,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#4f46e5' }}>
                {badgeText}
              </Text>
            </View>
          )}
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color="#64748b"
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: '#f1f5f9',
          }}
        >
          {children}
        </View>
      )}
    </Card>
  );
}
