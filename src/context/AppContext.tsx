import React, {
  createContext, useContext, useState,
  useEffect, useCallback, useRef, ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Coordinates, ParkingLot, ParkedCar,
  NavigationSession, UserProfile,
} from '../types';
import { fetchParkingLots, simulateLiveUpdate } from '../services/parkingService';
import { MOCK_USER, DEFAULT_FAVOURITE_IDS } from '../services/mockData';
import Paho from 'paho-mqtt';

const PARKED_KEY = 'parksense.parkedCar';

interface ParkCarInput {
  carName?: string;
  lotName?: string;
  floor?: string;
  spotLabel?: string;
}

// ─── Shape ───────────────────────────────────────────────────────────────────
interface AppContextValue {
  lots: ParkingLot[];
  isLoading: boolean;
  refreshLots: () => void;
  favouriteIds: string[];
  toggleFavourite: (id: string) => void;
  isFavourite: (id: string) => boolean;
  favouriteLots: ParkingLot[];
  navSession: NavigationSession | null;
  startNavigation: (s: NavigationSession) => void;
  clearNavigation: () => void;
  parkedCar: ParkedCar | null;
  parkCar: (coords: Coordinates, info?: ParkCarInput) => void;
  unparkCar: () => void;
  user: UserProfile;
  espSpotStatus: 'Libre' | 'Occupee' | 'Loading';
}

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────
export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [favouriteIds, setFavouriteIds] = useState<string[]>(DEFAULT_FAVOURITE_IDS);
  const [navSession, setNavSession] = useState<NavigationSession | null>(null);
  const [parkedCar, setParkedCar] = useState<ParkedCar | null>(null);
  const [user] = useState<UserProfile>(MOCK_USER);
  // Track status for each of the 4 ESP32-controlled spots
  const [espSpotStatus, setEspSpotStatus] = useState<'Libre' | 'Occupee' | 'Loading'>('Loading');

  // Initial fetch
  const loadLots = useCallback(async () => {
    setIsLoading(true);
    try { setLots(await fetchParkingLots()); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { loadLots(); }, [loadLots]);

  // Hydrate parkedCar from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(PARKED_KEY).then(json => {
      if (!json) return;
      try {
        const obj = JSON.parse(json);
        setParkedCar({ ...obj, parkedAt: new Date(obj.parkedAt) });
      } catch {/* corrupted — ignore */ }
    });
  }, []);

  // IoT live updates every 8 s
  useEffect(() => {
    if (!lots.length) return;
    const id = setInterval(
      () => setLots(prev => prev.map(simulateLiveUpdate)),
      8000,
    );
    return () => clearInterval(id);
  }, [lots.length]);

  // Update the esp32-lot when any spot status changes via MQTT
  const updateEsp32Spot = useCallback((spotId: string, newStatus: 'free' | 'occupied') => {
    setLots(prev => prev.map(lot => {
      if (lot.id !== 'esp32-lot') return lot;
      const updatedFloors = lot.floors.map(floor => ({
        ...floor,
        spots: floor.spots.map(spot =>
          spot.id === spotId ? { ...spot, status: newStatus } : spot
        ),
      }));
      const allSpots = updatedFloors.flatMap(f => f.spots);
      const newFreeCount = allSpots.filter(s => s.status === 'free').length;
      const ratio = newFreeCount / allSpots.length;
      const level = newFreeCount === 0 ? 'full'
                  : newFreeCount === 1  ? 'low'
                  :                       'high';
      return { ...lot, floors: updatedFloors, freeSpots: newFreeCount, availabilityLevel: level };
    }));
  }, []);

  // Keep a ref so the MQTT handler always sees the latest function
  const updateEsp32SpotRef = useRef(updateEsp32Spot);
  useEffect(() => { updateEsp32SpotRef.current = updateEsp32Spot; }, [updateEsp32Spot]);

  // MQTT Connection for ESP32
  useEffect(() => {
    const clientId = `ParkSenseApp_${Math.random().toString(16).slice(2, 10)}`;
    const client = new Paho.Client('broker.emqx.io', 8084, '/mqtt', clientId);

    const SPOT_TOPICS: Record<string, string> = {
      'parkwize/place1': 'A1',
      'parkwize/place2': 'A2',
      'parkwize/place3': 'A3',
      'parkwize/place4': 'A4',
    };

    client.onConnectionLost = (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log('MQTT Connection Lost:', responseObject.errorMessage);
      }
    };

    client.onMessageArrived = (message) => {
      const payload = message.payloadString.trim();
      const spotId = SPOT_TOPICS[message.destinationName];
      if (spotId && (payload === 'Libre' || payload === 'Occupee')) {
        updateEsp32SpotRef.current(spotId, payload === 'Libre' ? 'free' : 'occupied');
        if (spotId === 'A1') setEspSpotStatus(payload as 'Libre' | 'Occupee');
      }
    };

    client.connect({
      onSuccess: () => {
        console.log('MQTT Connected to HiveMQ!');
        Object.keys(SPOT_TOPICS).forEach(t => client.subscribe(t));
      },
      onFailure: (err) => {
        console.log('MQTT Connection Failed:', err.errorMessage);
      },
      useSSL: true,
      timeout: 3,
    });

    return () => {
      try {
        if (client.isConnected()) client.disconnect();
      } catch (e) { /* ignore */ }
    };
  }, []); // runs once — uses ref to always access latest update function

  // Favourites
  const toggleFavourite = useCallback((id: string) =>
    setFavouriteIds(p => p.includes(id) ? p.filter(f => f !== id) : [...p, id])
    , []);
  const isFavourite = useCallback((id: string) => favouriteIds.includes(id), [favouriteIds]);
  const favouriteLots = lots.filter(l => favouriteIds.includes(l.id));

  // Navigation session
  const startNavigation = useCallback((s: NavigationSession) => setNavSession(s), []);
  const clearNavigation = useCallback(() => setNavSession(null), []);

  // Park / unpark
  const parkCar = useCallback((coords: Coordinates, info: ParkCarInput = {}) => {
    const car: ParkedCar = {
      carName: info.carName ?? 'My Car',
      lotName: info.lotName ?? 'On-street parking',
      floor: info.floor,
      spotLabel: info.spotLabel,
      parkedAt: new Date(),
      coordinates: coords,
    };
    setParkedCar(car);
    AsyncStorage.setItem(PARKED_KEY, JSON.stringify(car)).catch(() => { });
  }, []);

  const unparkCar = useCallback(() => {
    setParkedCar(null);
    AsyncStorage.removeItem(PARKED_KEY).catch(() => { });
  }, []);

  return (
    <AppContext.Provider value={{
      lots, isLoading, refreshLots: loadLots,
      favouriteIds, toggleFavourite, isFavourite, favouriteLots,
      navSession, startNavigation, clearNavigation,
      parkedCar, parkCar, unparkCar, user, espSpotStatus,
    }}>
      {children}
    </AppContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────
export const useApp = (): AppContextValue => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
