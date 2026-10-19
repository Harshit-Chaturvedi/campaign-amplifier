import React, { useState } from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors, fonts, tokens } from '../../theme/tokens';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
}

export function Input({ label, error, helper, ...props }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: tokens.spacing.md }}>
      {label && (
        <Text style={{ fontSize: 13, fontFamily: fonts.sansSemiBold, color: colors.ink, marginBottom: 5 }}>
          {label}
        </Text>
      )}
      <TextInput
        accessibilityLabel={props.accessibilityLabel || label}
        placeholderTextColor={colors.secondaryCaption}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={[
          {
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: error ? colors.danger : focused ? colors.accent : colors.hairline,
            borderRadius: tokens.radius.sm,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 15,
            fontFamily: fonts.sansRegular,
            color: colors.ink,
          },
          props.style,
        ]}
        {...props}
      />
      {error && <Text style={{ fontSize: 12, fontFamily: fonts.sansMedium, color: colors.danger, marginTop: 4 }}>{error}</Text>}
      {helper && !error && (
        <Text style={{ fontSize: 12, fontFamily: fonts.sansRegular, color: colors.mutedInk, marginTop: 4 }}>{helper}</Text>
      )}
    </View>
  );
}
