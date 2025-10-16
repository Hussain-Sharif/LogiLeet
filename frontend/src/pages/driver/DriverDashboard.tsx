import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';

export default function DriverDashboard() {
  const qc = useQueryClient();
  const socket = useSocket();

  const { data, isLoading } = useQuery({
    queryKey: ['driver-active'],
    queryFn: async () => (await api.get('/tracking/driver/active-deliveries')).data.data
  });

  const updateStatus = useMutation({
    mutationFn: async ({ deliveryId, status }: any) =>
      (await api.put(`/deliveries/${deliveryId}/status`, { status })).data.data,
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: ['driver-active'] }); },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Failed to update status')
  });

  // Emit location every 10s
  useEffect(() => {
    let watchId: number | null = null;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          // For each active delivery, send update
          data?.activeDeliveries?.forEach((d: any) => {
            api.post(`/tracking/deliveries/${d._id}/location`, {
              location: { latitude, longitude, speed: pos.coords.speed || 0 },
              status: 'moving'
            }).catch(() => {});
            socket.emit('driver-location-update', {
              deliveryId: d._id,
              location: { latitude, longitude },
              timestamp: new Date().toISOString(),
              status: 'moving'
            });
          });
        },
        () => {},
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
    }
    return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
  }, [data?.activeDeliveries, socket]);

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-semibold">My Active Deliveries</h1>
      {isLoading ? 'Loading...' : (
        <div className="grid gap-3">
          {data.activeDeliveries.length === 0 ? 'No active deliveries' : data.activeDeliveries.map((d: any) => (
            <div key={d._id} className="rounded border p-3 bg-white">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">#{d._id.slice(-6)}</div>
                  <div className="text-sm text-gray-600">{d.pickup.address} → {d.dropoff.address}</div>
                </div>
                <Link to={`/driver/delivery/${d._id}`} className="text-blue-600 text-sm">Open</Link>
              </div>
              <div className="mt-3 flex gap-2">
                {d.status === 'assigned' && (
                  <button className="bg-amber-600 text-white px-3 py-1 rounded" onClick={() => updateStatus.mutate({ deliveryId: d._id, status: 'picked_up' })}>
                    Picked Up
                  </button>
                )}
                {d.status === 'picked_up' && (
                  <button className="bg-blue-600 text-white px-3 py-1 rounded" onClick={() => updateStatus.mutate({ deliveryId: d._id, status: 'on_route' })}>
                    Start Route
                  </button>
                )}
                {d.status === 'on_route' && (
                  <button className="bg-green-600 text-white px-3 py-1 rounded" onClick={() => updateStatus.mutate({ deliveryId: d._id, status: 'delivered' })}>
                    Mark Delivered
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
