import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';

interface Props { value: string | number; label: string; valueColor?: string; }

export const StatCard: React.FC<Props> = ({ value, label, valueColor }) => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.card}>
      <Text style={[s.val, { color: valueColor ?? Colors.text }]}>{value}</Text>
      <Text style={s.lbl}>{label}</Text>
    </View>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  card: { flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.sm,
          padding: Spacing.md, alignItems: 'center',
          borderWidth: 1, borderColor: Colors.border },
  val:  { fontSize: FontSize.h2, fontWeight: '700' },
  lbl:  { color: Colors.text3, fontSize: FontSize.xs, marginTop: 2, textAlign: 'center' },
});
