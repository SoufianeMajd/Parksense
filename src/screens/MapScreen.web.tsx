import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, ScrollView, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { Coordinates, ParkingLot, RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { buildNavSession } from '../services/mockData';
import { distanceKm } from '../services/geo';
import { LiveChip } from '../components/LiveChip';
import { SpotGrid } from '../components/SpotGrid';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type MapFilter = 'all' | 'nearest' | 'cheapest' | 'ev' | 'available';

const FILTERS: { key: MapFilter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'nearest', label: 'Nearest' },
  { key: 'cheapest', label: 'Cheapest' },
  { key: 'ev', label: 'EV' },
  { key: 'available', label: 'Available' },
];

const pinColor = (Colors: ThemeColors, level: string) =>
  level === 'high' ? Colors.green : level === 'medium' ? Colors.amber : Colors.red;

const OSM_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_ATTR = '&copy; <a href="https://openstreetmap.org/copyright">OpenStreetMap</a>';

const DEFAULT_CENTER: [number, number] = [33.5731, -7.5898];
const DEFAULT_ZOOM = 14;

L.Icon.Default.mergeOptions({ iconRetinaUrl: undefined, iconUrl: undefined, shadowUrl: undefined });

const parkingIcon = (color: string, freeSpots: number, selected: boolean) =>
  L.divIcon({
    className: '',
    html: `<div style="
      display:flex;align-items:center;background:#11161B;border-radius:14px;
      border:3px solid ${color};padding-right:10px;height:36px;width:max-content;box-sizing:border-box;
      ${selected ? 'transform:scale(1.15);' : ''}
    "><div style="
      display:flex;justify-content:center;align-items:center;
      width:26px;height:26px;background:${color};border-radius:8px;margin:2px 2px 2px 3px;
    "><span style="color:#fff;font-size:16px;font-weight:900;line-height:1;">P</span></div><span style="
      color:${color};font-size:16px;font-weight:900;margin-left:4px;
    ">${freeSpots}</span></div>`,
    iconSize: [100, 45],
    iconAnchor: [50, 22],
  });

const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:18px;height:18px;border-radius:9px;background:#3B82F6;border:3px solid #fff"></div>',
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const MapClickHandler = ({ onMapPress }: { onMapPress: () => void }) => {
  useMapEvents({ click: onMapPress });
  return null;
};

const MapBoundsUpdater = ({ lots }: { lots: ParkingLot[] }) => {
  const map = useMap();
  useEffect(() => {
    if (lots.length === 0) return;
    const bounds = L.latLngBounds(lots.map(l => [l.coordinates.latitude, l.coordinates.longitude] as [number, number]));
    if (bounds.isValid()) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
  }, [lots, map]);
  return null;
};

type LocStatus = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

export const MapScreen: React.FC = () => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  const navigation = useNavigation<Nav>();
  const { lots, startNavigation } = useApp();
  const [filter, setFilter] = useState<MapFilter>('all');
  const [selected, setSelected] = useState<ParkingLot | null>(null);
  const [showSpots, setShowSpots] = useState(false);
  const [userCoords, setUserCoords] = useState<Coordinates>({ latitude: DEFAULT_CENTER[0], longitude: DEFAULT_CENTER[1] });
  const [locStatus, setLocStatus] = useState<LocStatus>('idle');

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocStatus('error'); return; }
    setLocStatus('loading');
    navigator.geolocation.getCurrentPosition(
      pos => {
        setUserCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
        setLocStatus('granted');
      },
      err => {
        setLocStatus(err.code === err.PERMISSION_DENIED ? 'denied' : 'error');
      },
      { enableHighAccuracy: false, timeout: 10000 },
    );
  }, []);

  useEffect(() => { requestLocation(); }, [requestLocation]);

  const handleSelect = (lot: ParkingLot) => {
    setSelected(lot);
    setShowSpots(false);
  };

  const handleMapPress = () => {
    setSelected(null);
    setShowSpots(false);
  };

  const filtered =
    filter === 'available' ? lots.filter(l => l.freeSpots > 0)
    : filter === 'ev' ? lots.filter(l => l.floors.some(f => f.spots.some(sp => sp.status === 'ev')))
    : filter === 'nearest' ? [...lots].sort((a, b) => distanceKm(userCoords, a.coordinates) - distanceKm(userCoords, b.coordinates))
    : filter === 'cheapest' ? [...lots].sort((a, b) => a.pricePerHour - b.pricePerHour)
    : lots;

  const center: [number, number] = selected
    ? [selected.coordinates.latitude, selected.coordinates.longitude]
    : [userCoords.latitude, userCoords.longitude];

  const liveSelected = selected ? lots.find(l => l.id === selected.id) || selected : null;
  const selectedDistanceKm = liveSelected ? Math.round(distanceKm(userCoords, liveSelected.coordinates) * 10) / 10 : null;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>
        <div style={{ flex: 1, position: 'relative' }}>
          <MapContainer
            center={center}
            zoom={DEFAULT_ZOOM}
            style={{ height: '100%', width: '100%', zIndex: 1 }}
            zoomControl={true}
          >
            <TileLayer url={OSM_URL} attribution={OSM_ATTR} />
            <MapClickHandler onMapPress={handleMapPress} />
            <MapBoundsUpdater lots={lots} />
            <Marker position={[userCoords.latitude, userCoords.longitude]} icon={userIcon} />
            {lots.map(lot => (
              <Marker
                key={lot.id}
                position={[lot.coordinates.latitude, lot.coordinates.longitude]}
                icon={parkingIcon(pinColor(Colors, lot.availabilityLevel), lot.freeSpots, selected?.id === lot.id)}
                eventHandlers={{ click: () => handleSelect(lot) }}
              />
            ))}
          </MapContainer>
        </div>

        <View style={s.headerBar}>
          <Text style={s.headerTitle}>Maârif, Casablanca</Text>
          <LiveChip />
        </View>

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

        {locStatus === 'denied' && (
          <View style={s.locBanner}>
            <Text style={s.locBannerTxt}>
              Location access denied. Enable it in your browser settings to see real distances.
            </Text>
            <TouchableOpacity style={s.locBannerBtn} onPress={requestLocation}>
              <Text style={s.locBannerBtnTxt}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {locStatus === 'loading' && (
          <View style={s.locBanner}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={[s.locBannerTxt, { marginLeft: 8 }]}>Getting your location...</Text>
          </View>
        )}

        {liveSelected && (
          <View style={s.sheet}>
            <View style={s.handle} />
            <View style={s.sheetTop}>
              <View style={{ flex: 1, marginRight: Spacing.sm }}>
                <Text style={s.sheetName}>{liveSelected.name}</Text>
                <Text style={s.sheetAddr}>
                  {liveSelected.address}{selectedDistanceKm != null ? ` · ${selectedDistanceKm} km` : ''}
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
                    <Text style={s.detailBtnTxt}>Voir les places</Text>
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
              <Text style={s.detailBtnTxt}>View Details</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.mapBg },
  container: { flex: 1 },

  headerBar: {
    position: 'absolute', top: 52, left: 12, right: 12,
    backgroundColor: Colors.bg2, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
  },
  headerTitle: { color: Colors.text2, fontSize: FontSize.md, flex: 1 },

  filterScroll: { position: 'absolute', bottom: 260, left: 0, zIndex: 10 },
  filterRow: { gap: Spacing.sm, paddingHorizontal: Spacing.md },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: 5,
    backgroundColor: Colors.bg2, borderRadius: Radius.full,
    borderWidth: 1, borderColor: Colors.border2,
  },
  chipActive: { backgroundColor: Colors.accentDim, borderColor: Colors.accent },
  chipTxt: { color: Colors.text2, fontSize: FontSize.sm, fontWeight: '500' },
  chipTxtActive: { color: Colors.accent },

  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.bg2,
    borderTopLeftRadius: Radius.md, borderTopRightRadius: Radius.md,
    padding: Spacing.lg, paddingTop: Spacing.sm,
    zIndex: 20,
  },
  handle: {
    width: 36, height: 4, backgroundColor: Colors.border2,
    borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.md,
  },
  sheetTop: {
    flexDirection: 'row', justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sheetName: { color: Colors.text, fontSize: FontSize.xl, fontWeight: '600' },
  sheetAddr: { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },
  sheetRight: { flexDirection: 'row', alignItems: 'flex-end' },
  price: { color: Colors.green, fontSize: FontSize.xxl, fontWeight: '700' },
  priceUnit: { color: Colors.text3, fontSize: FontSize.sm, marginBottom: 2 },
  gridWrap: { marginBottom: Spacing.md },
  detailBtn: {
    borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border2,
    paddingVertical: Spacing.sm + 2, alignItems: 'center',
  },
  detailBtnTxt: { color: Colors.text, fontSize: FontSize.md, fontWeight: '500' },

  locBanner: {
    position: 'absolute', top: 100, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.amberDim, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.amber,
    padding: Spacing.md, zIndex: 30,
  },
  locBannerTxt: { color: Colors.text, fontSize: FontSize.sm, flex: 1 },
  locBannerBtn: {
    backgroundColor: Colors.accent, borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs + 2,
  },
  locBannerBtnTxt: { color: '#fff', fontSize: FontSize.sm, fontWeight: '600' },
});
