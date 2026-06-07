import React, { useMemo, useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useApp }        from '../context/AppContext';
import { LiveChip }      from '../components/LiveChip';
import { SectionHeader } from '../components/SectionHeader';
import { fetchPendingParkingLots, updateParkingLotApproval } from '../services/parkingService';
import { ParkingLot } from '../types';

// Static peak-hour data for chart
const PEAK_HOURS = [
  { h: '6a',  p: 30 },
  { h: '7a',  p: 55 },
  { h: '8a',  p: 92 },
  { h: '9a',  p: 80 },
  { h: '10a', p: 60 },
  { h: '11a', p: 70 },
  { h: '12p', p: 85 },
  { h: '1p',  p: 75 },
  { h: '2p',  p: 55 },
  { h: 'now', p: 40, current: true },
];

export const AdminScreen: React.FC = () => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  const { lots, refreshLots } = useApp();

  const [pendingLots, setPendingLots] = useState<ParkingLot[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  const loadPendingLots = async () => {
    setPendingLoading(true);
    const data = await fetchPendingParkingLots();
    setPendingLots(data);
    setPendingLoading(false);
  };

  useEffect(() => {
    loadPendingLots();
  }, []);

  const handleApprove = async (lotId: string, lotName: string) => {
    Alert.alert(
      'Approuver',
      `Approuver "${lotName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            const { error } = await updateParkingLotApproval(lotId, true);
            if (error) {
              Alert.alert('Erreur', error.message);
            } else {
              Alert.alert('Succès', `${lotName} a été approuvé.`);
              loadPendingLots();
              refreshLots();
            }
          },
        },
      ],
    );
  };

  const handleReject = async (lotId: string, lotName: string) => {
    Alert.alert(
      'Rejeter',
      `Rejeter "${lotName}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejeter',
          style: 'destructive',
          onPress: async () => {
            const { error } = await updateParkingLotApproval(lotId, false);
            if (error) {
              Alert.alert('Erreur', error.message);
            } else {
              Alert.alert('Rejeté', `${lotName} a été rejeté.`);
              loadPendingLots();
              refreshLots();
            }
          },
        },
      ],
    );
  };

  // Derive live occupancy from context
  const totalFree  = lots.reduce((n, l) => n + l.freeSpots,  0);
  const totalSpots = lots.reduce((n, l) => n + l.totalSpots, 0);
  const occupancy  = totalSpots > 0
    ? Math.round(((totalSpots - totalFree) / totalSpots) * 100)
    : 0;

  const METRICS = useMemo(() => [
    { val: `${occupancy}%`, label: 'Occupancy',  color: Colors.green,  change: '↑ +4% vs yesterday', up: true  },
    { val: '1,284',         label: 'Sessions',   color: Colors.text,   change: '↑ +12% vs avg',      up: true  },
    { val: '42k DH',        label: 'Revenue',    color: Colors.accent, change: '↑ +8% vs avg',        up: true  },
    { val: '2',             label: 'Alerts',     color: Colors.amber,  change: '↓ -1 resolved',       up: false },
  ], [Colors, occupancy]);

  const ALERTS = useMemo(() => [
    {
      dot:  Colors.red,
      text: 'Station UG — Lot Full (98%)',
      time: 'Since 8:42 AM · Redirecting to East Wing',
    },
    {
      dot:  Colors.amber,
      text: 'Sensor #C4-17 — Connectivity issue',
      time: 'Reported 9:10 AM · Maintenance notified',
    },
  ], [Colors]);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* ── Header ───────────────────────────────────────────── */}
        <View style={s.header}>
          <View>
            <Text style={s.title}>Admin Dashboard</Text>
            <Text style={s.subtitle}>CityPark Network · Live Overview</Text>
          </View>
          <LiveChip label="Live" />
        </View>

        {/* ── Metric cards ─────────────────────────────────────── */}
        <View style={s.metricsGrid}>
          {METRICS.map(m => (
            <View key={m.label} style={s.metricCard}>
              <Text style={[s.metricVal, { color: m.color }]}>{m.val}</Text>
              <Text style={s.metricLbl}>{m.label.toUpperCase()}</Text>
              <Text style={[s.metricChange, { color: m.up ? Colors.green : Colors.red }]}>
                {m.change}
              </Text>
            </View>
          ))}
        </View>

        <View style={s.body}>

          {/* ── Lot occupancy bars ────────────────────────────── */}
          <SectionHeader title="Lot Occupancy" />
          <View style={s.card}>
            {lots.map(lot => {
              const pct = Math.round(
                ((lot.totalSpots - lot.freeSpots) / lot.totalSpots) * 100,
              );
              const col =
                pct >= 90 ? Colors.red :
                pct >= 60 ? Colors.amber : Colors.green;
              const shortName = lot.name.split(' ').slice(0, 2).join(' ');

              return (
                <View key={lot.id} style={s.lotRow}>
                  <Text style={s.lotName} numberOfLines={1}>{shortName}</Text>
                  <View style={s.lotTrack}>
                    <View
                      style={[
                        s.lotFill,
                        { width: `${pct}%` as any, backgroundColor: col },
                      ]}
                    />
                  </View>
                  <Text style={[s.lotPct, { color: col }]}>{pct}%</Text>
                </View>
              );
            })}
          </View>

          {/* ── Peak hours bar chart ──────────────────────────── */}
          <SectionHeader title="Peak Hours — Today" />
          <View style={s.card}>
            <View style={s.barChart}>
              {PEAK_HOURS.map(h => (
                <View key={h.h} style={s.barCol}>
                  <View style={s.barTrack}>
                    <View
                      style={[
                        s.barFill,
                        {
                          height: `${h.p}%` as any,
                          backgroundColor: (h as any).current
                            ? Colors.accent + '80'
                            : Colors.accent,
                        },
                      ]}
                    />
                  </View>
                  <Text style={s.barLbl}>{h.h}</Text>
                </View>
              ))}
            </View>
            <View style={s.chartMeta}>
              <Text style={s.chartMetaTxt}>Peak: 8AM–9AM</Text>
              <Text style={s.chartMetaTxt}>Avg wait: 3 min</Text>
            </View>
          </View>

          {/* ── Active alerts ─────────────────────────────────── */}
          <SectionHeader title="Active Alerts" />
          <View style={s.card}>
            {ALERTS.map((a, i) => (
              <View
                key={i}
                style={[s.alertRow, i === ALERTS.length - 1 && { borderBottomWidth: 0 }]}
              >
                <View style={[s.alertDot, { backgroundColor: a.dot }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.alertTxt}>{a.text}</Text>
                  <Text style={s.alertTime}>{a.time}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* ── Pending company parkings ─────────────────────── */}
          <SectionHeader title="Demandes de parkings (entreprises)" />
          {pendingLoading ? (
            <ActivityIndicator size="small" color={Colors.accent} style={{ marginBottom: Spacing.lg }} />
          ) : pendingLots.length === 0 ? (
            <View style={[s.card, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
              <Text style={{ color: Colors.text3, fontSize: FontSize.md }}>Aucune demande en attente</Text>
            </View>
          ) : (
            pendingLots.map(lot => (
              <View key={lot.id} style={s.card}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: Colors.text, fontSize: FontSize.lg, fontWeight: '600' }}>{lot.name}</Text>
                    <Text style={{ color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 }}>{lot.address}</Text>
                    <View style={{ flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm }}>
                      <Text style={{ color: Colors.text2, fontSize: FontSize.sm }}>🅿️ {lot.totalSpots} places</Text>
                      <Text style={{ color: Colors.text2, fontSize: FontSize.sm }}>💰 {lot.pricePerHour} DH/h</Text>
                    </View>
                    {lot.phone ? (
                      <Text style={{ color: Colors.text2, fontSize: FontSize.sm, marginTop: 2 }}>📞 {lot.phone}</Text>
                    ) : null}
                    {lot.description ? (
                      <Text style={{ color: Colors.text3, fontSize: FontSize.xs, marginTop: Spacing.xs }}>{lot.description}</Text>
                    ) : null}
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
                  <TouchableOpacity
                    style={{
                      flex: 1, height: 40, backgroundColor: Colors.green, borderRadius: Radius.sm,
                      justifyContent: 'center', alignItems: 'center',
                    }}
                    onPress={() => handleApprove(lot.id, lot.name)}
                  >
                    <Text style={{ color: '#fff', fontSize: FontSize.md, fontWeight: '700' }}>Approuver</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flex: 1, height: 40, backgroundColor: Colors.red, borderRadius: Radius.sm,
                      justifyContent: 'center', alignItems: 'center',
                    }}
                    onPress={() => handleReject(lot.id, lot.name)}
                  >
                    <Text style={{ color: '#fff', fontSize: FontSize.md, fontWeight: '700' }}>Rejeter</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}

          {/* ── Quick actions ─────────────────────────────────── */}
          <SectionHeader title="Quick Actions" />
          <View style={s.actionsGrid}>
            {[
              { icon: '📋', label: 'Export Report' },
              { icon: '🔧', label: 'Sensor Config' },
              { icon: '💰', label: 'Set Pricing'   },
              { icon: '📡', label: 'Live Monitor', primary: true },
            ].map(a => (
              <View
                key={a.label}
                style={[s.actionBtn, (a as any).primary && s.actionBtnPrimary]}
              >
                <Text style={s.actionIcon}>{a.icon}</Text>
                <Text style={[s.actionLbl, (a as any).primary && { color: '#fff' }]}>
                  {a.label}
                </Text>
              </View>
            ))}
          </View>

        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },

  header:       {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    padding: Spacing.lg,
    backgroundColor: Colors.accentDim,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  title:        { color: Colors.text,  fontSize: FontSize.h3, fontWeight: '700' },
  subtitle:     { color: Colors.text2, fontSize: FontSize.sm, marginTop: 2 },

  metricsGrid:  {
    flexDirection: 'row', flexWrap: 'wrap',
    gap: Spacing.sm, padding: Spacing.lg, paddingBottom: 0,
  },
  metricCard:   {
    width: '47%', backgroundColor: Colors.surface,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md,
  },
  metricVal:    { fontSize: FontSize.display, fontWeight: '700' },
  metricLbl:    { color: Colors.text3, fontSize: FontSize.xs, letterSpacing: 0.5, marginTop: 2 },
  metricChange: { fontSize: FontSize.sm, marginTop: Spacing.xs },

  body:         { padding: Spacing.lg },

  card:         {
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },

  // Lot occupancy rows
  lotRow:       {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 5,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  lotName:      { color: Colors.text, fontSize: FontSize.base, fontWeight: '500', width: 90 },
  lotTrack:     { flex: 1, height: 6, backgroundColor: Colors.surface2, borderRadius: 3, overflow: 'hidden' },
  lotFill:      { height: '100%', borderRadius: 3 },
  lotPct:       { fontSize: FontSize.sm, fontWeight: '600', width: 34, textAlign: 'right' },

  // Bar chart
  barChart:     {
    flexDirection: 'row', alignItems: 'flex-end',
    height: 80, gap: 3, marginBottom: Spacing.sm,
  },
  barCol:       { flex: 1, alignItems: 'center' },
  barTrack:     { flex: 1, width: '100%', justifyContent: 'flex-end' },
  barFill:      { width: '100%', borderRadius: 2 },
  barLbl:       { color: Colors.text3, fontSize: 8, marginTop: 3 },
  chartMeta:    { flexDirection: 'row', justifyContent: 'space-between' },
  chartMetaTxt: { color: Colors.text3, fontSize: FontSize.xs },

  // Alerts
  alertRow:     {
    flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  alertDot:     { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  alertTxt:     { color: Colors.text, fontSize: FontSize.base, fontWeight: '500' },
  alertTime:    { color: Colors.text3, fontSize: FontSize.xs, marginTop: 2 },

  // Quick actions
  actionsGrid:  {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  actionBtn:    {
    width: '47%',
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    paddingVertical: Spacing.md, alignItems: 'center', gap: Spacing.xs,
  },
  actionBtnPrimary: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  actionIcon:   { fontSize: 20 },
  actionLbl:    { color: Colors.text, fontSize: FontSize.base, fontWeight: '500' },
});
