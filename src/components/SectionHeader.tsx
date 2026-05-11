import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontSize, Spacing, ThemeColors } from '../constants/theme';
import { useThemedStyles } from '../context/ThemeContext';

interface Props { title: string; actionLabel?: string; onAction?: () => void; }

export const SectionHeader: React.FC<Props> = ({ title, actionLabel, onAction }) => {
  const s = useThemedStyles(makeStyles);
  return (
    <View style={s.row}>
      <Text style={s.title}>{title.toUpperCase()}</Text>
      {actionLabel && (
        <TouchableOpacity onPress={onAction}>
          <Text style={s.action}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  row:    { flexDirection: 'row', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: Spacing.sm },
  title:  { color: Colors.text2, fontSize: FontSize.sm,
            fontWeight: '600', letterSpacing: 0.5 },
  action: { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '500' },
});
