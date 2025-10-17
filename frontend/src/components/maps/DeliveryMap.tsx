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
  // Validate coordinates
  if (!pickup || !dropoff || isNaN(pickup.lat) || isNaN(pickup.lng) || isNaN(dropoff.lat) || isNaN(dropoff.lng)) {
    return (
      <div className="w-full flex items-center justify-center bg-gray-100 rounded-lg" style={{ height }}>
        <div className="text-center text-gray-600">
          <div className="text-3xl mb-2">🗺️</div>
          <p>Invalid location data</p>
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
  const pathPositions: [number, number][] = routePath.map(p => [p.lat, p.lng]);

  return (
    <div className="w-full rounded-lg border overflow-hidden" style={{ height }}>
      <MapContainer
        center={center}
        zoom={11}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* Pickup Marker */}
        <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}>
          <Popup>
            <div>
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
            <div>
              <strong className="text-red-600">🎯 Dropoff Location</strong>
              <div className="text-sm text-gray-600">
                {dropoff.lat.toFixed(4)}, {dropoff.lng.toFixed(4)}
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Driver Marker */}
        {driver && (
          <Marker position={[driver.lat, driver.lng]} icon={driverIcon}>
            <Popup>
              <div>
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
      </MapContainer>
    </div>
  );
}
