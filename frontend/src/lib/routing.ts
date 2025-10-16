// frontend/src/lib/routing.ts
import { services } from '@tomtom-international/web-sdk-services';

export const calculateRoute = async (pickup: any, dropoff: any) => {
  try {
    const response = await services.calculateRoute({
      key: import.meta.env.VITE_TOMTOM_API_KEY,
      locations: `${pickup.lng},${pickup.lat}:${dropoff.lng},${dropoff.lat}`
    });
    
    return response.routes[0].legs[0].points.map((point: any) => ({
      lat: point.latitude,
      lng: point.longitude
    }));
  } catch (error) {
    console.error('Routing error:', error);
    return [pickup, dropoff]; // Fallback to straight line
  }
};
