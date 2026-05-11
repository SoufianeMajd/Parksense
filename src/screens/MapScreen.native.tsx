import React, { useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useTheme, useThemedStyles } from '../context/ThemeContext';
import { Coordinates, ParkingLot, RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { distanceKm, openDirections } from '../services/geo';
import { buildNavSession } from '../services/mockData';
import { LiveChip } from '../components/LiveChip';
import { SpotGrid  } from '../components/SpotGrid';

import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';

const MAPS_AVAILABLE = true;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DARK_MAP_STYLE = [
  { elementType: 'geometry',            stylers: [{ color: '#1a1e28' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#8b92a8' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0d0f14' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252a3a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d0f14' }] },
];

const NEAREST_COUNT = 5;

const pinColor = (Colors: ThemeColors, level: string) =>
  level === 'high' ? Colors.green : level === 'medium' ? Colors.amber : Colors.red;

interface RankedLot extends ParkingLot { computedKm: number; }

export const MapScreen: React.FC = () => {
  const Colors                  = useColors();
  const { mode }                = useTheme();
  const s                       = useThemedStyles(makeStyles);
  const navigation              = useNavigation<Nav>();
  const { lots, startNavigation } = useApp();
  const { coords: userCoords }  = useUserLocation();

  const [searchPoint, setSearchPoint] = useState<Coordinates | null>(null);
  const [selected, setSelected]       = useState<ParkingLot | null>(null);
  const [tracksView, setTracksView]   = useState(true);

  // Stop tracking view changes after first render — fixes Android bitmap clipping bug
  useEffect(() => {
    const t = setTimeout(() => setTracksView(false), 500);
    return () => clearTimeout(t);
  }, []);

  // Nearest N lots to the tapped point, with computed distance.
  const nearest = useMemo<RankedLot[]>(() => {
    if (!searchPoint) return [];
    return lots
      .map(l => ({ ...l, computedKm: distanceKm(searchPoint, l.coordinates) }))
      .sort((a, b) => a.computedKm - b.computedKm)
      .slice(0, NEAREST_COUNT);
  }, [lots, searchPoint]);

  const onMapPress = (e: any) => {
    const c = e?.nativeEvent?.coordinate;
    if (!c) return;
    setSearchPoint({ latitude: c.latitude, longitude: c.longitude });
    setSelected(null);
  };

  const onPinPress = (lot: ParkingLot) => setSelected(lot);

  const onPickFromList = (lot: RankedLot) => setSelected(lot);

  const onBack = () => setSelected(null);

  const onClearSearch = () => { setSearchPoint(null); setSelected(null); };

  // Distance to display for the selected lot (uses tap point if set, else live GPS).
  const selectedDistanceKm = selected
    ? Math.round(distanceKm(searchPoint ?? userCoords, selected.coordinates) * 10) / 10
    : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>

        {/* ── Map (or list fallback) ─────────────────────────── */}
        {MAPS_AVAILABLE ? (
          <MapView
            style={s.map}
            provider={PROVIDER_DEFAULT}
            customMapStyle={mode === 'dark' ? DARK_MAP_STYLE : []}
            initialRegion={{
              latitude:  userCoords.latitude,
              longitude: userCoords.longitude,
              latitudeDelta: 0.03,
              longitudeDelta: 0.03,
            }}
            onPress={onMapPress}
          >
            {/* User's live location */}
            <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={s.userDot} />
            </Marker>

            {/* Tapped place marker */}
            {searchPoint && (
              <Marker coordinate={searchPoint} anchor={{ x: 0.5, y: 0.5 }}>
                <View style={s.searchPin}>
                  <Text style={s.searchPinTxt}>📍</Text>
                </View>
              </Marker>
            )}

            {/* Parking pins — when a tap-search is active, only the nearest N
                are shown so the user focuses on the relevant ones. */}
            {(searchPoint ? nearest : lots).map(lot => {
              const pColor = pinColor(Colors, lot.availabilityLevel);
              const isSelected = selected?.id === lot.id;
              return (
                <Marker
                  key={lot.id}
                  coordinate={lot.coordinates}
                  anchor={{ x: 0.5, y: 0.5 }}
                  tracksViewChanges={lot.id === 'esp32-lot' ? true : tracksView}
                  onPress={() => onPinPress(lot)}
                >
                  {/* Flat marker — small borderRadius never clips on Android */}
                  <View style={[s.markerOuter, { borderColor: pColor }, isSelected && s.markerSelected]}>
                    <View style={[s.markerLeft, { backgroundColor: pColor }]}>
                      <Text style={s.markerP}>P</Text>
                    </View>
                    <Text style={[s.markerCount, { color: pColor }]}>{lot.freeSpots}</Text>
                  </View>
                </Marker>
              );
            })}
          </MapView>
        ) : (
          <View style={s.mapFallback}>
            <Text style={s.fallbackTitle}>🗺️  Map unavailable</Text>
            <Text style={s.fallbackSub}>Pick a parking from the list below.</Text>
            <ScrollView style={s.lotList} contentContainerStyle={s.lotListContent}>
              {lots.map(lot => (
                <TouchableOpacity
                  key={lot.id}
                  style={[s.lotRow, selected?.id === lot.id && s.lotRowSelected]}
                  onPress={() => onPinPress(lot)}
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
        )}

        {/* ── Header bar ─────────────────────────────────────── */}
        <View style={s.headerBar}>
          <Text style={s.headerTitle}>
            {searchPoint ? 'Searching near pin 📍' : 'Tap a place on the map'}
          </Text>
          <LiveChip />
        </View>

        {/* ── Bottom sheet: 3 modes (idle / list / detail) ───── */}
        <View style={s.sheet}>
          <View style={s.handle} />

          {selected ? (() => {
            const liveSelected = lots.find(l => l.id === selected.id) || selected;
            return liveSelected.id === 'esp32-lot' ? (
              <ESP32DetailMode
                lot={liveSelected}
                distanceKmShown={selectedDistanceKm}
                onBack={searchPoint ? onBack : undefined}
                onNavigate={() => openDirections(liveSelected.coordinates, liveSelected.name)}
                s={s}
                Colors={Colors}
              />
            ) : (
            <DetailMode
              lot={liveSelected}
              distanceKmShown={selectedDistanceKm}
              onBack={searchPoint ? onBack : undefined}
              onNavigate={() => openDirections(liveSelected.coordinates, liveSelected.name)}
              onViewSimulation={() => {
                startNavigation(buildNavSession(liveSelected));
                navigation.navigate('NavigationScreen', { lot: liveSelected });
              }}
              s={s}
              Colors={Colors}
            />
            );
          })() : searchPoint ? (
            <ListMode
              lots={nearest}
              onPick={onPickFromList}
              onClear={onClearSearch}
              s={s}
              Colors={Colors}
            />
          ) : (
            <IdleMode s={s} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

// ───── Mode components ──────────────────────────────────────────

const IdleMode = ({ s }: { s: any }) => (
  <View style={s.idle}>
    <Text style={s.idleIcon}>👆</Text>
    <Text style={s.idleTitle}>Tap any place on the map</Text>
    <Text style={s.idleSub}>
      We'll show you the {NEAREST_COUNT} closest parkings to that location.
    </Text>
  </View>
);

const ListMode = ({
  lots, onPick, onClear, s, Colors,
}: {
  lots: RankedLot[];
  onPick: (l: RankedLot) => void;
  onClear: () => void;
  s: any;
  Colors: ThemeColors;
}) => {
  const { isFavourite, toggleFavourite } = useApp();
  return (
    <View>
      <View style={s.listHdr}>
        <Text style={s.listTitle}>Nearest parkings</Text>
        <TouchableOpacity onPress={onClear}>
          <Text style={s.listClear}>Clear</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ maxHeight: 280 }}>
        {lots.map(lot => {
          const fav = isFavourite(lot.id);
          return (
            <TouchableOpacity
              key={lot.id}
              style={s.listRow}
              activeOpacity={0.75}
              onPress={() => onPick(lot)}
            >
              <View style={[s.dot, { backgroundColor: pinColor(Colors, lot.availabilityLevel) }]} />
              <View style={{ flex: 1 }}>
                <Text style={s.lotName}>{lot.name}</Text>
                <Text style={s.lotAddr} numberOfLines={1}>{lot.address}</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.lotKm}>{lot.computedKm.toFixed(1)} km</Text>
                <Text style={s.lotFree}>
                  {lot.freeSpots === 0 ? 'Full' : `${lot.freeSpots} free`}
                </Text>
              </View>
              <TouchableOpacity
                style={s.rowFavBtn}
                hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
                onPress={() => toggleFavourite(lot.id)}
                accessibilityRole="button"
                accessibilityLabel={fav ? 'Remove from favourites' : 'Add to favourites'}
              >
                <Text style={s.rowFavIcon}>{fav ? '❤️' : '🤍'}</Text>
              </TouchableOpacity>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const DetailMode = ({
  lot, distanceKmShown, onBack, onNavigate, onViewSimulation, s, Colors,
}: {
  lot: ParkingLot;
  distanceKmShown: number | null;
  onBack?: () => void;
  onNavigate: () => void;
  onViewSimulation: () => void;
  s: any;
  Colors: ThemeColors;
}) => {
  const { isFavourite, toggleFavourite } = useApp();
  const fav = isFavourite(lot.id);
  const evCount = lot.floors
    .flatMap(f => f.spots)
    .filter(sp => sp.status === 'ev').length;

  return (
    <View>
      {/* Title row */}
      <View style={s.sheetTop}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={{ marginBottom: 4 }}>
              <Text style={s.backLink}>← Back to nearest</Text>
            </TouchableOpacity>
          )}
          <Text style={s.sheetName}>{lot.name}</Text>
          <Text style={s.sheetAddr}>
            {lot.address}{distanceKmShown != null ? ` · ${distanceKmShown} km` : ''}
          </Text>
        </View>
        <View style={s.sheetRight}>
          <Text style={s.price}>{lot.pricePerHour} DH</Text>
          <Text style={s.priceUnit}>/hr</Text>
        </View>
      </View>

      {/* Quick info chips */}
      <View style={s.chipsRow}>
        <TouchableOpacity
          style={[s.infoChip, { backgroundColor: fav ? Colors.redDim : Colors.bg3, borderWidth: 1, borderColor: fav ? Colors.red : Colors.border2 }]}
          activeOpacity={0.75}
          onPress={() => toggleFavourite(lot.id)}
          accessibilityRole="button"
          accessibilityLabel={fav ? 'Remove from favourites' : 'Add to favourites'}
        >
          <Text style={[s.infoChipTxt, { color: fav ? Colors.red : Colors.text2 }]}>
            {fav ? '❤️ Favourite' : '🤍 Add to favourites'}
          </Text>
        </TouchableOpacity>
        <View style={[s.infoChip, { backgroundColor: Colors.greenDim }]}>
          <Text style={[s.infoChipTxt, { color: Colors.green }]}>
            {lot.freeSpots} / {lot.totalSpots} free
          </Text>
        </View>
        <View style={[s.infoChip, { backgroundColor: Colors.amberDim }]}>
          <Text style={[s.infoChipTxt, { color: Colors.amber }]}>⭐ {lot.rating}</Text>
        </View>
        {evCount > 0 && (
          <View style={[s.infoChip, { backgroundColor: Colors.blueDim }]}>
            <Text style={[s.infoChipTxt, { color: Colors.blue }]}>⚡ {evCount} EV</Text>
          </View>
        )}
        <View style={[s.infoChip, { backgroundColor: Colors.accentDim }]}>
          <Text style={[s.infoChipTxt, { color: Colors.accent }]}>
            {lot.floors.length} floor{lot.floors.length > 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Real-time spot grid (first floor) */}
      {lot.floors.length > 0 && (
        <View style={s.gridWrap}>
          <SpotGrid
            floor={lot.floors[0]}
            totalFree={lot.freeSpots}
            totalSpots={lot.totalSpots}
          />
        </View>
      )}

      {/* Action row */}
      <View style={s.actionsRow}>
        <TouchableOpacity
          style={[s.actionBtn, { borderColor: Colors.border2 }]}
          activeOpacity={0.75}
          onPress={onViewSimulation}
        >
          <Text style={[s.actionBtnTxt, { color: Colors.text }]}>ℹ️  Simulate route</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: Colors.green, borderColor: Colors.green }]}
          activeOpacity={0.85}
          onPress={onNavigate}
        >
          <Text style={[s.actionBtnTxt, { color: '#fff' }]}>🧭  Navigate</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const ESP32DetailMode = ({
  lot, distanceKmShown, onBack, onNavigate, s, Colors,
}: {
  lot: ParkingLot;
  distanceKmShown: number | null;
  onBack?: () => void;
  onNavigate: () => void;
  s: any;
  Colors: ThemeColors;
}) => {
  const { espSpotStatus } = useApp();
  const isFree = espSpotStatus === 'Libre';
  const color = isFree ? Colors.green : Colors.red;
  const statusText = isFree ? 'LIBRE' : 'COMPLET / OCCUPÉ';
  const subText = isFree ? '1 place disponible sur 6.' : 'Toutes les 6 places sont occupées.';

  return (
    <View style={s.espContainer}>
      <View style={s.sheetTop}>
        <View style={{ flex: 1, marginRight: Spacing.sm }}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={{ marginBottom: 4 }}>
              <Text style={s.backLink}>← Back to nearest</Text>
            </TouchableOpacity>
          )}
          <Text style={s.sheetName}>{lot.name}</Text>
          <Text style={s.sheetAddr}>
            {lot.address}{distanceKmShown != null ? ` · ${distanceKmShown} km` : ''}
          </Text>
        </View>
      </View>

      <View style={s.espCenter}>
        <View style={[s.espGaugeWrap, { borderColor: color }]}>
          <Text style={[s.espGaugeNumber, { color }]}>{isFree ? '1' : '0'}</Text>
        </View>
        <View style={[s.espStatusBadge, { backgroundColor: isFree ? Colors.greenDim : Colors.redDim }]}>
          <Text style={[s.espStatusTxt, { color }]}>{statusText}</Text>
        </View>
        <Text style={s.espSubText}>{subText}</Text>
      </View>

      <View style={s.espFooter}>
        <View style={s.espLiveBox}>
          <Text style={s.espLivePulse}>🔵 Live data by ParkSense (ESP32)</Text>
          <Text style={s.espTime}>Temps estimé: 3 min</Text>
        </View>

        <TouchableOpacity
          style={[s.actionBtn, { backgroundColor: isFree ? Colors.green : Colors.bg3, borderColor: isFree ? Colors.green : Colors.border2 }]}
          activeOpacity={isFree ? 0.85 : 1}
          disabled={!isFree}
          onPress={onNavigate}
        >
          <Text style={[s.actionBtnTxt, { color: isFree ? '#fff' : Colors.text3 }]}>
            {isFree ? '🧭 Naviguer vers le parking' : 'Parking Complet'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.mapBg },
  container:   { flex: 1 },
  map:         { flex: 1 },

  mapFallback: {
    flex: 1, backgroundColor: Colors.bg3,
    paddingTop: 110, paddingHorizontal: Spacing.md,
  },
  fallbackTitle: {
    color: Colors.text, fontSize: FontSize.xl, fontWeight: '600', textAlign: 'center',
  },
  fallbackSub: {
    color: Colors.text3, fontSize: FontSize.sm,
    textAlign: 'center', marginTop: 4, marginBottom: Spacing.md,
  },
  lotList:        { flex: 1 },
  lotListContent: { paddingBottom: 340, gap: Spacing.sm },
  lotRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg2, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    padding: Spacing.md, gap: Spacing.md,
  },
  lotRowSelected: { borderColor: Colors.accent },
  dot:     { width: 10, height: 10, borderRadius: 5 },
  lotName: { color: Colors.text,  fontSize: FontSize.md, fontWeight: '500' },
  lotAddr: { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },
  lotFree: { color: Colors.text,  fontSize: FontSize.sm, fontWeight: '600' },
  lotKm:   { color: Colors.text2, fontSize: FontSize.sm, fontWeight: '600' },

  userDot:     {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.blue, borderWidth: 3, borderColor: '#fff',
  },
  searchPin: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.accent, borderWidth: 2, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  searchPinTxt: { fontSize: 18 },

  /* ── Parking pin ── */
  pinWrap: {
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: {
    transform: [{ scale: 1.2 }],
  },
  /* ── Flat badge marker (guaranteed to render on Android) ── */
  markerOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111827',
    borderRadius: 8,
    borderWidth: 2.5,
    overflow: 'visible',
    elevation: 4,
  },
  markerSelected: {
    transform: [{ scale: 1.15 }],
  },
  markerLeft: {
    width: 32,
    height: 32,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  markerP: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
  },
  markerCount: {
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 6,
  },

  headerBar:   {
    position: 'absolute', top: 52, left: 12, right: 12,
    backgroundColor: Colors.bg2, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  headerTitle: { color: Colors.text2, fontSize: FontSize.md, flex: 1 },

  sheet:       {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md,
    padding: Spacing.lg, paddingTop: Spacing.sm,
    maxHeight: '70%',
  },
  handle:      {
    width: 36, height: 4, backgroundColor: Colors.border2,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },

  // Idle mode
  idle:        { alignItems: 'center', paddingVertical: Spacing.lg, gap: 6 },
  idleIcon:    { fontSize: 36 },
  idleTitle:   { color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600' },
  idleSub:     { color: Colors.text3, fontSize: FontSize.sm, textAlign: 'center' },

  // List mode
  listHdr:     {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.sm,
  },
  listTitle:   { color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600' },
  listClear:   { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '500' },
  listRow:     {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1, borderColor: Colors.border,
  },
  rowFavBtn:   { padding: 4, marginLeft: Spacing.xs },
  rowFavIcon:  { fontSize: 18 },

  // Detail mode
  sheetTop:    {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  backLink:    { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '500' },
  sheetName:   { color: Colors.text,  fontSize: FontSize.xl, fontWeight: '600' },
  sheetAddr:   { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },
  sheetRight:  { flexDirection: 'row', alignItems: 'flex-end' },
  price:       { color: Colors.green, fontSize: FontSize.xxl, fontWeight: '700' },
  priceUnit:   { color: Colors.text3, fontSize: FontSize.sm, marginBottom: 2 },

  chipsRow:    {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  infoChip:    {
    paddingHorizontal: Spacing.sm + 2, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  infoChipTxt: { fontSize: FontSize.sm, fontWeight: '600' },

  gridWrap:    { marginBottom: Spacing.md },

  actionsRow:  {
    flexDirection: 'row', gap: Spacing.sm,
  },
  actionBtn:   {
    flex: 1, borderRadius: Radius.sm, borderWidth: 1,
    paddingVertical: Spacing.sm + 4, alignItems: 'center',
  },
  actionBtnTxt:{ fontSize: FontSize.md, fontWeight: '600' },

  // ESP32 Mode
  espContainer: { gap: Spacing.md },
  espCenter: { alignItems: 'center', marginVertical: Spacing.md },
  espGaugeWrap: {
    width: 120, height: 120, borderRadius: 60,
    borderWidth: 8,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  espGaugeNumber: { fontSize: 48, fontWeight: '700' },
  espStatusBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, marginBottom: 8,
  },
  espStatusTxt: { fontSize: FontSize.md, fontWeight: '700', letterSpacing: 1 },
  espSubText: { color: Colors.text3, fontSize: FontSize.sm },
  espFooter: { gap: Spacing.md },
  espLiveBox: {
    flexDirection: 'row', justifyContent: 'space-between',
    backgroundColor: Colors.bg2, padding: Spacing.sm,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border,
  },
  espLivePulse: { color: Colors.blue, fontSize: FontSize.sm, fontWeight: '600' },
  espTime: { color: Colors.text2, fontSize: FontSize.sm },
});
