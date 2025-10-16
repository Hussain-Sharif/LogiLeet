import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DeliveryMap } from '@/components/maps/DeliveryMap';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';

export default function TrackDelivery() {
  const { id } = useParams();
  const { data, isLoading } = useQuery({
    queryKey: ['delivery', id],
    queryFn: async () => (await api.get(`/tracking/deliveries/${id}/live`)).data.data,
    enabled: Boolean(id)
  });

  const live = useDeliveryTracking(id);

  if (isLoading) return <div className="p-4">Loading...</div>;
  const delivery = data?.delivery;
  const pickup = { lat: delivery.pickup.latitude, lng: delivery.pickup.longitude };
  const dropoff = { lat: delivery.dropoff.latitude, lng: delivery.dropoff.longitude };
  const driver = live ? { lat: live.latitude, lng: live.longitude } : data?.currentLocation ? { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude } : null;

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Track Delivery #{delivery._id.slice(-6)}</h1>
      <DeliveryMap pickup={pickup} dropoff={dropoff} driver={driver} height="400px" />
      <div className="text-sm opacity-70">
        Status: {delivery.status} • Last update: {data?.lastUpdate ? new Date(data.lastUpdate).toLocaleTimeString() : 'N/A'}
      </div>
    </div>
  );
}
