import { useEffect, useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Coordinates } from '../types';
import { USER_LOCATION } from '../services/mockData';

type Status = 'idle' | 'loading' | 'granted' | 'denied' | 'error';

export interface UserLocationState {
  coords:    Coordinates;
  status:    Status;
  isReal:    boolean;
  refresh:   () => Promise<void>;
}

export const useUserLocation = (): UserLocationState => {
  const [coords, setCoords] = useState<Coordinates>(USER_LOCATION);
  const [status, setStatus] = useState<Status>('idle');
  const [isReal, setIsReal] = useState(false);

  const refresh = useCallback(async () => {
    setStatus('loading');
    try {
      const { status: perm } = await Location.requestForegroundPermissionsAsync();
      if (perm !== 'granted') { setStatus('denied'); return; }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      setIsReal(true);
      setStatus('granted');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { coords, status, isReal, refresh };
};
