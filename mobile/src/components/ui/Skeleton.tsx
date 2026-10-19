import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleProp, ViewStyle, DimensionValue } from 'react-native';
import { colors, tokens } from '../../theme/tokens';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = tokens.radii.xs,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.75,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.35,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacityAnim]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surfaceMuted,
          opacity: opacityAnim,
        },
        style,
      ]}
    />
  );
}

export function CampaignCardSkeleton() {
  return (
    <View
      style={[
        tokens.card,
        {
          overflow: 'hidden',
          marginBottom: 16,
          padding: 16,
        },
      ]}
    >
      <Skeleton height={170} borderRadius={tokens.radii.sm} style={{ marginBottom: 14 }} />
      <Skeleton height={12} width="28%" style={{ marginBottom: 8 }} />
      <Skeleton height={20} width="85%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="95%" style={{ marginBottom: 12 }} />
      <Skeleton height={3} borderRadius={2} style={{ marginBottom: 14 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <Skeleton height={28} width="32%" />
        <Skeleton height={28} width="28%" />
        <Skeleton height={28} width="24%" />
      </View>
      <Skeleton height={40} borderRadius={tokens.radii.sm} />
    </View>
  );
}

export function CampaignDetailSkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 20 }}>
      <Skeleton height={200} borderRadius={tokens.radii.sm} style={{ marginBottom: 20 }} />
      <Skeleton height={12} width="30%" style={{ marginBottom: 10 }} />
      <Skeleton height={26} width="90%" style={{ marginBottom: 12 }} />
      <Skeleton height={16} width="75%" style={{ marginBottom: 20 }} />
      <View
        style={[
          tokens.card,
          {
            padding: 16,
            marginBottom: 20,
          },
        ]}
      >
        <Skeleton height={3} borderRadius={2} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton height={36} width="28%" />
          <Skeleton height={36} width="28%" />
          <Skeleton height={36} width="28%" />
        </View>
      </View>
      <Skeleton height={14} width="100%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="100%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="60%" style={{ marginBottom: 20 }} />
      <Skeleton height={48} borderRadius={tokens.radii.sm} />
    </View>
  );
}

export function ActivitySkeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 16 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <View
          key={i}
          style={[
            tokens.card,
            {
              padding: 14,
              marginBottom: 10,
              flexDirection: 'row',
              alignItems: 'center',
            },
          ]}
        >
          <Skeleton width={10} height={10} borderRadius={5} style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Skeleton height={16} width="80%" style={{ marginBottom: 6 }} />
            <Skeleton height={12} width="50%" />
          </View>
        </View>
      ))}
    </View>
  );
}
