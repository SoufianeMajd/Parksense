import { Platform, Linking, Alert } from 'react-native';
import { Coordinates } from '../types';

const R = 6371; // Earth radius (km)

export const distanceKm = (a: Coordinates, b: Coordinates): number => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude  - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 +
            Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
};

/** Open the device's maps app with driving directions to a destination. */
export const openDirections = (dest: Coordinates, label?: string) => {
  const { latitude, longitude } = dest;
  const url = Platform.select({
    ios:     `maps://?daddr=${latitude},${longitude}&dirflg=d`,
    android: `google.navigation:q=${latitude},${longitude}&mode=d`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`,
  })!;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving${
    label ? `&destination_place_id=${encodeURIComponent(label)}` : ''
  }`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(fallback).catch(() =>
      Alert.alert('Maps unavailable', 'Could not open a maps app on this device.'),
    ),
  );
};

/** Open device maps with walking directions (for "find my car"). */
export const openWalkingDirections = (dest: Coordinates, label?: string) => {
  const { latitude, longitude } = dest;
  const url = Platform.select({
    ios:     `maps://?daddr=${latitude},${longitude}&dirflg=w`,
    android: `google.navigation:q=${latitude},${longitude}&mode=w`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`,
  })!;
  const fallback = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking${
    label ? `&destination_place_id=${encodeURIComponent(label)}` : ''
  }`;
  Linking.openURL(url).catch(() =>
    Linking.openURL(fallback).catch(() =>
      Alert.alert('Maps unavailable', 'Could not open a maps app on this device.'),
    ),
  );
};

/** Average walking pace ≈ 5 km/h → 12 min/km. */
export const walkingMinutes = (km: number) => Math.max(1, Math.round(km * 12));
export const toMeters       = (km: number) => Math.round(km * 1000);
