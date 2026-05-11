import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';

export type BadgeVariant = 'green' | 'red' | 'amber' | 'blue' | 'accent';

const variantMap = (Colors: ThemeColors): Record<BadgeVariant, { bg: string; color: string }> => ({
  green:  { bg: Colors.greenDim,  color: Colors.green  },
  red:    { bg: Colors.redDim,    color: Colors.red    },
  amber:  { bg: Colors.amberDim,  color: Colors.amber  },
  blue:   { bg: Colors.blueDim,   color: Colors.blue   },
  accent: { bg: Colors.accentDim, color: Colors.accent },
});

interface Props { label: string; variant: BadgeVariant; showDot?: boolean; }

export const Badge: React.FC<Props> = ({ label, variant, showDot = true }) => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  const V = useMemo(() => variantMap(Colors), [Colors]);
  const v = V[variant];
  return (
    <View style={[s.wrap, { backgroundColor: v.bg }]}>
      {showDot && <View style={[s.dot, { backgroundColor: v.color }]} />}
      <Text style={[s.txt, { color: v.color }]}>{label}</Text>
    </View>
  );
};

const makeStyles = (_Colors: ThemeColors) => StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs,
          paddingHorizontal: Spacing.sm, paddingVertical: 3,
          borderRadius: Radius.full },
  dot:  { width: 6, height: 6, borderRadius: 3 },
  txt:  { fontSize: FontSize.sm, fontWeight: '500' },
});
