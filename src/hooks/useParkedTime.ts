import { useState, useEffect } from 'react';
import { ParkedCar } from '../types';

const RATE = 12; // DH/hr

export const useParkedTime = (car: ParkedCar | null) => {
  const [elapsed, setElapsed] = useState(0); // ms

  useEffect(() => {
    if (!car) return;
    const tick = () => setElapsed(Date.now() - car.parkedAt.getTime());
    tick();
    const id = setInterval(tick, 10_000);
    return () => clearInterval(id);
  }, [car]);

  const totalMins = Math.floor(elapsed / 60_000);
  const hours     = Math.floor(totalMins / 60);
  const minutes   = totalMins % 60;
  const display   = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  const cost      = parseFloat(((totalMins / 60) * RATE).toFixed(2));

  return { hours, minutes, display, cost };
};
