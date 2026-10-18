import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: 16 }}>
      {label && (
        <Text style={{ fontSize: 14, fontWeight: '500', color: '#334155', marginBottom: 6 }}>
          {label}
        </Text>
      )}
      <TextInput
        accessibilityLabel={props.accessibilityLabel || label}
        placeholderTextColor="#94a3b8"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          backgroundColor: '#fff',
          borderWidth: 1.5,
          borderColor: error ? '#ef4444' : focused ? '#4f46e5' : '#e2e8f0',
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
          fontSize: 15,
          color: '#0f172a',
        }}
        {...props}
      />
      {error && <Text style={{ fontSize: 13, color: '#ef4444', marginTop: 4 }}>{error}</Text>}
      {helper && !error && (
        <Text style={{ fontSize: 13, color: '#94a3b8', marginTop: 4 }}>{helper}</Text>
      )}
    </View>
  );
}
