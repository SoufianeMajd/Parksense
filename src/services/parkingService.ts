import { ParkingLot, SpotStatus } from '../types';
import { PARKING_LOTS } from './mockData';

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/** Simulated API fetch (600 ms latency) */
export const fetchParkingLots = async (): Promise<ParkingLot[]> => {
  await delay(600);
  return PARKING_LOTS.map(l => ({ ...l }));
};

/**
 * Simulates a single IoT sensor tick:
 * ~10 % of non-EV spots randomly flip state,
 * then freeSpots and availabilityLevel are recalculated.
 */
export const simulateLiveUpdate = (lot: ParkingLot): ParkingLot => {
  if (lot.id === 'esp32-lot') return lot;

  const updatedFloors = lot.floors.map(floor => ({
    ...floor,
    spots: floor.spots.map(spot => {
      if (spot.status === 'ev') return spot;
      if (Math.random() < 0.1) {
        const next: SpotStatus = spot.status === 'free' ? 'occupied' : 'free';
        return { ...spot, status: next };
      }
      return spot;
    }),
  }));

  const allSpots = updatedFloors.flatMap(f => f.spots);
  const newFree  = allSpots.filter(s => s.status === 'free').length;
  const ratio    = newFree / allSpots.length;
  const level    = newFree === 0 ? 'full'
                 : ratio < 0.2   ? 'low'
                 : ratio < 0.5   ? 'medium' : 'high';

  return { ...lot, floors: updatedFloors, freeSpots: newFree, availabilityLevel: level };
};
