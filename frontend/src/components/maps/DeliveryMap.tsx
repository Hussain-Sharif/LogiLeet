import { useEffect, useRef } from 'react';
// @ts-ignore
import * as tt from '@tomtom-international/web-sdk-maps';
import '@tomtom-international/web-sdk-maps/dist/maps.css';

interface Props {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };  
  driver?: { lat: number; lng: number } | null;
  routePath?: Array<{ lat: number; lng: number }>;
  height?: string;
}

export function DeliveryMap({ pickup, dropoff, driver, routePath = [], height = '400px' }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const routeLayer = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstance.current = tt.map({
      key: import.meta.env.VITE_TOMTOM_API_KEY,
      container: mapRef.current,
      style: 'tomtom://vector/1/basic-main',
      center: [pickup.lng, pickup.lat],
      zoom: 11
    });

    // Add pickup marker (green)
    const pickupMarker = new tt.Marker({ color: '#10b981' })
      .setLngLat([pickup.lng, pickup.lat])
      .setPopup(new tt.Popup().setHTML('<div style="padding:8px;"><strong>📍 Pickup Location</strong></div>'))
      .addTo(mapInstance.current);

    // Add dropoff marker (red)
    const dropoffMarker = new tt.Marker({ color: '#ef4444' })
      .setLngLat([dropoff.lng, dropoff.lat])
      .setPopup(new tt.Popup().setHTML('<div style="padding:8px;"><strong>🎯 Dropoff Location</strong></div>'))
      .addTo(mapInstance.current);

    markers.current = [pickupMarker, dropoffMarker];

    // Draw route path if available
    if (routePath.length > 1) {
      const routeCoordinates = routePath.map(point => [point.lng, point.lat]);
      
      mapInstance.current.on('load', () => {
        mapInstance.current.addSource('route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: routeCoordinates
            }
          }
        });

        mapInstance.current.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#2563eb',
            'line-width': 4,
            'line-opacity': 0.8
          }
        });
      });
    }

    // Fit bounds to show all points
    const bounds = new tt.LngLatBounds()
      .extend([pickup.lng, pickup.lat])
      .extend([dropoff.lng, dropoff.lat]);
    
    if (driver) {
      bounds.extend([driver.lng, driver.lat]);
    }
    
    mapInstance.current.fitBounds(bounds, { 
      padding: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    return () => {
      markers.current.forEach(m => m.remove());
      mapInstance.current?.remove();
    };
  }, [pickup.lat, pickup.lng, dropoff.lat, dropoff.lng, routePath]);

  // Update driver location (blue marker with animation)
  useEffect(():any => {
    if (!driver || !mapInstance.current) return;

    const driverMarker = new tt.Marker({ 
      color: '#3b82f6',
      // scale: 1.2
    })
      .setLngLat([driver.lng, driver.lat])
      .setPopup(new tt.Popup().setHTML('<div style="padding:8px;"><strong>🚗 Driver Location</strong><br><small>Live tracking active</small></div>'))
      .addTo(mapInstance.current);

    // Add pulsing effect for live tracking
    const driverElement = driverMarker.getElement();
    driverElement.style.animation = 'pulse 2s infinite';

    markers.current.push(driverMarker);

    return () => driverMarker.remove();
  }, [driver?.lat, driver?.lng]);

  return (
    <div className="relative w-full rounded-lg overflow-hidden" style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Legend */}
      <div className="absolute top-4 left-4 bg-white bg-opacity-95 backdrop-blur-sm rounded-lg p-3 shadow-lg">
        <div className="text-xs space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Dropoff</span>
          </div>
          {driver && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Driver (Live)</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
