import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FontSize, Radius, Spacing, ThemeColors } from '../constants/theme';
import { useColors, useThemedStyles } from '../context/ThemeContext';
import { ParkingFloor, SpotStatus } from '../types';

interface Props { floor: ParkingFloor; totalFree: number; totalSpots: number; }

const spotPalette = (Colors: ThemeColors): Record<SpotStatus, { bg: string; border: string; text: string }> => ({
  free:     { bg: Colors.greenDim, border: 'rgba(34,197,94,0.30)',  text: Colors.green },
  occupied: { bg: Colors.redDim,   border: 'rgba(239,68,68,0.25)',  text: Colors.red   },
  ev:       { bg: Colors.blueDim,  border: 'rgba(59,130,246,0.30)', text: Colors.blue  },
});

export const SpotGrid: React.FC<Props> = ({ floor, totalFree, totalSpots }) => {
  const Colors = useColors();
  const s = useThemedStyles(makeStyles);
  const C = useMemo(() => spotPalette(Colors), [Colors]);
  return (
    <View>
      <View style={s.hdr}>
        <Text style={s.floorLbl}>{floor.label} — Real-time view</Text>
        <Text style={s.cntLbl}>{totalFree} / {totalSpots} free</Text>
      </View>
      <View style={s.grid}>
        {floor.spots.map(spot => {
          const c = C[spot.status];
          return (
            <View key={spot.id} style={[s.spot, { backgroundColor: c.bg, borderColor: c.border }]}>
              <Text style={[s.spotLbl, { color: c.text }]}>{spot.label}</Text>
            </View>
          );
        })}
      </View>
      <View style={s.legend}>
        <Text style={[s.leg, { color: Colors.green }]}>● Free</Text>
        <Text style={[s.leg, { color: Colors.red   }]}>● Occupied</Text>
        <Text style={[s.leg, { color: Colors.blue  }]}>● EV</Text>
      </View>
    </View>
  );
};

const makeStyles = (Colors: ThemeColors) => StyleSheet.create({
  hdr:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.sm },
  floorLbl: { color: Colors.text3, fontSize: FontSize.sm },
  cntLbl:   { color: Colors.text2, fontSize: FontSize.sm },
  grid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  spot:     { width: 44, height: 44, borderRadius: Radius.xs, borderWidth: 1,
              alignItems: 'center', justifyContent: 'center' },
  spotLbl:  { fontSize: FontSize.sm, fontWeight: '600' },
  legend:   { flexDirection: 'row', gap: Spacing.sm },
  leg:      { fontSize: FontSize.xs },
});
