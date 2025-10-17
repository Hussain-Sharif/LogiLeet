import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L, { type LatLngExpression } from 'leaflet';
import { useEffect } from 'react';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface Props {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };  
  driver?: { lat: number; lng: number } | null;
  routePath?: Array<{ lat: number; lng: number }>;
  height?: string;
}

function MapController({ pickup, dropoff, driver, routePath = [] }: any) {
  const map = useMap();
  
  useEffect(() => {
    const bounds = L.latLngBounds([]);
    bounds.extend([pickup.lat, pickup.lng]);
    bounds.extend([dropoff.lat, dropoff.lng]);
    if (driver) bounds.extend([driver.lat, driver.lng]);
    if (routePath.length > 0) {
      routePath.forEach((point: any) => bounds.extend([point.lat, point.lng]));
    }
    
    map.fitBounds(bounds, { padding: [20, 20] });
  }, [pickup, dropoff, driver, routePath, map]);
  
  return null;
}

export function DeliveryMap({ pickup, dropoff, driver, routePath = [], height = '400px' }: Props) {
  const pickupIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const dropoffIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const driverIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [1, -34],
    shadowSize: [45, 45]
  });

  const routePositions: LatLngExpression[] = routePath.map(p => [p.lat, p.lng]);

  return (
    <div className="w-full rounded-lg border overflow-hidden" style={{ height }}>
      <MapContainer
        style={{ height: '100%', width: '100%' }}
        center={[pickup.lat, pickup.lng]}
        zoom={12}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Pickup Marker */}
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>
            <div className="text-center">
              <div className="font-semibold text-green-600">📍 Pickup Location</div>
              <div className="text-xs text-gray-600">{pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}</div>
            </div>
          </Popup>
        </Marker>

        {/* Dropoff Marker */}
        <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
          <Popup>
            <div className="text-center">
              <div className="font-semibold text-red-600">🎯 Dropoff Location</div>
              <div className="text-xs text-gray-600">{dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}</div>
            </div>
          </Popup>
        </Marker>

        {/* Driver Marker */}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>
              <div className="text-center">
                <div className="font-semibold text-blue-600">🚚 Driver Location</div>
                <div className="text-xs text-green-600">● Live Tracking</div>
                <div className="text-xs text-gray-600">{driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}</div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Route Path */}
        {routePositions.length > 1 && (
          <Polyline 
            positions={routePositions} 
            pathOptions={{ 
              color: '#2563eb', 
              weight: 5, 
              opacity: 0.8,
              dashArray: driver ? undefined : '10, 10' // Dashed line if no driver yet
            }} 
          />
        )}

        <MapController pickup={pickup} dropoff={dropoff} driver={driver} routePath={routePath} />
      </MapContainer>
    </div>
  );
}
