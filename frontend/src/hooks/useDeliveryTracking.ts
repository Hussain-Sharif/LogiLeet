import { useEffect, useState } from 'react';
import { useSocket } from './useSocket';

export interface DriverLocation {
  latitude: number;
  longitude: number;
  speed?: number;
  timestamp?: string;
  status?: 'moving' | 'stopped' | 'at_pickup' | 'at_dropoff' | 'idle';
}

export const useDeliveryTracking = (deliveryId?: string) => {
  const socket = useSocket();
  const [location, setLocation] = useState<DriverLocation | null>(null);

  useEffect(() => {
    if (!deliveryId) return;
    socket.emit('join-delivery', deliveryId);

    const handler = (data: any) => {
      setLocation({
        latitude: data.location?.latitude,
        longitude: data.location?.longitude,
        speed: data.location?.speed,
        status: data.status,
        timestamp: data.timestamp
      });
    };

    socket.on('location-update', handler);

    return () => {
      socket.off('location-update', handler);
      socket.emit('leave-delivery', deliveryId);
    };
  }, [deliveryId, socket]);

  return location;
};
