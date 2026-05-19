import React, {
  createContext, useContext, useState,
  useEffect, useCallback, ReactNode,
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

  // Sync espSpotStatus with the esp32-lot spots (specifically spot A1)
  useEffect(() => {
    if (espSpotStatus === 'Loading') return;
    setLots(prev => prev.map(lot => {
      if (lot.id === 'esp32-lot') {
        const isFree = espSpotStatus === 'Libre';
        const newStatus: 'free' | 'occupied' = isFree ? 'free' : 'occupied';
        const updatedFloors = lot.floors.map(floor => ({
          ...floor,
          spots: floor.spots.map(spot => {
            if (spot.id === 'A1') {
              return { ...spot, status: newStatus };
            }
            return spot;
          })
        }));

        return {
          ...lot,
          floors: updatedFloors,
          freeSpots: isFree ? 1 : 0,
          // 'high' = green (available), 'low' = red (almost full / full)
          availabilityLevel: isFree ? 'high' : 'low',
        };
      }
      return lot;
    }));
  }, [espSpotStatus]);

  // MQTT Connection for ESP32
  useEffect(() => {
    // Unique client ID to prevent connection drops
    const clientId = `ParkSenseApp_${Math.random().toString(16).slice(2, 10)}`;
    const client = new Paho.Client('broker.hivemq.com', 8000, '/mqtt', clientId);

    client.onConnectionLost = (responseObject) => {
      if (responseObject.errorCode !== 0) {
        console.log('MQTT Connection Lost:', responseObject.errorMessage);
      }
    };

    client.onMessageArrived = (message) => {
      const payload = message.payloadString.trim();
      if (payload === 'Libre' || payload === 'Occupee') {
        setEspSpotStatus(payload as 'Libre' | 'Occupee');
      }
    };

    client.connect({
      onSuccess: () => {
        console.log('MQTT Connected to HiveMQ!');
        client.subscribe('parkwize/place1');
      },
      onFailure: (err) => {
        console.log('MQTT Connection Failed:', err.errorMessage);
      },
      useSSL: false,
      timeout: 3,
    });

    return () => {
      try {
        if (client.isConnected()) {
          client.disconnect();
        }
      } catch (e) {
        // Ignore disconnect errors
      }
    };
  }, []);

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
