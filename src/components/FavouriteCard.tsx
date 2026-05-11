import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { useApp } from '../context/AppContext';
import { ParkingLot } from '../types';
import { Badge, BadgeVariant } from './Badge';

interface Props { lot: ParkingLot; onViewMap: (lot: ParkingLot) => void; }

const info = (Colors: ThemeColors, lot: ParkingLot): { label: string; variant: BadgeVariant; iconBg: string } => {
  if (lot.freeSpots === 0)                return { label: 'Full',                  variant: 'red',   iconBg: Colors.redDim   };
  if (lot.availabilityLevel === 'medium') return { label: `${lot.freeSpots} free`, variant: 'amber', iconBg: Colors.amberDim };
  return                                         { label: `${lot.freeSpots} free`, variant: 'green', iconBg: Colors.greenDim };
};

export const FavouriteCard: React.FC<Props> = ({ lot, onViewMap }) => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  const { toggleFavourite } = useApp();
  const { label, variant, iconBg } = info(Colors, lot);
  return (
    <View style={s.card}>
      <View style={s.top}>
        <View style={s.left}>
          <View style={[s.icon, { backgroundColor: iconBg }]}>
            <Text style={s.star}>⭐</Text>
          </View>
          <View style={s.textCol}>
            <Text style={s.name}>{lot.name}</Text>
            <Text style={s.addr}>{lot.address} · {lot.distanceKm} km</Text>
          </View>
        </View>
        <View style={s.topRight}>
          <TouchableOpacity
            style={s.favBtn}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
            onPress={() => toggleFavourite(lot.id)}
            accessibilityRole="button"
            accessibilityLabel="Remove from favourites"
          >
            <Text style={s.favIcon}>❤️</Text>
          </TouchableOpacity>
          <Badge label={label} variant={variant} />
        </View>
      </View>
      <TouchableOpacity style={s.mapBtn} onPress={() => onViewMap(lot)} activeOpacity={0.75}>
        <Text style={s.mapBtnTxt}>🗺️  View on Map</Text>
      </TouchableOpacity>
    </View>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  card:     { backgroundColor: Colors.surface, borderRadius: Radius.sm,
              borderWidth: 1, borderColor: Colors.border,
              padding: Spacing.md, marginBottom: Spacing.sm },
  top:      { flexDirection: 'row', justifyContent: 'space-between',
              alignItems: 'flex-start', marginBottom: Spacing.sm },
  left:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, marginRight: Spacing.sm },
  icon:     { width: 32, height: 32, borderRadius: Radius.xs,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  star:     { fontSize: 15 },
  textCol:  { flex: 1 },
  name:     { color: Colors.text,  fontSize: FontSize.md, fontWeight: '600' },
  addr:     { color: Colors.text3, fontSize: FontSize.sm, marginTop: 1 },
  topRight: { alignItems: 'flex-end', gap: 6 },
  favBtn:   { padding: 2 },
  favIcon:  { fontSize: 18 },
  mapBtn:   { borderRadius: Radius.sm, borderWidth: 1,
              borderColor: 'rgba(99,102,241,0.3)', paddingVertical: 7, alignItems: 'center' },
  mapBtnTxt:{ color: Colors.accent, fontSize: FontSize.base, fontWeight: '500' },
});
