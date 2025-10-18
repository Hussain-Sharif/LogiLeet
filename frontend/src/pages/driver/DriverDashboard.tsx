import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useEffect } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/store/auth';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';

export default function DriverDashboard() {
  const qc = useQueryClient();
  const socket = useSocket();
  const user = useAuth(s => s.user);
  // const [notifications, setNotifications] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['driver-active'],
    queryFn: async () => (await api.get('/tracking/driver/active-deliveries')).data.data,
    refetchInterval: 30000
  });

  const { data: driverStats } = useQuery({
    queryKey: ['driver-stats'],
    queryFn: async () => (await api.get('/deliveries?status=delivered')).data.data
  });

  // Listen for delivery assignments
  useEffect(() => {
    socket.emit('join-room', `user-${user?._id}`);
    
    // socket.on('delivery-assigned', (data) => {
    //   toast.success('🎯 New delivery assigned to you!');
    //   // setNotifications(prev => [...prev, { ...data, timestamp: Date.now() }]);
    //   qc.invalidateQueries({ queryKey: ['driver-active'] });
    // });

    return () => {
      socket.off('delivery-assigned');
    };
  }, [socket, user?._id, qc]);

  // Auto-emit location for active deliveries
  useEffect(() => {
    if (!data?.activeDeliveries?.length) return;

    const watchId = navigator.geolocation?.watchPosition(
      (pos) => {
        const { latitude, longitude, speed } = pos.coords;
        
        data.activeDeliveries.forEach((delivery: any) => {
          if (['assigned', 'picked_up', 'on_route'].includes(delivery.status)) {
            api.post(`/tracking/deliveries/${delivery._id}/location`, {
              location: { latitude, longitude, speed: speed || 0 },
              status: 'moving'
            }).catch(() => {});

            socket.emit('driver-location-update', {
              deliveryId: delivery._id,
              location: { latitude, longitude, speed },
              timestamp: new Date().toISOString(),
              status: 'moving'
            });
          }
        });
      },
      (error) => console.error('Geolocation error:', error),
      { enableHighAccuracy: true, maximumAge: 10000, timeout: 15000 }
    );

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [data?.activeDeliveries, socket]);

  const activeDeliveries = data?.activeDeliveries || [];
  const completedCount = driverStats?.totalDeliveries || 0;

  if (isLoading) return <div className="p-6">Loading your deliveries...</div>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">🚚 My Deliveries</h1>
          <p className="text-gray-600">Active deliveries and live tracking</p>
        </div>
        <Link 
          to="/driver/history"
          className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg text-sm font-medium"
        >
          📋 View History
        </Link>
      </div>
      {/* Driver Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Deliveries</p>
              <p className="text-2xl font-bold text-blue-600">{activeDeliveries.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">🚚</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed Today</p>
              <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">✅</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Vehicle</p>
              <p className="text-lg font-semibold">{(user as any)?.vehicleAssigned?.vehicleNumber || 'Not Assigned'}</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center text-xl">🚗</div>
          </div>
        </div>
      </div>

      {/* Active Deliveries */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">🎯 Active Deliveries</h2>
            <div className="text-sm text-gray-600">
              {activeDeliveries.length > 0 && '📍 Live location tracking enabled'}
            </div>
          </div>
        </div>
        
        <div className="p-6">
          {activeDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">😴</div>
              <h3 className="text-lg font-medium text-gray-900">No active deliveries</h3>
              <p className="text-gray-600">New assignments will appear here</p>
            </div>
          ) : (
            <div className="space-y-6">
              {activeDeliveries.map((delivery: any) => (
                <div key={delivery._id} className="border rounded-xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">#{delivery._id.slice(-6)}</h3>
                        <DeliveryStatusBadge status={delivery.status} />
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>📦 {delivery.packageDetails.description}</div>
                        <div>👤 Customer: {delivery.customerId?.name} • {delivery.customerId?.phone}</div>
                        <div>🚗 Vehicle: {delivery.vehicleId?.vehicleNumber}</div>
                      </div>
                    </div>
                    <Link 
                      to={`/driver/delivery/${delivery._id}`}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      Open Details →
                    </Link>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-green-700">📍 Pickup</div>
                      <div className="text-sm text-gray-600">{delivery.pickup.address}</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-red-700">🎯 Dropoff</div>
                      <div className="text-sm text-gray-600">{delivery.dropoff.address}</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t">
                    <div className="text-xs text-gray-500">
                      Assigned: {new Date(delivery.assignedAt).toLocaleString()}
                      {delivery.route?.estimatedDuration && ` • Est. ${delivery.route.estimatedDuration} min`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
