import React, { useMemo } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useApp }          from '../context/AppContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { useParkedTime }   from '../hooks/useParkedTime';
import { distanceKm, openWalkingDirections, walkingMinutes, toMeters } from '../services/geo';
import { LiveChip }        from '../components/LiveChip';
import { StatCard }        from '../components/StatCard';

export const FindCarScreen: React.FC = () => {
  const Colors                                  = useColors();
  const s                                       = useThemedStyles(makeStyles);
  const { parkedCar, parkCar, unparkCar, lots } = useApp();
  const { coords: userCoords, status, isReal, refresh: refreshLocation } = useUserLocation();
  const { display, cost }                       = useParkedTime(parkedCar);

  // All hooks MUST be called unconditionally — keep them above any early return.
  const km = useMemo(
    () => parkedCar ? distanceKm(userCoords, parkedCar.coordinates) : 0,
    [userCoords, parkedCar],
  );

  if (!parkedCar) {
    const handlePark = () => {
      if (status === 'loading') return;
      if (!isReal) {
        Alert.alert(
          'Location not available',
          'We need your location to remember where you parked.',
          [{ text: 'OK', onPress: refreshLocation }],
        );
        return;
      }
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
            Tap below to save your current location.
          </Text>
          <TouchableOpacity
            style={[s.parkBtn, status === 'loading' && { opacity: 0.6 }]}
            activeOpacity={0.85}
            disabled={status === 'loading'}
            onPress={handlePark}
          >
            {status === 'loading'
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.parkBtnTxt}>📍  Park my car here</Text>}
          </TouchableOpacity>
          <Text style={s.locHint}>
            {status === 'loading' ? 'Locating you…'
             : isReal              ? '📍 Live location ready'
             : status === 'denied' ? 'Location denied — tap to retry'
             :                       'Location unavailable — tap to retry'}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const walkMinutes = walkingMinutes(km);
  const walkMeters  = toMeters(km);

  const parkedTime = parkedCar.parkedAt.toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  const handleUnpark = () => Alert.alert(
    'Picked up your car?',
    'This will clear the saved location.',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', style: 'destructive', onPress: unparkCar },
    ],
  );

  return (
    <SafeAreaView style={s.safe} edges={['top']}>

      <View style={s.mapFallback}>
        <Text style={s.fallbackIcon}>🗺️</Text>
        <Text style={s.fallbackTitle}>Map view on mobile only</Text>
        <Text style={s.fallbackSub}>
          {walkMinutes} min walk · {walkMeters} m away
        </Text>
      </View>

      <View style={s.panel}>
        <View style={s.handle} />

        <View style={s.panelHdr}>
          <Text style={s.panelTitle}>Find My Car</Text>
          <LiveChip label="GPS Lock" color={Colors.green} />
        </View>

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

        <View style={s.statsRow}>
          <StatCard value={walkMinutes} label="min walk" valueColor={Colors.accent} />
          <View style={s.gap} />
          <StatCard value={walkMeters}  label="meters" />
          <View style={s.gap} />
          <StatCard value={display}     label="parked" valueColor={Colors.amber} />
        </View>

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

  mapFallback:  {
    height: '45%', backgroundColor: Colors.bg3,
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  fallbackIcon: { fontSize: 40 },
  fallbackTitle:{ color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600' },
  fallbackSub:  { color: Colors.text3, fontSize: FontSize.sm },

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
});
