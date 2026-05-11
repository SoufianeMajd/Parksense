import { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { ParkingLot } from '../types';

export type FilterType = 'all' | 'available' | 'nearest' | 'cheapest' | 'ev';

export const useParkingLots = () => {
  const { lots, isLoading, refreshLots } = useApp();
  const [filter, setFilter] = useState<FilterType>('all');

  const filtered = useMemo((): ParkingLot[] => {
    switch (filter) {
      case 'available': return lots.filter(l => l.freeSpots > 0);
      case 'nearest':   return [...lots].sort((a, b) => a.distanceKm   - b.distanceKm);
      case 'cheapest':  return [...lots].sort((a, b) => a.pricePerHour - b.pricePerHour);
      case 'ev':        return lots.filter(l => l.floors.some(f => f.spots.some(s => s.status === 'ev')));
      default:          return lots;
    }
  }, [lots, filter]);

  const stats = useMemo(() => ({
    totalFree:   lots.reduce((n, l) => n + l.freeSpots, 0),
    nearbyCount: lots.length,
    nearestKm:   lots.length ? Math.min(...lots.map(l => l.distanceKm)) : 0,
  }), [lots]);

  return { lots: filtered, isLoading, refreshLots, filter, setFilter, stats };
};
