import { GoogleMap, Marker, Polyline, useJsApiLoader } from '@react-google-maps/api';
import { ENV } from '@/lib/env';

type LatLng = { lat: number; lng: number };

interface Props {
  pickup: LatLng;
  dropoff: LatLng;
  driver?: LatLng | null;
  routePath?: LatLng[];
  height?: string;
}

const containerStyle = { width: '100%', height: '100%' };

export function DeliveryMap({ pickup, dropoff, driver, routePath = [], height = '400px' }: Props) {
  const { isLoaded } = useJsApiLoader({ id: 'google-map-script', googleMapsApiKey: ENV.GOOGLE_MAPS_API_KEY });

  if (!isLoaded) return <div className="w-full" style={{ height }}>Loading map...</div>;

  const center = driver || pickup || dropoff;

  return (
    <div className="w-full rounded-md border" style={{ height }}>
      <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={12}>
        {/* Pickup */}
        <Marker position={pickup} label="P" />
        {/* Dropoff */}
        <Marker position={dropoff} label="D" />
        {/* Driver */}
        {driver && <Marker position={driver} label="🚚" />}

        {/* Route */}
        {routePath.length > 0 && (
          <Polyline path={routePath} options={{ strokeColor: '#2563eb', strokeOpacity: 0.9, strokeWeight: 4 }} />
        )}
      </GoogleMap>
    </div>
  );
}
