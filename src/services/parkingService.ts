import { ParkingLot, SpotStatus, ParkingFloor, AvailabilityLevel } from '../types';
import { supabase } from './supabase';

/** Fetches real data from Supabase */
export const fetchParkingLots = async (): Promise<ParkingLot[]> => {
  // Fetch parking lots
  const { data: lotsData, error: lotsError } = await supabase
    .from('parking_lots')
    .select('*');

  if (lotsError || !lotsData) {
    console.error('Error fetching parking lots:', lotsError);
    return [];
  }

  // Fetch all parking spots
  const { data: spotsData, error: spotsError } = await supabase
    .from('parking_spots')
    .select('*');

  if (spotsError || !spotsData) {
    console.error('Error fetching parking spots:', spotsError);
    return [];
  }

  // Map database rows to the application's ParkingLot interface
  const parkingLots: ParkingLot[] = lotsData.map((lot: any) => {
    const lotSpots = spotsData.filter((s: any) => s.lot_id === lot.id);
    const freeSpotsCount = lotSpots.filter((s: any) => s.status === 'Libre').length;
    
    // Map status 'Libre'/'Occupee' to 'free'/'occupied'
    const mappedSpots = lotSpots.map((s: any) => ({
      id: s.id,
      label: s.label,
      status: (s.status === 'Libre' ? 'free' : 'occupied') as SpotStatus,
    }));

    // Calculate availability level based on ratio
    const ratio = lot.total_capacity > 0 ? freeSpotsCount / lot.total_capacity : 0;
    let availabilityLevel: AvailabilityLevel = 'high';
    if (freeSpotsCount === 0) availabilityLevel = 'full';
    else if (ratio < 0.2) availabilityLevel = 'low';
    else if (ratio < 0.5) availabilityLevel = 'medium';

    return {
      id: lot.id,
      name: lot.name,
      address: lot.name, // Using name as address since it's not in DB
      coordinates: {
        latitude: lot.latitude,
        longitude: lot.longitude,
      },
      totalSpots: lot.total_capacity,
      freeSpots: freeSpotsCount,
      pricePerHour: 10, // Mocked fallback
      rating: 4.5, // Mocked fallback
      distanceKm: 0, // Usually calculated live by the app
      floors: [
        {
          label: 'Niveau 0',
          spots: mappedSpots,
        }
      ],
      availabilityLevel,
    };
  });

  return parkingLots;
};

/**
 * Simulates a single IoT sensor tick live update (local only)
 * The app might use this to animate UI if real WebSockets aren't active yet.
 */
export const simulateLiveUpdate = (lot: ParkingLot): ParkingLot => {
  if (lot.id === '11111111-1111-1111-1111-111111111111') return lot;

  const updatedFloors = lot.floors.map((floor: ParkingFloor) => ({
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
  const ratio    = allSpots.length > 0 ? newFree / allSpots.length : 0;
  const level: AvailabilityLevel = newFree === 0 ? 'full'
                 : ratio < 0.2   ? 'low'
                 : ratio < 0.5   ? 'medium' : 'high';

  return { ...lot, floors: updatedFloors, freeSpots: newFree, availabilityLevel: level };
};
