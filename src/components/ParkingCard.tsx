import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { ParkingLot } from '../types';
import { Badge, BadgeVariant } from './Badge';

interface Props { lot: ParkingLot; onPress: (lot: ParkingLot) => void; }

const accent = (Colors: ThemeColors, level: ParkingLot['availabilityLevel']) =>
  level === 'high' ? Colors.green : level === 'medium' ? Colors.amber : Colors.red;

const variant = (level: ParkingLot['availabilityLevel']): BadgeVariant =>
  level === 'high' ? 'green' : level === 'medium' ? 'amber' : 'red';

export const ParkingCard: React.FC<Props> = ({ lot, onPress }) => {
  const Colors  = useColors();
  const s       = useThemedStyles(makeStyles);
  const { isFavourite, toggleFavourite } = useApp();
  const fav     = isFavourite(lot.id);
  const col     = accent(Colors, lot.availabilityLevel);
  const fillPct = Math.max(2, (lot.freeSpots / lot.totalSpots) * 100);
  const label   = lot.freeSpots === 0 ? 'Full' : `${lot.freeSpots} free`;

  return (
    <TouchableOpacity style={[s.card, { borderLeftColor: col }]}
      onPress={() => onPress(lot)} activeOpacity={0.75}>

      <View style={s.top}>
        <View style={s.info}>
          <Text style={s.name}>{lot.name}</Text>
          <Text style={s.addr}>{lot.address}</Text>
        </View>
        <View style={s.topRight}>
          <TouchableOpacity
            style={s.favBtn}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            onPress={() => toggleFavourite(lot.id)}
            accessibilityRole="button"
            accessibilityLabel={fav ? 'Remove from favourites' : 'Add to favourites'}
          >
            <Text style={s.favIcon}>{fav ? '❤️' : '🤍'}</Text>
          </TouchableOpacity>
          <Text style={s.price}>{lot.pricePerHour} DH<Text style={s.unit}>/hr</Text></Text>
        </View>
      </View>

      <View style={s.meta}>
        <Badge label={label} variant={variant(lot.availabilityLevel)} />
        <Text style={s.metaTxt}>📍 {lot.distanceKm} km</Text>
        <Text style={s.metaTxt}>⭐ {lot.rating}</Text>
      </View>

      <View style={s.track}>
        <View style={[s.fill, { width: `${fillPct}%` as any, backgroundColor: col }]} />
      </View>
    </TouchableOpacity>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  card:    { backgroundColor: Colors.surface, borderRadius: Radius.sm,
             borderLeftWidth: 3, padding: Spacing.md, marginBottom: Spacing.sm },
  top:     { flexDirection: 'row', justifyContent: 'space-between',
             alignItems: 'flex-start', marginBottom: Spacing.sm },
  info:    { flex: 1, marginRight: Spacing.sm },
  topRight:{ alignItems: 'flex-end', gap: 4 },
  favBtn:  { padding: 2 },
  favIcon: { fontSize: 20 },
  name:    { color: Colors.text,  fontSize: FontSize.lg, fontWeight: '600' },
  addr:    { color: Colors.text3, fontSize: FontSize.sm, marginTop: 2 },
  price:   { color: Colors.green, fontSize: FontSize.lg, fontWeight: '700' },
  unit:    { color: Colors.text3, fontSize: FontSize.xs, fontWeight: '400' },
  meta:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  metaTxt: { color: Colors.text2, fontSize: FontSize.sm },
  track:   { height: 4, backgroundColor: Colors.surface2, borderRadius: 2, overflow: 'hidden' },
  fill:    { height: '100%', borderRadius: 2 },
});
