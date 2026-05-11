import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useTheme, useThemedStyles } from '../context/ThemeContext';
import { useApp }          from '../context/AppContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { useParkedTime }   from '../hooks/useParkedTime';
import { distanceKm, openWalkingDirections, walkingMinutes, toMeters } from '../services/geo';
import { LiveChip }        from '../components/LiveChip';
import { StatCard }        from '../components/StatCard';

// Defensive load — if react-native-maps fails to initialize on Expo Go,
// fall back to a non-map view rather than crashing the whole bundle.
let MapView: any, Marker: any, Polyline: any, PROVIDER_DEFAULT: any;
let MAPS_AVAILABLE = false;
try {
  const maps = require('react-native-maps');
  MapView          = maps.default;
  Marker           = maps.Marker;
  Polyline         = maps.Polyline;
  PROVIDER_DEFAULT = maps.PROVIDER_DEFAULT;
  MAPS_AVAILABLE   = !!MapView;
} catch (e) {
  console.warn('[FindCarScreen] react-native-maps unavailable:', e);
}

const DARK_STYLE = [
  { elementType: 'geometry',            stylers: [{ color: '#1a1e28' }] },
  { elementType: 'labels.text.fill',    stylers: [{ color: '#8b92a8' }] },
  { elementType: 'labels.text.stroke',  stylers: [{ color: '#0d0f14' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#252a3a' }] },
];

export const FindCarScreen: React.FC = () => {
  const Colors                                  = useColors();
  const { mode }                                = useTheme();
  const s                                       = useThemedStyles(makeStyles);
  const { parkedCar, parkCar, unparkCar, lots } = useApp();
  const { coords: userCoords, status, isReal, refresh: refreshLocation } = useUserLocation();
  const { display, cost }                       = useParkedTime(parkedCar);

  // All hooks MUST run unconditionally — keep them above any early return.
  const km = useMemo(
    () => parkedCar ? distanceKm(userCoords, parkedCar.coordinates) : 0,
    [userCoords, parkedCar],
  );

  // ── No car parked ─────────────────────────────────────────────
  if (!parkedCar) {
    const handlePark = () => {
      if (status === 'loading') return;
      if (!isReal) {
        Alert.alert(
          'Location not available',
          'We need your location to remember where you parked. Please grant permission.',
          [{ text: 'OK', onPress: refreshLocation }],
        );
        return;
      }
      // Auto-attribute to the nearest known lot if it's within 80m, otherwise
      // call it on-street parking.
      const nearest = [...lots]
        .map(l => ({ lot: l, km: distanceKm(userCoords, l.coordinates) }))
        .sort((a, b) => a.km - b.km)[0];
      const inLot = nearest && nearest.km < 0.08;
      parkCar(userCoords, inLot
        ? { lotName: nearest.lot.name, floor: nearest.lot.floors[0]?.label }
        : undefined,
      );
    };

    return (
      <SafeAreaView style={s.safe} edges={['top']}>
        <View style={s.empty}>
          <Text style={s.emptyIcon}>🅿</Text>
          <Text style={s.emptyTitle}>No car parked</Text>
          <Text style={s.emptySub}>
            Tap below to save your current location. We'll remember it until you pick the car up.
          </Text>

          <TouchableOpacity
            style={[s.parkBtn, status === 'loading' && { opacity: 0.6 }]}
            activeOpacity={0.85}
            disabled={status === 'loading'}
            onPress={handlePark}
          >
            {status === 'loading' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={s.parkBtnTxt}>📍  Park my car here</Text>
            )}
          </TouchableOpacity>

          <Text style={s.locHint}>
            {status === 'loading' ? 'Locating you…'
             : isReal              ? '📍 Live location ready'
             : status === 'denied' ? 'Location denied — tap to retry'
             :                       'Location unavailable — tap to retry'}
          </Text>
          {!isReal && status !== 'loading' && (
            <TouchableOpacity onPress={refreshLocation}>
              <Text style={s.locRetry}>Retry location</Text>
            </TouchableOpacity>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ── Live distance / time from user → parked car ──────────────
  const walkMinutes = walkingMinutes(km);
  const walkMeters  = toMeters(km);

  const midLat  = (userCoords.latitude  + parkedCar.coordinates.latitude)  / 2;
  const midLon  = (userCoords.longitude + parkedCar.coordinates.longitude) / 2;
  const parkedTime = parkedCar.parkedAt.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const handleUnpark = () => Alert.alert(
    'Picked up your car?',
    'This will clear the saved location.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes, picked it up', style: 'destructive', onPress: unparkCar },
    ],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      {/* ── Map (or fallback) ─────────────────────────────── */}
      {MAPS_AVAILABLE ? (
        <MapView
          style={s.map}
          provider={PROVIDER_DEFAULT}
          customMapStyle={mode === 'dark' ? DARK_STYLE : []}
          initialRegion={{
            latitude: midLat, longitude: midLon,
            latitudeDelta: Math.max(0.005, km * 0.04),
            longitudeDelta: Math.max(0.005, km * 0.04),
          }}
        >
          <Marker coordinate={userCoords} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={s.userDot} />
          </Marker>

          <Marker coordinate={parkedCar.coordinates}>
            <View style={s.carPin}>
              <Text style={s.carPinIcon}>🚗</Text>
            </View>
          </Marker>

          <Polyline
            coordinates={[userCoords, parkedCar.coordinates]}
            strokeColor={Colors.accent}
            strokeWidth={3}
            lineDashPattern={[8, 8]}
          />
        </MapView>
      ) : (
        <View style={s.mapFallback}>
          <Text style={s.fallbackIcon}>🗺️</Text>
          <Text style={s.fallbackTitle}>Map unavailable</Text>
          <Text style={s.fallbackSub}>
            {walkMinutes} min walk · {walkMeters} m away
          </Text>
        </View>
      )}

      {/* ── Info panel ───────────────────────────────────── */}
      <View style={s.panel}>
        <View style={s.handle} />

        {/* Header */}
        <View style={s.panelHdr}>
          <Text style={s.panelTitle}>Find My Car</Text>
          <LiveChip label="GPS Lock" color={Colors.green} />
        </View>

        {/* Car detail */}
        <View style={s.carCard}>
          <View style={s.carLeft}>
            <Text style={s.carIcon}>🚗</Text>
            <View>
              <Text style={s.carName}>{parkedCar.carName}</Text>
              <Text style={s.carSpot}>
                {parkedCar.lotName}{parkedCar.floor ? ` · ${parkedCar.floor}` : ''}
              </Text>
            </View>
          </View>
          {parkedCar.spotLabel && (
            <View style={s.spotBadge}>
              <Text style={s.spotBadgeTxt}>{parkedCar.spotLabel}</Text>
            </View>
          )}
        </View>

        {/* Live walk stats */}
        <View style={s.statsRow}>
          <StatCard value={walkMinutes} label="min walk" valueColor={Colors.accent} />
          <View style={s.gap} />
          <StatCard value={walkMeters}  label="meters" />
          <View style={s.gap} />
          <StatCard value={display}     label="parked" valueColor={Colors.amber} />
        </View>

        {/* Parked-since / cost */}
        <View style={s.infoCard}>
          <View>
            <Text style={s.infoLbl}>Parked since</Text>
            <Text style={s.infoVal}>{parkedTime}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.infoLbl}>Cost so far</Text>
            <Text style={[s.infoVal, { color: Colors.green }]}>{cost} DH</Text>
          </View>
        </View>

        {/* Find my car CTA — opens device maps with walking directions */}
        <TouchableOpacity
          style={s.ctaBtn}
          activeOpacity={0.85}
          onPress={() => openWalkingDirections(
            parkedCar.coordinates,
            `${parkedCar.carName} · ${parkedCar.lotName}`,
          )}
        >
          <Text style={s.ctaTxt}>🧭  Find My Car</Text>
        </TouchableOpacity>

        {/* Picked up */}
        <TouchableOpacity
          style={s.unparkBtn}
          activeOpacity={0.75}
          onPress={handleUnpark}
        >
          <Text style={s.unparkTxt}>I picked up my car</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.mapBg },
  map:          { height: '45%' },

  mapFallback:  {
    height: '45%', backgroundColor: Colors.bg3,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  fallbackIcon: { fontSize: 40 },
  fallbackTitle:{ color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600' },
  fallbackSub:  { color: Colors.text3, fontSize: FontSize.sm },

  userDot:      {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: Colors.blue, borderWidth: 3, borderColor: '#fff',
  },
  carPin:       {
    width: 44, height: 44, backgroundColor: Colors.amber,
    borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center',
  },
  carPinIcon:   { fontSize: 22 },

  panel:        {
    flex: 1, backgroundColor: Colors.bg2,
    borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md,
    padding: Spacing.lg, paddingTop: Spacing.sm,
    marginTop: -Radius.md,
  },
  handle:       {
    width: 36, height: 4, backgroundColor: Colors.border2,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },
  panelHdr:     {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: Spacing.md,
  },
  panelTitle:   { color: Colors.text, fontSize: FontSize.xxl, fontWeight: '700' },

  carCard:      {
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', padding: Spacing.md, marginBottom: Spacing.md,
  },
  carLeft:      { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  carIcon:      { fontSize: 24 },
  carName:      { color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600' },
  carSpot:      { color: Colors.text3, fontSize: FontSize.sm, marginTop: 1 },
  spotBadge:    {
    backgroundColor: Colors.amberDim, borderRadius: Radius.xs,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  spotBadgeTxt: { color: Colors.amber, fontSize: FontSize.md, fontWeight: '700' },

  statsRow:     { flexDirection: 'row', marginBottom: Spacing.md },
  gap:          { width: Spacing.sm },

  infoCard:     {
    backgroundColor: Colors.surface, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border,
    flexDirection: 'row', justifyContent: 'space-between',
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  infoLbl:      { color: Colors.text3, fontSize: FontSize.base },
  infoVal:      { color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600', marginTop: 2 },

  ctaBtn:       {
    backgroundColor: Colors.green, borderRadius: Radius.sm,
    paddingVertical: Spacing.md + 2, alignItems: 'center',
  },
  ctaTxt:       { color: '#fff', fontSize: FontSize.xl, fontWeight: '600' },

  unparkBtn:    {
    marginTop: Spacing.sm, alignItems: 'center', paddingVertical: Spacing.sm + 2,
    borderRadius: Radius.sm, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  unparkTxt:    { color: Colors.red, fontSize: FontSize.md, fontWeight: '600' },

  empty:        {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: Spacing.md, padding: Spacing.xl,
  },
  emptyIcon:    { fontSize: 56 },
  emptyTitle:   { color: Colors.text,  fontSize: FontSize.h3, fontWeight: '700' },
  emptySub:     { color: Colors.text3, fontSize: FontSize.md, textAlign: 'center' },

  parkBtn:      {
    marginTop: Spacing.md, paddingVertical: Spacing.md + 4, paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.accent, borderRadius: Radius.sm,
    minWidth: 240, alignItems: 'center',
  },
  parkBtnTxt:   { color: '#fff', fontSize: FontSize.xl, fontWeight: '700' },
  locHint:      { color: Colors.text3, fontSize: FontSize.sm, marginTop: Spacing.xs },
  locRetry:     { color: Colors.accent, fontSize: FontSize.sm, fontWeight: '500' },
});
