import { ParkingLot, UserProfile, ParkedCar, NavigationSession } from '../types';

// ─── Parking Lots (5 lots around Casablanca) ─────────────────────────────────
export const PARKING_LOTS: ParkingLot[] = [
  {
    id: 'lot-1',
    name: 'Twin Center Parking',
    address: 'Bd Zerktouni, Maârif',
    coordinates: { latitude: 33.5814, longitude: -7.6257 },
    totalSpots: 120, freeSpots: 84, pricePerHour: 12,
    rating: 4.6, distanceKm: 0.3, availabilityLevel: 'high',
    floors: [
      { label: 'Floor A', spots: [
        { id: 'A1', label: 'A1', status: 'free'     },
        { id: 'A2', label: 'A2', status: 'free'     },
        { id: 'A3', label: 'A3', status: 'occupied' },
        { id: 'A4', label: 'A4', status: 'occupied' },
        { id: 'A5', label: 'A5', status: 'free'     },
      ]},
      { label: 'Floor B', spots: [
        { id: 'B1', label: 'B1', status: 'occupied' },
        { id: 'B2', label: 'B2', status: 'free'     },
        { id: 'B3', label: 'B3', status: 'free'     },
        { id: 'B4', label: 'B4', status: 'free'     },
        { id: 'B5', label: 'B5', status: 'occupied' },
      ]},
      { label: 'Floor C', spots: [
        { id: 'C1', label: 'C1', status: 'free'     },
        { id: 'C2', label: 'C2', status: 'free'     },
        { id: 'C3', label: 'C3', status: 'ev'       },
        { id: 'C4', label: 'C4', status: 'occupied' },
        { id: 'C5', label: 'C5', status: 'free'     },
      ]},
    ],
  },
  {
    id: 'lot-2',
    name: 'Place Mohammed V',
    address: 'Centre-Ville, Casablanca',
    coordinates: { latitude: 33.5945, longitude: -7.6190 },
    totalSpots: 200, freeSpots: 38, pricePerHour: 10,
    rating: 4.1, distanceKm: 1.5, availabilityLevel: 'medium',
    floors: [
      { label: 'Floor A', spots: [
        { id: 'A1', label: 'A1', status: 'occupied' },
        { id: 'A2', label: 'A2', status: 'free'     },
        { id: 'A3', label: 'A3', status: 'occupied' },
        { id: 'A4', label: 'A4', status: 'occupied' },
        { id: 'A5', label: 'A5', status: 'occupied' },
      ]},
    ],
  },
  {
    id: 'lot-3',
    name: 'Casa-Port Station',
    address: 'Bd Houphouët Boigny',
    coordinates: { latitude: 33.6006, longitude: -7.6166 },
    totalSpots: 350, freeSpots: 4, pricePerHour: 15,
    rating: 4.4, distanceKm: 2.5, availabilityLevel: 'full',
    floors: [
      { label: 'Floor B', spots: [
        { id: 'B1', label: 'B1', status: 'occupied' },
        { id: 'B2', label: 'B2', status: 'occupied' },
        { id: 'B3', label: 'B3', status: 'occupied' },
        { id: 'B4', label: 'B4', status: 'free'     },
        { id: 'B5', label: 'B5', status: 'occupied' },
      ]},
    ],
  },
  {
    id: 'lot-4',
    name: 'Anfa Place Shopping',
    address: 'Bd de la Corniche, Aïn Diab',
    coordinates: { latitude: 33.5859, longitude: -7.6798 },
    totalSpots: 180, freeSpots: 112, pricePerHour: 8,
    rating: 4.5, distanceKm: 5.0, availabilityLevel: 'high',
    floors: [
      { label: 'Floor A', spots: [
        { id: 'A1', label: 'A1', status: 'free'     },
        { id: 'A2', label: 'A2', status: 'free'     },
        { id: 'A3', label: 'A3', status: 'free'     },
        { id: 'A4', label: 'A4', status: 'occupied' },
        { id: 'A5', label: 'A5', status: 'ev'       },
      ]},
    ],
  },
  {
    id: 'lot-5',
    name: 'Morocco Mall',
    address: 'Bd de la Corniche, Aïn Diab',
    coordinates: { latitude: 33.5896, longitude: -7.6892 },
    totalSpots: 600, freeSpots: 215, pricePerHour: 5,
    rating: 4.7, distanceKm: 6.0, availabilityLevel: 'medium',
    floors: [
      { label: 'Floor A', spots: [
        { id: 'A1', label: 'A1', status: 'free'     },
        { id: 'A2', label: 'A2', status: 'occupied' },
        { id: 'A3', label: 'A3', status: 'occupied' },
        { id: 'A4', label: 'A4', status: 'free'     },
        { id: 'A5', label: 'A5', status: 'occupied' },
      ]},
    ],
  },
  {
    id: 'esp32-lot',
    name: 'Parking ParkSense (ESP32)',
    address: 'À proximité de votre position',
    coordinates: { latitude: 33.5840, longitude: -7.6240 },
    totalSpots: 6, freeSpots: 4, pricePerHour: 5,
    rating: 5.0, distanceKm: 0.3, availabilityLevel: 'medium',
    floors: [
      { label: 'Floor A', spots: [
        { id: 'A1', label: 'A1', status: 'free'     },
        { id: 'A2', label: 'A2', status: 'free'     },
        { id: 'A3', label: 'A3', status: 'free'     },
        { id: 'A4', label: 'A4', status: 'free'     },
        { id: 'A5', label: 'A5', status: 'occupied' },
        { id: 'A6', label: 'A6', status: 'occupied' },
      ]},
    ],
  },
];

// ─── User ─────────────────────────────────────────────────────────────────────
export const MOCK_USER: UserProfile = {
  name: 'Yassine Benali', email: 'yassine.benali@email.ma',
  initials: 'YB', tier: 'Premium',
  totalSessions: 47, totalSpent: 2900, avgSessionHours: 6.2,
  paymentCard: { type: 'CMI Visa', last4: '4821' },
  savedLocations: [
    { id: 'l1', label: 'Home',   address: 'Bd d\'Anfa 42, Casablanca', icon: '🏠' },
    { id: 'l2', label: 'Office', address: 'Bd Zerktouni 34, Maârif',   icon: '💼' },
  ],
};

// ─── Parked car ───────────────────────────────────────────────────────────────
// Sample only — the real parked-car state is captured at runtime when the
// user taps "Park my car here" on the FindCar screen.
export const MOCK_PARKED_CAR: ParkedCar = {
  carName: 'Dacia Logan', lotName: 'Twin Center Parking',
  floor: 'Floor B', spotLabel: 'B-07',
  parkedAt: new Date(Date.now() - 84 * 60 * 1000),
  coordinates: { latitude: 33.5818, longitude: -7.6253 },
};

// ─── Build a navigation session for any lot ───────────────────────────────────
export const buildNavSession = (lot: ParkingLot): NavigationSession => ({
  destinationLot: lot,
  etaMinutes: 6, distanceKm: 1.2, arrivalTime: '9:47',
  currentInstruction: 'Turn right on Bd Zerktouni',
  currentDetail: 'In 120m · Continue 0.4 km',
  steps: [
    { id: 's1', instruction: 'Start on Bd d\'Anfa',         detail: 'Head east · 200m',             status: 'completed' },
    { id: 's2', instruction: 'Turn right → Bd Zerktouni',   detail: 'In 120m · 0.4km on this road', status: 'active'    },
    { id: 's3', instruction: 'Turn left → Bd Mohammed V',   detail: '400m ahead',                   status: 'upcoming'  },
    { id: 's4', instruction: `Enter ${lot.name}`,           detail: 'Gate 2 · Follow signs',         status: 'upcoming'  },
  ],
});

// ─── Default favourite IDs ────────────────────────────────────────────────────
export const DEFAULT_FAVOURITE_IDS = ['lot-1', 'lot-2', 'lot-5'];

// ─── Mock user GPS (Maârif, Casablanca) ───────────────────────────────────────
export const USER_LOCATION = { latitude: 33.5816, longitude: -7.6261 };
