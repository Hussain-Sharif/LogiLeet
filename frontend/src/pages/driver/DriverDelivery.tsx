import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DeliveryMap } from '@/components/maps/DeliveryMap';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import toast from 'react-hot-toast';

export default function DriverDelivery() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['driver-delivery', id],
    queryFn: async () => (await api.get(`/tracking/deliveries/${id}/live`)).data.data,
    enabled: Boolean(id),
    refetchInterval: 10000
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, notes }: { status: 'picked_up' | 'on_route' | 'delivered'; notes?: string }) => 
      (await api.put(`/deliveries/${id}/status`, { status, driverNotes: notes })).data.data,
    onSuccess: (res) => {
      toast.success('Status updated');
      qc.invalidateQueries({ queryKey: ['driver-delivery', id] });
      qc.invalidateQueries({ queryKey: ['driver-active'] });
      if (res.delivery.status === 'delivered') nav('/driver');
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Update failed')
  });

  const live:any = useDeliveryTracking(id);
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (!data?.delivery) return <div className="p-6">Delivery not found</div>;

  const d:any = data.delivery;
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
          <h1 className="text-xl font-semibold">Delivery #{d._id.slice(-6)}</h1>
          <div className="text-sm text-gray-600">Customer: {d.customerId?.name} • {d.pickup.address} → {d.dropoff.address}</div>
        </div>
        <Link to="/driver" className="text-blue-600">Back to my deliveries</Link>
      </div>

      <DeliveryMap pickup={pickup} dropoff={dropoff} driver={driver} routePath={routePath} height="450px" />

      <div className="rounded border bg-white p-4">
        <div className="font-medium mb-3">Actions</div>
        <div className="flex gap-2">
          {d.status === 'assigned' && (
            <button 
              className="bg-amber-600 text-white px-4 py-2 rounded"
              onClick={() => updateStatus.mutate({ status: 'picked_up' })}
            >Picked Up</button>
          )}
          {d.status === 'picked_up' && (
            <button 
              className="bg-blue-600 text-white px-4 py-2 rounded"
              onClick={() => updateStatus.mutate({ status: 'on_route' })}
            >Start Route</button>
          )}
          {d.status === 'on_route' && (
            <button 
              className="bg-green-600 text-white px-4 py-2 rounded"
              onClick={() => updateStatus.mutate({ status: 'delivered' })}
            >Mark Delivered</button>
          )}
        </div>
      </div>
    </div>
  );
}
