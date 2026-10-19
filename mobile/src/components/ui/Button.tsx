import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
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
  const py = size === 'sm' ? 8 : size === 'lg' ? 14 : 11;
  const px = size === 'sm' ? 14 : size === 'lg' ? 24 : 18;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 16 : 14;
  const iconSize = size === 'sm' ? 16 : 18;
  const bg = variantBg[variant];
  const textColor = variantText[variant];
  const borderColor = variantBorder[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: bg,
        paddingVertical: py,
        paddingHorizontal: px,
        minHeight: size === 'sm' ? 36 : size === 'lg' ? 48 : 42,
        borderRadius: tokens.radii.md,
        opacity: isDisabled ? 0.5 : 1,
        borderWidth: borderColor !== 'transparent' ? 1 : 0,
        borderColor: borderColor,
        width: fullWidth ? '100%' : undefined,
      }}
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
          <Text style={{ color: textColor, fontSize, fontFamily: fonts.sansMedium }}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginLeft: 8 }} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
