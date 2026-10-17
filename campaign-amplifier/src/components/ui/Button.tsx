import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
  primary: '#4f46e5',
  secondary: '#f1f5f9',
  outline: 'transparent',
  ghost: 'transparent',
  danger: '#ef4444',
};

const variantText: Record<string, string> = {
  primary: '#ffffff',
  secondary: '#0f172a',
  outline: '#4f46e5',
  ghost: '#334155',
  danger: '#ffffff',
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
  const py = size === 'sm' ? 8 : size === 'lg' ? 18 : 14;
  const px = size === 'sm' ? 14 : size === 'lg' ? 28 : 22;
  const fontSize = size === 'sm' ? 13 : size === 'lg' ? 17 : 15;
  const iconSize = size === 'sm' ? 16 : 20;
  const bg = variantBg[variant];
  const textColor = variantText[variant];

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
        borderRadius: 14,
        opacity: isDisabled ? 0.5 : 1,
        borderWidth: variant === 'outline' ? 1.5 : 0,
        borderColor: variant === 'outline' ? '#4f46e5' : 'transparent',
        width: fullWidth ? '100%' : undefined,
      }}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginRight: 8 }} />
          )}
          <Text style={{ color: textColor, fontSize, fontWeight: '600' }}>{title}</Text>
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={iconSize} color={textColor} style={{ marginLeft: 8 }} />
          )}
        </>
      )}
    </TouchableOpacity>
  );
}
