import React from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, tokens } from '../../theme/tokens';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
}

const variantBg: Record<string, string> = {
  primary: colors.accent,
  secondary: colors.surfaceSecondary,
  outline: 'transparent',
  ghost: 'transparent',
  danger: colors.danger,
};

const variantText: Record<string, string> = {
  primary: colors.inkInverse,
  secondary: colors.ink,
  outline: colors.accent,
  ghost: colors.inkSecondary,
  danger: colors.inkInverse,
};

const variantBorder: Record<string, string> = {
  primary: 'transparent',
  secondary: colors.border,
  outline: colors.border,
  ghost: 'transparent',
  danger: 'transparent',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary' || size === 'lg';

  // Primary buttons: 52px height, 12px border radius, font-weight 600, 16px label
  const minHeight = size === 'sm' ? 36 : isPrimary ? 52 : 44;
  const borderRadius = isPrimary ? 12 : tokens.radii.sm;
  const fontSize = isPrimary ? 16 : size === 'sm' ? 13 : 14;
  const iconSize = size === 'sm' ? 16 : 18;
  const bg = variantBg[variant];
  const textColor = variantText[variant];
  const borderColor = variantBorder[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        paddingHorizontal: size === 'sm' ? 14 : 20,
        height: minHeight,
        borderRadius,
        opacity: isDisabled ? 0.5 : 1,
        borderWidth: borderColor !== 'transparent' ? 1 : 0,
        borderColor: borderColor,
        width: fullWidth ? '100%' : undefined,
        transform: [{ scale: pressed && !isDisabled ? 0.98 : 1 }],
      })}
      accessibilityRole="button"
      accessibilityLabel={title}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: textColor, fontSize, fontFamily: fonts.sansSemiBold }}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginLeft: 8 }} />
          )}
        </>
      )}
    </Pressable>
  );
}
