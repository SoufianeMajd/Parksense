import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { FontSize, Radius, Spacing } from '../constants/theme';
import { useColors } from '../context/ThemeContext';

interface Props { label?: string; color?: string; }

export const LiveChip: React.FC<Props> = ({ label = 'LIVE', color }) => {
  const Colors  = useColors();
  const tint    = color ?? Colors.red;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(opacity, { toValue: 0.2, duration: 700, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1,   duration: 700, useNativeDriver: true }),
    ])).start();
  }, [opacity]);

  return (
    <View style={[s.chip, { backgroundColor: tint + '26', borderColor: tint + '44' }]}>
      <Animated.View style={[s.dot, { backgroundColor: tint, opacity }]} />
      <Text style={[s.lbl, { color: tint }]}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
          paddingHorizontal: Spacing.sm + 2, paddingVertical: 3,
          borderRadius: Radius.full, borderWidth: 1 },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  lbl:  { fontSize: FontSize.sm, fontWeight: '600' },
});
