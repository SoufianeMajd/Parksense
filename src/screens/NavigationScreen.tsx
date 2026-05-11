import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  ScrollView, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { RootStackParamList, NavStep } from '../types';
import { useApp } from '../context/AppContext';
import { LiveChip } from '../components/LiveChip';

type Route = RouteProp<RootStackParamList, 'NavigationScreen'>;

export const NavigationScreen: React.FC = () => {
  const Colors        = useColors();
  const s             = useThemedStyles(makeStyles);
  const route         = useRoute<Route>();
  const navigation    = useNavigation();
  const { navSession, clearNavigation } = useApp();
  const lot           = route.params.lot;
  const [eta, setEta] = useState(navSession?.etaMinutes ?? 6);

  // Simulate ETA counting down every 30 s
  useEffect(() => {
    const id = setInterval(() => setEta(e => Math.max(0, e - 1)), 30_000);
    return () => clearInterval(id);
  }, []);

  if (!navSession) return null;

  const dotStyle = (status: NavStep['status']) => ({
    backgroundColor:
      status === 'completed' ? Colors.green :
      status === 'active'    ? Colors.blue  : Colors.surface2,
    borderWidth:  status === 'upcoming' ? 2 : 0,
    borderColor:  Colors.border2,
  });

  const stepColor = (status: NavStep['status'], isLast: boolean): string => {
    if (isLast)                   return Colors.green;
    if (status === 'active')      return Colors.blue;
    if (status === 'upcoming')    return Colors.text3;
    return Colors.text2;
  };

  const handleCancel = () => {
    clearNavigation();
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Turn instruction banner ──────────────────────────── */}
      <View style={s.instructionCard}>
        <View style={s.turnIcon}>
          <Text style={s.turnIconTxt}>↗</Text>
        </View>
        <View style={s.turnText}>
          <Text style={s.turnMain}>{navSession.currentInstruction}</Text>
          <Text style={s.turnSub}>{navSession.currentDetail}</Text>
        </View>
        <LiveChip label="Navigating" color={Colors.blue} />
      </View>

      {/* ── ETA strip ───────────────────────────────────────── */}
      <View style={s.etaStrip}>
        {[
          { val: String(eta),                    unit: 'min ETA',    color: Colors.accent },
          { val: String(navSession.distanceKm),  unit: 'km left',    color: Colors.text   },
          { val: navSession.arrivalTime,          unit: 'Arrival',    color: Colors.text   },
          { val: 'B7',                            unit: 'Spot ahead', color: Colors.green  },
        ].map((item, i) => (
          <View key={i} style={s.etaItem}>
            <Text style={[s.etaVal, { color: item.color }]}>{item.val}</Text>
            <Text style={s.etaUnit}>{item.unit}</Text>
          </View>
        ))}
      </View>

      {/* ── Step-by-step route ──────────────────────────────── */}
      <ScrollView style={s.scroll} contentContainerStyle={s.scrollContent}>
        <Text style={s.stepsTitle}>ROUTE STEPS</Text>

        {navSession.steps.map((step, i) => {
          const isLast = i === navSession.steps.length - 1;
          return (
            <View key={step.id} style={s.stepRow}>
              {/* Timeline spine */}
              <View style={s.stepLeft}>
                <View style={[s.stepDot, dotStyle(step.status)]} />
                {!isLast && <View style={s.stepLine} />}
              </View>

              {/* Step content */}
              <View style={s.stepContent}>
                <Text style={[s.stepInst, { color: stepColor(step.status, isLast) }]}>
                  {isLast ? `🅿  ${step.instruction}` : step.instruction}
                </Text>
                <Text style={s.stepDetail}>{step.detail}</Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* ── Destination summary card ─────────────────────────── */}
      <View style={s.destCard}>
        <Text style={s.destLabel}>Destination</Text>
        <Text style={s.destName}>{lot.name}</Text>
        <Text style={s.destAddr}>{lot.address}</Text>
      </View>

      {/* ── Cancel button ────────────────────────────────────── */}
      <TouchableOpacity style={s.cancelBtn} onPress={handleCancel} activeOpacity={0.75}>
        <Text style={s.cancelTxt}>✕  Cancel Navigation</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:          { flex: 1, backgroundColor: Colors.bg },

  instructionCard:{
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.bg2, margin: Spacing.lg,
    borderRadius: Radius.sm, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border2,
  },
  turnIcon:      {
    width: 40, height: 40, backgroundColor: Colors.blueDim,
    borderRadius: Radius.xs, alignItems: 'center', justifyContent: 'center',
  },
  turnIconTxt:   { fontSize: FontSize.h3, color: Colors.blue },
  turnText:      { flex: 1 },
  turnMain:      { color: Colors.text,  fontSize: FontSize.md, fontWeight: '600' },
  turnSub:       { color: Colors.text2, fontSize: FontSize.sm, marginTop: 2 },

  etaStrip:      {
    flexDirection: 'row', justifyContent: 'space-around',
    backgroundColor: Colors.bg2, paddingVertical: Spacing.md,
    borderTopWidth: 1, borderBottomWidth: 1, borderColor: Colors.border,
  },
  etaItem:       { alignItems: 'center' },
  etaVal:        { fontSize: FontSize.h2, fontWeight: '700' },
  etaUnit:       { color: Colors.text3, fontSize: FontSize.xs, marginTop: 2 },

  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing.lg },
  stepsTitle:    {
    color: Colors.text3, fontSize: FontSize.sm, fontWeight: '600',
    letterSpacing: 0.5, marginBottom: Spacing.md,
  },
  stepRow:       { flexDirection: 'row', gap: Spacing.md },
  stepLeft:      { alignItems: 'center', width: 16 },
  stepDot:       { width: 16, height: 16, borderRadius: 8, flexShrink: 0 },
  stepLine:      { flex: 1, width: 2, backgroundColor: Colors.border, marginTop: 2 },
  stepContent:   { flex: 1, paddingBottom: Spacing.lg },
  stepInst:      { fontSize: FontSize.base, fontWeight: '600' },
  stepDetail:    { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },

  destCard:      {
    margin: Spacing.lg, marginTop: 0, padding: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  destLabel:     { color: Colors.text3, fontSize: FontSize.sm },
  destName:      { color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600', marginTop: 2 },
  destAddr:      { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },

  cancelBtn:     {
    margin: Spacing.lg, marginTop: 0, paddingVertical: Spacing.md,
    borderRadius: Radius.sm, borderWidth: 1,
    borderColor: Colors.redDim, alignItems: 'center',
  },
  cancelTxt:     { color: Colors.red, fontSize: FontSize.md, fontWeight: '600' },
});
