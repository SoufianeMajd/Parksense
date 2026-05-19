import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { useUserLocation } from '../hooks/useUserLocation';
import { distanceKm, openDirections } from '../services/geo';
import { ParkingCard }   from '../components/ParkingCard';
import { StatCard }      from '../components/StatCard';
import { SectionHeader } from '../components/SectionHeader';
import { ParkingLot } from '../types';

export const HomeScreen: React.FC = () => {
  const Colors                  = useColors();
  const s                       = useThemedStyles(makeStyles);
  const { lots, isLoading, refreshLots } = useApp();
  const { user: authUser }      = useAuth();
  const { coords, status, isReal, refresh: refreshLocation } = useUserLocation();

  const realName = authUser?.user_metadata?.name || authUser?.email?.split('@')[0] || 'User';
  const realInitials = realName.substring(0, 2).toUpperCase();

  const [search, setSearch]               = useState('');
  const [showResults, setShowResults]     = useState(false);
  const [selectedId, setSelectedId]       = useState<string | null>(null);

  // Recompute distance from real GPS, then sort: available lots first, nearest first.
  const ranked = useMemo(() => {
    const withDist = lots.map(l => ({
      ...l,
      distanceKm: Math.round(distanceKm(coords, l.coordinates) * 10) / 10,
    }));
    return withDist.sort((a, b) => {
      const aFull = a.freeSpots === 0 ? 1 : 0;
      const bFull = b.freeSpots === 0 ? 1 : 0;
      if (aFull !== bFull) return aFull - bFull;
      return a.distanceKm - b.distanceKm;
    });
  }, [lots, coords]);

  const displayed = search.trim()
    ? ranked.filter(l =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.address.toLowerCase().includes(search.toLowerCase()))
    : ranked;

  const stats = useMemo(() => ({
    totalFree:   ranked.reduce((n, l) => n + l.freeSpots, 0),
    nearbyCount: ranked.length,
    nearestKm:   ranked.length ? ranked[0].distanceKm : 0,
  }), [ranked]);

  const selected = ranked.find(l => l.id === selectedId) ?? null;

  const handleFindBest = () => {
    if (status === 'loading') return;
    setShowResults(true);
    // Auto-select the best (first) lot so the Navigate CTA is immediately usable.
    const best = ranked.find(l => l.freeSpots > 0) ?? ranked[0];
    if (best) setSelectedId(best.id);
  };

  const handleNavigate = (lot: ParkingLot) => {
    openDirections(lot.coordinates, lot.name);
  };

  const locationBadge =
    status === 'loading' ? '📍 Locating…'
    : isReal             ? '📍 Live location'
    : status === 'denied'? '📍 Location denied (using default)'
    :                       '📍 Default location';

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={() => { refreshLots(); refreshLocation(); }}
            tintColor={Colors.accent}
          />
        }
      >
        {/* Header */}
        <View style={s.header}>
          <View>
            <Text style={s.greeting}>Good morning</Text>
            <Text style={s.name}>{realName} 👋</Text>
            <TouchableOpacity onPress={refreshLocation}>
              <Text style={s.locTag}>{locationBadge}</Text>
            </TouchableOpacity>
          </View>
          <View style={s.avatar}>
            <Text style={s.avatarTxt}>{realInitials}</Text>
          </View>
        </View>

        {/* Search */}
        <View style={s.searchBox}>
          <Text style={s.searchIcon}>🔍</Text>
          <TextInput
            style={s.searchInput}
            placeholder="Search destination or parking…"
            placeholderTextColor={Colors.text3}
            value={search}
            onChangeText={t => { setSearch(t); if (t) setShowResults(true); }}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Text style={s.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Quick stats */}
        <View style={s.statsRow}>
          <StatCard value={stats.totalFree}           label="Available"   valueColor={Colors.green} />
          <View style={s.gap} />
          <StatCard value={stats.nearbyCount}         label="Nearby lots" />
          <View style={s.gap} />
          <StatCard value={`${stats.nearestKm} km`}   label="Nearest"     valueColor={Colors.amber} />
        </View>

        {/* Results gate */}
        {!showResults ? (
          <View style={s.heroBox}>
            <Text style={s.heroIcon}>🅿️</Text>
            <Text style={s.heroTitle}>Looking for a spot?</Text>
            <Text style={s.heroSub}>
              Tap below — we'll show available parking sorted by distance from you.
            </Text>
            <TouchableOpacity
              style={[s.ctaBtn, status === 'loading' && s.ctaBtnDisabled]}
              activeOpacity={0.85}
              disabled={status === 'loading'}
              onPress={handleFindBest}
            >
              {status === 'loading' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.ctaTxt}>🅿  Find Best Parking</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <SectionHeader
              title={`${displayed.length} Parking nearby`}
              actionLabel="Hide"
              onAction={() => { setShowResults(false); setSelectedId(null); }}
            />

            {isLoading ? (
              <ActivityIndicator color={Colors.accent} style={{ marginTop: Spacing.xl }} />
            ) : displayed.length === 0 ? (
              <View style={s.empty}>
                <Text style={s.emptyTxt}>No parking lots found.</Text>
              </View>
            ) : (
              displayed.map(lot => {
                const isSel = lot.id === selectedId;
                return (
                  <View
                    key={lot.id}
                    style={isSel ? s.cardSelectedWrap : undefined}
                  >
                    <ParkingCard lot={lot} onPress={l => setSelectedId(l.id)} />
                  </View>
                );
              })
            )}
          </>
        )}

        {/* Footer space so the sticky CTA doesn't cover the last card */}
        {selected && <View style={{ height: 96 }} />}
      </ScrollView>

      {/* Sticky Navigate CTA — only when a lot is selected */}
      {selected && (
        <View style={s.navBar}>
          <View style={{ flex: 1 }}>
            <Text style={s.navName} numberOfLines={1}>{selected.name}</Text>
            <Text style={s.navMeta}>
              {selected.distanceKm} km · {selected.freeSpots === 0 ? 'Full' : `${selected.freeSpots} free`} · {selected.pricePerHour} DH/hr
            </Text>
          </View>
          <TouchableOpacity
            style={s.navBtn}
            activeOpacity={0.85}
            onPress={() => handleNavigate(selected)}
          >
            <Text style={s.navBtnTxt}>Navigate to the parking →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:         { flex: 1, backgroundColor: Colors.bg },
  scroll:       { flex: 1 },
  content:      { padding: Spacing.lg, paddingBottom: Spacing.xxl },

  header:       { flexDirection: 'row', justifyContent: 'space-between',
                  alignItems: 'center', marginBottom: Spacing.lg },
  greeting:     { color: Colors.text3, fontSize: FontSize.sm },
  name:         { color: Colors.text,  fontSize: FontSize.h3, fontWeight: '700', marginTop: 2 },
  locTag:       { color: Colors.accent, fontSize: FontSize.xs, marginTop: 4, fontWeight: '500' },
  avatar:       { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.accent,
                  alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { color: '#fff', fontSize: FontSize.md, fontWeight: '700' },

  searchBox:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                  backgroundColor: Colors.surface, borderRadius: Radius.sm,
                  borderWidth: 1, borderColor: Colors.border2,
                  paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
                  marginBottom: Spacing.lg },
  searchIcon:   { fontSize: FontSize.md },
  searchInput:  { flex: 1, color: Colors.text, fontSize: FontSize.md },
  clearBtn:     { color: Colors.text3, fontSize: FontSize.md, padding: 2 },

  statsRow:     { flexDirection: 'row', marginBottom: Spacing.lg },
  gap:          { width: Spacing.sm },

  heroBox:      {
    backgroundColor: Colors.surface, borderRadius: Radius.md,
    borderWidth: 1, borderColor: Colors.border,
    padding: Spacing.xl, alignItems: 'center', gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  heroIcon:     { fontSize: 56 },
  heroTitle:    { color: Colors.text,  fontSize: FontSize.h2, fontWeight: '700' },
  heroSub:      { color: Colors.text3, fontSize: FontSize.md, textAlign: 'center', marginBottom: Spacing.md },

  cardSelectedWrap: {
    borderRadius: Radius.sm, borderWidth: 2, borderColor: Colors.accent,
  },

  empty:        { alignItems: 'center', paddingVertical: Spacing.xxl },
  emptyTxt:     { color: Colors.text3, fontSize: FontSize.md },

  ctaBtn:       { backgroundColor: Colors.accent, borderRadius: Radius.sm,
                  paddingVertical: Spacing.md + 4, paddingHorizontal: Spacing.xl,
                  alignItems: 'center', alignSelf: 'stretch' },
  ctaBtnDisabled:{ opacity: 0.6 },
  ctaTxt:       { color: '#fff', fontSize: FontSize.xl, fontWeight: '600' },

  navBar:       {
    position: 'absolute', left: 0, right: 0, bottom: 0,
    backgroundColor: Colors.bg2,
    borderTopWidth: 1, borderTopColor: Colors.border,
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    padding: Spacing.md,
  },
  navName:      { color: Colors.text, fontSize: FontSize.md, fontWeight: '600' },
  navMeta:      { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },
  navBtn:       {
    backgroundColor: Colors.green, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  navBtnTxt:    { color: '#fff', fontSize: FontSize.md, fontWeight: '600' },
});
