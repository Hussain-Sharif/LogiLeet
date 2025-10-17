import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default icon issue
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

L.Marker.prototype.options.icon = defaultIcon;

interface Props {
  pickup: { lat: number; lng: number };
  dropoff: { lat: number; lng: number };  
  driver?: { lat: number; lng: number } | null;
  routePath?: Array<{ lat: number; lng: number }>;
  height?: string;
}

export function DeliveryMap({ pickup, dropoff, driver, routePath = [], height = '400px' }: Props) {
  // Debug log
  console.log('DeliveryMap received props:', { pickup, dropoff, driver, routePath });

  // Validate coordinates
  const isValidCoord = (coord: any) => {
    return coord && 
           typeof coord.lat === 'number' && 
           typeof coord.lng === 'number' &&
           !isNaN(coord.lat) && 
           !isNaN(coord.lng) &&
           coord.lat >= -90 && coord.lat <= 90 &&
           coord.lng >= -180 && coord.lng <= 180;
  };

  if (!isValidCoord(pickup) || !isValidCoord(dropoff)) {
    console.error('Invalid coordinates:', { pickup, dropoff });
    return (
      <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center text-gray-600">
          <div className="text-4xl mb-4">🗺️</div>
          <p className="font-medium">Map Loading Error</p>
          <p className="text-sm">Invalid location coordinates</p>
          <div className="text-xs mt-2 bg-red-50 p-2 rounded">
            <div>Pickup: {JSON.stringify(pickup)}</div>
            <div>Dropoff: {JSON.stringify(dropoff)}</div>
          </div>
        </div>
      </div>
    );
  }

  const pickupIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const dropoffIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const driverIcon = L.icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [30, 45],
    iconAnchor: [15, 45],
    popupAnchor: [1, -34],
    shadowSize: [45, 45]
  });

  // Calculate center point
  const center: [number, number] = [
    (pickup.lat + dropoff.lat) / 2,
    (pickup.lng + dropoff.lng) / 2
  ];

  // Route path for polyline
  const pathPositions: [number, number][] = routePath
    .filter(p => isValidCoord(p))
    .map(p => [p.lat, p.lng]);

  console.log('Map rendering with center:', center);

  try {
    return (
      <div className="w-full rounded-lg border overflow-hidden" style={{ height }}>
        <MapContainer
          center={center}
          zoom={11}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          key={`${pickup.lat}-${pickup.lng}-${dropoff.lat}-${dropoff.lng}`} // Force re-render on prop change
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />

          {/* Pickup Marker */}
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-green-600">📍 Pickup Location</strong>
                <div className="text-sm text-gray-600">
                  {pickup.lat.toFixed(4)}, {pickup.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Dropoff Marker */}
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon}>
            <Popup>
              <div className="text-center">
                <strong className="text-red-600">🎯 Dropoff Location</strong>
                <div className="text-sm text-gray-600">
                  {dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>

          {/* Driver Marker */}
          {driver && isValidCoord(driver) && (
            <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
              <Popup>
                <div className="text-center">
                  <strong className="text-blue-600">🚚 Driver Location</strong>
                  <div className="text-sm text-green-600">● Live Tracking Active</div>
                  <div className="text-sm text-gray-600">
                    {driver.lat.toFixed(4)}, {driver.lng.toFixed(4)}
                  </div>
                </div>
              </Popup>
            </Marker>
          )}

          {/* Route Path */}
          {pathPositions.length > 1 && (
            <Polyline 
              positions={pathPositions}
              pathOptions={{
                color: driver ? '#2563eb' : '#94a3b8',
                weight: 5,
                opacity: 0.8,
                dashArray: driver ? undefined : '10, 5'
              }}
            />
          )}
          {/* Map Legend */}
        <div className="absolute top-2 left-2 bg-white bg-opacity-90 rounded p-2 text-xs shadow-md z-[1000]">
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Pickup</span>
          </div>
          <div className="flex items-center gap-1 mb-1">
            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
            <span>Dropoff</span>
          </div>
          {driver && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span>Driver</span>
            </div>
          )}
        </div>
        </MapContainer>

        
      </div>
    );
  } catch (error) {
    console.error('Map rendering error:', error);
    return (
      <div className="w-full flex items-center justify-center bg-red-50 rounded-lg border-2 border-red-200" style={{ height }}>
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">❌</div>
          <p className="font-medium">Map Render Error</p>
          <p className="text-sm">Failed to load map component</p>
        </div>
      </div>
    );
  }
}
