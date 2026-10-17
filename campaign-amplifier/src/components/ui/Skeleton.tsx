import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleProp, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const opacityAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.8,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.3,
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
          backgroundColor: '#cbd5e1',
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
      style={{
        backgroundColor: '#fff',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        overflow: 'hidden',
        marginBottom: 16,
        padding: 16,
      }}
    >
      <Skeleton height={140} borderRadius={12} style={{ marginBottom: 14 }} />
      <Skeleton height={18} width="70%" style={{ marginBottom: 8 }} />
      <Skeleton height={14} width="90%" style={{ marginBottom: 6 }} />
      <Skeleton height={12} width="40%" style={{ marginBottom: 16 }} />
      <Skeleton height={6} borderRadius={3} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 }}>
        <Skeleton height={14} width="35%" />
        <Skeleton height={14} width="30%" />
      </View>
      <Skeleton height={42} borderRadius={12} />
    </View>
  );
}
