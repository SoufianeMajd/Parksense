// ─── Geo ─────────────────────────────────────────────────────────────────────
export interface Coordinates {
  latitude: number;
  longitude: number;
}

// ─── Spots ───────────────────────────────────────────────────────────────────
export type SpotStatus = 'free' | 'occupied' | 'ev';

export interface ParkingSpot {
  id: string;
  label: string;
  status: SpotStatus;
}

export interface ParkingFloor {
  label: string;
  spots: ParkingSpot[];
}

// ─── Lots ────────────────────────────────────────────────────────────────────
export type AvailabilityLevel = 'high' | 'medium' | 'low' | 'full';

export interface ParkingLot {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  totalSpots: number;
  freeSpots: number;
  pricePerHour: number;
  rating: number;
  distanceKm: number;
  floors: ParkingFloor[];
  availabilityLevel: AvailabilityLevel;
}

// ─── Navigation session ───────────────────────────────────────────────────────
export type StepStatus = 'completed' | 'active' | 'upcoming';

export interface NavStep {
  id: string;
  instruction: string;
  detail: string;
  status: StepStatus;
}

export interface NavigationSession {
  destinationLot: ParkingLot;
  etaMinutes: number;
  distanceKm: number;
  arrivalTime: string;
  currentInstruction: string;
  currentDetail: string;
  steps: NavStep[];
}

// ─── Parked car ───────────────────────────────────────────────────────────────
// Walking distance / time are derived live from the user's current GPS, so
// they're not part of the stored shape.
export interface ParkedCar {
  carName: string;
  lotName: string;
  floor?: string;
  spotLabel?: string;
  parkedAt: Date;
  coordinates: Coordinates;
}

// ─── User ─────────────────────────────────────────────────────────────────────
export interface SavedLocation {
  id: string;
  label: string;
  address: string;
  icon: string;
}

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  tier: 'Premium' | 'Basic';
  totalSessions: number;
  totalSpent: number;
  avgSessionHours: number;
  paymentCard: { type: string; last4: string };
  savedLocations: SavedLocation[];
}

// ─── Navigation param lists ───────────────────────────────────────────────────
export type RootTabParamList = {
  Home:    undefined;
  Map:     undefined;
  FindCar: undefined;
  Admin:   undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  MainTabs:          undefined;
  NavigationScreen:  { lot: ParkingLot };
  Login:             undefined;
  SignUp:            undefined;
};
