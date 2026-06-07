import React from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Linking, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { WebView } from 'react-native-webview';

import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { RootStackParamList } from '../types';
import { useApp } from '../context/AppContext';
import { useUserLocation } from '../hooks/useUserLocation';

type Route = RouteProp<RootStackParamList, 'NavigationScreen'>;

export const NavigationScreen: React.FC = () => {
  const Colors        = useColors();
  const s             = useThemedStyles(makeStyles);
  const route         = useRoute<Route>();
  const navigation    = useNavigation();
  const { clearNavigation } = useApp();
  const { coords: userCoords } = useUserLocation();
  const lot           = route.params.lot;
  const dest          = lot.coordinates;

  const handleCancel = () => {
    clearNavigation();
    navigation.goBack();
  };

  const openNativeGoogleMaps = () => {
    const { latitude, longitude } = dest;
    const originStr = `${userCoords.latitude},${userCoords.longitude}`;
    const destStr = `${latitude},${longitude}`;
    const url = Platform.select({
      ios: `comgooglemaps://?saddr=${originStr}&daddr=${destStr}&directionsmode=driving`,
      android: `google.navigation:q=${destStr}&mode=d`,
      default: `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`,
    });
    Linking.openURL(url!).catch(() => {
      Linking.openURL(
        `https://www.google.com/maps/dir/?api=1&origin=${originStr}&destination=${destStr}&travelmode=driving`,
      );
    });
  };

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${userCoords.latitude},${userCoords.longitude}&destination=${dest.latitude},${dest.longitude}&travelmode=driving`;

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.container}>
        <WebView
          style={s.webview}
          source={{ uri: mapsUrl }}
          startInLoadingState
          javaScriptEnabled
          domStorageEnabled
          geolocationEnabled
          allowsBackForwardNavigationGestures
        />

        {/* ── Top bar ──────────────────────────────────────────── */}
        <View style={s.topBar}>
          <Text style={s.destName} numberOfLines={1}>{lot.name}</Text>
          <Text style={s.destAddr} numberOfLines={1}>{lot.distanceKm} km · {lot.freeSpots} free</Text>
          <TouchableOpacity onPress={handleCancel} style={s.cancelBtn}>
            <Text style={s.cancelTxt}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* ── Bottom bar ───────────────────────────────────────── */}
        <View style={s.bottomBar}>
          <TouchableOpacity style={s.voiceBtn} onPress={openNativeGoogleMaps} activeOpacity={0.85}>
            <Text style={s.voiceBtnIcon}>🗣️</Text>
            <Text style={s.voiceBtnTxt}>Assistant vocal</Text>
            <Text style={s.voiceBtnSub}>Ouvrir dans Google Maps</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  safe:      { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1 },
  webview:   { flex: 1, marginBottom: 70 },

  topBar: {
    position: 'absolute', top: 10, left: 12, right: 12,
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg2, borderRadius: Radius.sm,
    borderWidth: 1, borderColor: Colors.border2,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
  },
  destName: {
    flex: 1, color: Colors.text, fontSize: FontSize.md,
    fontWeight: '600',
  },
  destAddr: {
    color: Colors.text3, fontSize: FontSize.sm,
  },
  cancelBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.redDim, alignItems: 'center',
    justifyContent: 'center',
  },
  cancelTxt: { color: Colors.red, fontSize: FontSize.md, fontWeight: '700' },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: Spacing.md, paddingBottom: Spacing.lg,
    backgroundColor: Colors.bg2,
    borderTopWidth: 1, borderTopColor: Colors.border,
  },
  voiceBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.accent, borderRadius: Radius.sm,
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  voiceBtnIcon: { fontSize: 24 },
  voiceBtnTxt: {
    flex: 1, color: '#fff', fontSize: FontSize.lg,
    fontWeight: '700',
  },
  voiceBtnSub: {
    color: 'rgba(255,255,255,0.75)', fontSize: FontSize.sm,
  },
});
