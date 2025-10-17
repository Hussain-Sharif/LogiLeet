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
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!deliveryId) return;

    console.log(`🔌 Joining delivery room: ${deliveryId}`);
    socket.emit('join-delivery', deliveryId);
    setIsConnected(true);

    const locationHandler = (data: any) => {
      console.log('📍 Live location update received:', data);
      if (data.deliveryId === deliveryId) {
        setLocation({
          latitude: data.location?.latitude,
          longitude: data.location?.longitude,
          speed: data.location?.speed,
          status: data.status,
          timestamp: data.timestamp
        });
      }
    };

    const statusHandler = (data: any) => {
      console.log('📊 Status update received:', data);
    };

    socket.on('location-update', locationHandler);
    socket.on('status-update', statusHandler);

    return () => {
      console.log(`🔌 Leaving delivery room: ${deliveryId}`);
      socket.off('location-update', locationHandler);
      socket.off('status-update', statusHandler);
      socket.emit('leave-delivery', deliveryId);
      setIsConnected(false);
    };
  }, [deliveryId, socket]);

  return { location, isConnected };
};
