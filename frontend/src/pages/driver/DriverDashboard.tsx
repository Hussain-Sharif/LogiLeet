import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DeliveryMap } from '@/components/maps/DeliveryMap';

export default function DriverDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-active-deliveries'],
    queryFn: async () => (await api.get('/tracking/driver/active-deliveries')).data.data
  });

  const deliveries = data?.activeDeliveries || [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Driver Dashboard</h1>
      {isLoading ? 'Loading...' : deliveries.length === 0 ? 'No active deliveries' : deliveries.map((d: any) => (
        <div key={d._id} className="rounded border p-4 space-y-3">
          <div className="flex justify-between">
            <div>
              <p className="font-medium">Delivery #{d._id.slice(-6)}</p>
              <p className="text-sm opacity-70">Status: {d.status}</p>
            </div>
            <div className="text-sm">
              {d.customerId?.name} • {d.vehicleId?.vehicleNumber}
            </div>
          </div>
          <DeliveryMap
            pickup={{ lat: d.pickup.latitude, lng: d.pickup.longitude }}
            dropoff={{ lat: d.dropoff.latitude, lng: d.dropoff.longitude }}
            driver={d.currentLocation ? { lat: d.currentLocation.latitude, lng: d.currentLocation.longitude } : null}
            height="300px"
          />
        </div>
      ))}
    </div>
  );
}
