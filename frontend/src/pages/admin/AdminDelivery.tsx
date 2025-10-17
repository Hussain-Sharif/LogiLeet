import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DeliveryMap } from '@/components/maps/DeliveryMap';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';
import StatusTimeline from '@/components/deliveries/StatusTimeline';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';

export default function AdminDelivery() {
  const { id } = useParams();
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-delivery-live', id],
    queryFn: async () => (await api.get(`/tracking/deliveries/${id}/live`)).data.data,
    enabled: Boolean(id),
    refetchInterval: 10000
  });

  const live:any = useDeliveryTracking(id);

  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data?.delivery) return <div className="p-6">Delivery not found</div>;

  const d = data.delivery;
  const pickup = { lat: d.pickup.latitude, lng: d.pickup.longitude };
  const dropoff = { lat: d.dropoff.latitude, lng: d.dropoff.longitude };
  const driver = live ? { lat: live.latitude, lng: live.longitude } 
    : data.currentLocation ? { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude } 
    : null;
  const routePath = d.route?.waypoints || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Monitor Delivery #{d._id.slice(-8)}</h1>
          <div className="text-sm text-gray-600">{d.pickup.address} → {d.dropoff.address}</div>
        </div>
        <Link to="/admin/deliveries" className="text-blue-600">Back to list</Link>
      </div>

      {/* Live Metrics */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Status</div>
          <div className="mt-1"><DeliveryStatusBadge status={d.status} /></div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Driver</div>
          <div className="font-medium">{d.driverId?.name || 'Not assigned'}</div>
        </div>
        <div className="rounded border bg-white p-4">
          <div className="text-sm text-gray-600">Vehicle</div>
          <div className="font-medium">{d.vehicleId?.vehicleNumber || 'Not assigned'}</div>
        </div>
      </div>

      <div className="rounded border bg-white p-4">
        <StatusTimeline d={d} />
      </div>

      <div className="rounded border bg-white">
        <div className="p-4 border-b">
          <div className="font-medium">Live Map</div>
          <div className="text-sm text-gray-600">
            {d.status === 'on_route' ? 'Live tracking active' : 'Route will be shown when delivery is active'}
          </div>
        </div>
        <DeliveryMap pickup={pickup} dropoff={dropoff} driver={driver} routePath={routePath} height="480px" />
      </div>
    </div>
  );
}
