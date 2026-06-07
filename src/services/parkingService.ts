import { ParkingLot, SpotStatus, ParkingFloor, AvailabilityLevel } from '../types';
import { supabase } from './supabase';

/** Fetches approved parking lots for public display */
export const fetchParkingLots = async (): Promise<ParkingLot[]> => {
  // Fetch approved parking lots
  const { data: lotsData, error: lotsError } = await supabase
    .from('parking_lots')
    .select('*')
    .eq('approved', true);

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
      address: lot.address || lot.name,
      coordinates: {
        latitude: lot.latitude,
        longitude: lot.longitude,
      },
      totalSpots: lot.total_capacity,
      freeSpots: freeSpotsCount,
      pricePerHour: lot.price_per_hour || 10,
      rating: 4.5,
      distanceKm: 0,
      floors: [
        {
          label: 'Niveau 0',
          spots: mappedSpots,
        }
      ],
      availabilityLevel,
      approved: lot.approved,
      companyId: lot.company_id,
      description: lot.description,
      phone: lot.phone,
    };
  });

  return parkingLots;
};

/** Fetches all parking lots for a specific company */
export const fetchCompanyParkingLots = async (companyId: string): Promise<ParkingLot[]> => {
  const { data: lotsData, error: lotsError } = await supabase
    .from('parking_lots')
    .select('*')
    .eq('company_id', companyId);

  if (lotsError || !lotsData) {
    console.error('Error fetching company parking lots:', lotsError);
    return [];
  }

  const { data: spotsData, error: spotsError } = await supabase
    .from('parking_spots')
    .select('*');

  if (spotsError || !spotsData) {
    console.error('Error fetching parking spots:', spotsError);
    return [];
  }

  const parkingLots: ParkingLot[] = lotsData.map((lot: any) => {
    const lotSpots = spotsData.filter((s: any) => s.lot_id === lot.id);
    const freeSpotsCount = lotSpots.filter((s: any) => s.status === 'Libre').length;
    const mappedSpots = lotSpots.map((s: any) => ({
      id: s.id,
      label: s.label,
      status: (s.status === 'Libre' ? 'free' : 'occupied') as SpotStatus,
    }));

    const ratio = lot.total_capacity > 0 ? freeSpotsCount / lot.total_capacity : 0;
    let availabilityLevel: AvailabilityLevel = 'high';
    if (freeSpotsCount === 0) availabilityLevel = 'full';
    else if (ratio < 0.2) availabilityLevel = 'low';
    else if (ratio < 0.5) availabilityLevel = 'medium';

    return {
      id: lot.id,
      name: lot.name,
      address: lot.address || lot.name,
      coordinates: {
        latitude: lot.latitude,
        longitude: lot.longitude,
      },
      totalSpots: lot.total_capacity,
      freeSpots: freeSpotsCount,
      pricePerHour: lot.price_per_hour || 0,
      rating: 4.5,
      distanceKm: 0,
      floors: [
        {
          label: 'Niveau 0',
          spots: mappedSpots,
        }
      ],
      availabilityLevel,
      approved: lot.approved,
      companyId: lot.company_id,
      description: lot.description,
      phone: lot.phone,
    };
  });

  return parkingLots;
};

/** Fetches all pending (unapproved) parking lots for admin review */
export const fetchPendingParkingLots = async (): Promise<ParkingLot[]> => {
  const { data: lotsData, error: lotsError } = await supabase
    .from('parking_lots')
    .select('*')
    .eq('approved', false);

  if (lotsError || !lotsData) {
    console.error('Error fetching pending parking lots:', lotsError);
    return [];
  }

  const parkingLots: ParkingLot[] = lotsData.map((lot: any) => ({
    id: lot.id,
    name: lot.name,
    address: lot.address || lot.name,
    coordinates: { latitude: lot.latitude, longitude: lot.longitude },
    totalSpots: lot.total_capacity,
    freeSpots: lot.total_capacity,
    pricePerHour: lot.price_per_hour || 0,
    rating: 0,
    distanceKm: 0,
    floors: [],
    availabilityLevel: 'medium',
    approved: lot.approved,
    companyId: lot.company_id,
    description: lot.description,
    phone: lot.phone,
  }));

  return parkingLots;
};

/** Create a new parking lot (for company users) */
export const createParkingLot = async (lot: {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  total_capacity: number;
  price_per_hour: number;
  description: string;
  company_id: string;
  phone?: string;
}): Promise<{ data: any; error: any }> => {
  const { data, error } = await supabase.from('parking_lots').insert([{
    name: lot.name,
    address: lot.address,
    latitude: lot.latitude,
    longitude: lot.longitude,
    total_capacity: lot.total_capacity,
    price_per_hour: lot.price_per_hour,
    description: lot.description,
    company_id: lot.company_id,
    phone: lot.phone || null,
    approved: false,
  }]).select().single();

  return { data, error };
};

/** Approve or reject a parking lot (admin only) */
export const updateParkingLotApproval = async (lotId: string, approved: boolean): Promise<{ error: any }> => {
  const { error } = await supabase
    .from('parking_lots')
    .update({ approved })
    .eq('id', lotId);

  return { error };
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

  const allSpots = updatedFloors.reduce((acc, f) => acc.concat(f.spots), [] as typeof updatedFloors[0]['spots']);
  const newFree  = allSpots.filter(s => s.status === 'free').length;
  const ratio    = allSpots.length > 0 ? newFree / allSpots.length : 0;
  const level: AvailabilityLevel = newFree === 0 ? 'full'
                 : ratio < 0.2   ? 'low'
                 : ratio < 0.5   ? 'medium' : 'high';

  return { ...lot, floors: updatedFloors, freeSpots: newFree, availabilityLevel: level };
};
