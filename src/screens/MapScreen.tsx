import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { buildNavSession } from '../services/mockData';
import { LiveChip } from '../components/LiveChip';
import { SpotGrid  } from '../components/SpotGrid';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MapFilter = 'all' | 'nearest' | 'cheapest' | 'ev' | 'available';

const FILTERS: { key: MapFilter; label: string }[] = [
  { key: 'all',       label: 'All'       },
  { key: 'nearest',   label: 'Nearest'   },
  { key: 'cheapest',  label: 'Cheapest'  },
  { key: 'ev',        label: '⚡ EV'    },
  { key: 'available', label: 'Available' },
];

const pinColor = (Colors: ThemeColors, level: string) =>
  level === 'high' ? Colors.green : level === 'medium' ? Colors.amber : Colors.red;

export const MapScreen: React.FC = () => {
  const Colors                    = useColors();
  const s                         = useThemedStyles(makeStyles);
  const navigation                = useNavigation<Nav>();
  const { lots, startNavigation } = useApp();
  const [filter, setFilter]       = useState<MapFilter>('all');
  const [selected, setSelected]   = useState(lots[0] ?? null);
  const [showSpots, setShowSpots] = useState(false);

  const handleSelect = (lot: any) => {
    setSelected(lot);
    setShowSpots(false);
  };

  const filtered =
    filter === 'available' ? lots.filter(l => l.freeSpots > 0)
    : filter === 'ev'      ? lots.filter(l => l.floors.some(f => f.spots.some(sp => sp.status === 'ev')))
    : filter === 'nearest' ? [...lots].sort((a, b) => a.distanceKm   - b.distanceKm)
    : filter === 'cheapest'? [...lots].sort((a, b) => a.pricePerHour - b.pricePerHour)
    : lots;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>

        {/* Web fallback — interactive map is native-only */}
        <View style={s.mapFallback}>
          <Text style={s.fallbackTitle}>🗺️  Map view</Text>
          <Text style={s.fallbackSubtitle}>
            Interactive map is available on the mobile app.
          </Text>
          <ScrollView style={s.lotList} contentContainerStyle={s.lotListContent}>
            {filtered.map(lot => (
              <TouchableOpacity
                key={lot.id}
                style={[s.lotRow, selected?.id === lot.id && s.lotRowSelected]}
                onPress={() => handleSelect(lot)}
              >
                <View style={[s.dot, { backgroundColor: pinColor(Colors, lot.availabilityLevel) }]} />
                <View style={{ flex: 1 }}>
                  <Text style={s.lotName}>{lot.name}</Text>
                  <Text style={s.lotAddr}>{lot.address} · {lot.distanceKm} km</Text>
                </View>
                <Text style={s.lotFree}>
                  {lot.freeSpots === 0 ? 'Full' : `${lot.freeSpots} free`}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Header bar */}
        <View style={s.headerBar}>
          <Text style={s.headerTitle}>Maârif, Casablanca</Text>
          <LiveChip />
        </View>

        {/* Filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.filterScroll}
          contentContainerStyle={s.filterRow}
        >
          {FILTERS.map(f => (
            <TouchableOpacity
              key={f.key}
              style={[s.chip, filter === f.key && s.chipActive]}
              onPress={() => setFilter(f.key)}
            >
              <Text style={[s.chipTxt, filter === f.key && s.chipTxtActive]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Bottom sheet */}
        {selected && (() => {
          const liveSelected = lots.find(l => l.id === selected.id) || selected;
          return (
          <View style={s.sheet}>
            <View style={s.handle} />

            <View style={s.sheetTop}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={s.sheetName}>{liveSelected.name}</Text>
                <Text style={s.sheetAddr}>
                  {liveSelected.address} · {liveSelected.distanceKm} km away
                </Text>
              </View>
              <View style={s.sheetRight}>
                <Text style={s.price}>{liveSelected.pricePerHour} DH</Text>
                <Text style={s.priceUnit}>/hr</Text>
              </View>
            </View>

            {liveSelected.floors.length > 0 && (
              <View style={s.gridWrap}>
                {!showSpots ? (
                  <TouchableOpacity 
                    style={[s.detailBtn, { marginTop: Spacing.sm }]}
                    onPress={() => setShowSpots(true)}
                  >
                    <Text style={s.detailBtnTxt}>👁️ Voir les places</Text>
                  </TouchableOpacity>
                ) : (
                  <ScrollView style={{ maxHeight: 300 }}>
                    <TouchableOpacity 
                      style={{ marginBottom: Spacing.sm, alignItems: 'center' }}
                      onPress={() => setShowSpots(false)}
                    >
                      <Text style={{ color: Colors.accent, fontSize: FontSize.sm, fontWeight: '500' }}>
                        Masquer les places ↑
                      </Text>
                    </TouchableOpacity>
                    <SpotGrid
                      floor={liveSelected.floors[0]}
                      totalFree={liveSelected.freeSpots}
                      totalSpots={liveSelected.totalSpots}
                    />
                  </ScrollView>
                )}
              </View>
            )}

            <TouchableOpacity
              style={s.detailBtn}
              activeOpacity={0.75}
              onPress={() => {
                startNavigation(buildNavSession(liveSelected));
                navigation.navigate('NavigationScreen', { lot: liveSelected });
              }}
            >
              <Text style={s.detailBtnTxt}>ℹ️  View Details</Text>
            </TouchableOpacity>
          </View>
          );
        })()}
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.mapBg },
  container:   { flex: 1 },

  mapFallback: {
    flex: 1,
    backgroundColor: Colors.bg3,
    paddingTop: 110,
    paddingHorizontal: Spacing.md,
  },
  fallbackTitle: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '600',
    textAlign: 'center',
  },
  fallbackSubtitle: {
    color: Colors.text3, fontSize: FontSize.sm,
    textAlign: 'center', marginTop: 4, marginBottom: Spacing.md,
  },
  lotList:        { flex: 1 },
  lotListContent: { paddingBottom: 340, gap: Spacing.sm },
  lotRow:         {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg2, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    padding: Spacing.md, gap: Spacing.md,
  },
  lotRowSelected: { borderColor: Colors.accent },
  dot:            { width: 10, height: 10, borderRadius: 5 },
  lotName:        { color: Colors.text,  fontSize: FontSize.md, fontWeight: '500' },
  lotAddr:        { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },
  lotFree:        { color: Colors.text,  fontSize: FontSize.sm, fontWeight: '600' },

  headerBar:   {
    position: 'absolute', top: 52, left: 12, right: 12,
    backgroundColor: Colors.bg2, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  headerTitle: { color: Colors.text2, fontSize: FontSize.md, flex: 1 },

  filterScroll:{ position: 'absolute', bottom: 260, left: 0 },
  filterRow:   { gap: Spacing.sm, paddingHorizontal: Spacing.md },
  chip:        {
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    backgroundColor: Colors.bg2, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border2,
  },
  chipActive:  { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  chipTxt:     { color: Colors.text2, fontSize: FontSize.sm, fontWeight: '500' },
  chipTxtActive:{ color: Colors.accent },

  sheet:       {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md,
    padding: Spacing.lg, paddingTop: Spacing.sm,
  },
  handle:      {
    width: 36, height: 4, backgroundColor: Colors.border2,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetTop:    {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetName:   { color: Colors.text,  fontSize: FontSize.xl, fontWeight: '600' },
  sheetAddr:   { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },
  sheetRight:  { flexDirection: 'row', alignItems: 'flex-end' },
  price:       { color: Colors.green, fontSize: FontSize.xxl, fontWeight: '700' },
  priceUnit:   { color: Colors.text3, fontSize: FontSize.sm, marginBottom: 2 },
  gridWrap:    { marginBottom: Spacing.md },
  detailBtn:   {
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border2,
    paddingVertical: Spacing.sm + 2, alignItems: 'center',
  },
  detailBtnTxt:{ color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },
});
