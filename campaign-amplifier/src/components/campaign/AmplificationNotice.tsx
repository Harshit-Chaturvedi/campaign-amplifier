import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface AmplificationNoticeProps {
  compact?: boolean;
}

export function AmplificationNotice({ compact = false }: AmplificationNoticeProps) {
  return (
    <View
      style={{
        backgroundColor: '#eef2ff',
        borderRadius: 14,
        padding: compact ? 12 : 14,
        borderWidth: 1,
        borderColor: '#c7d2fe',
        flexDirection: 'row',
        alignItems: 'flex-start',
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          backgroundColor: '#4f46e5',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
          marginTop: 1,
        }}
      >
        <Ionicons name="megaphone" size={13} color="#ffffff" />
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: compact ? 12 : 13,
            fontWeight: '700',
            color: '#312e81',
            marginBottom: 2,
          }}
        >
          Message amplification, not a donation
        </Text>
        <Text
          style={{
            fontSize: compact ? 12 : 13,
            color: '#3730a3',
            lineHeight: compact ? 17 : 19,
          }}
        >
          Your contribution pays for advertising that spreads this message. It is not a donation to the cause, person, or organisation.
        </Text>
      </View>
    </View>
  );
}
