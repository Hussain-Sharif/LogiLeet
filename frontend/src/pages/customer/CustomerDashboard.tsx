import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { useAuth } from '@/store/auth';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';
import toast from 'react-hot-toast';

export default function CustomerDashboard() {
  const socket = useSocket();
  const user = useAuth(s => s.user);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['customer-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data
  });

  // Listen for delivery updates
  useEffect(() => {
    if (!user) return;
    
    socket.emit('join-room', `user-${user._id}`);
    
    socket.on('delivery-assigned', (data) => {
      toast.success('📦 Your delivery has been assigned to a driver!');
      setRecentActivity(prev => [...prev, { 
        message: 'Delivery assigned to driver', 
        timestamp: new Date(),
        deliveryId: data.deliveryId 
      }]);
    });

    socket.on('delivery-status-updated', (data) => {
      const statusMessages = {
        picked_up: '📦 Driver has picked up your package',
        on_route: '🚚 Your package is on the way',
        delivered: '✅ Your package has been delivered!'
      };
      const message = statusMessages[data.status as keyof typeof statusMessages] || 'Delivery status updated';
      toast.success(message);
    });

    return () => {
      socket.off('delivery-assigned');
      socket.off('delivery-status-updated');
    };
  }, [socket, user]);

  const deliveries = data?.deliveries || [];
  const activeDeliveries = deliveries.filter((d: any) => ['assigned', 'picked_up', 'on_route'].includes(d.status));
  const completedDeliveries = deliveries.filter((d: any) => d.status === 'delivered');

  if (isLoading) return <div className="text-center py-8">Loading your deliveries...</div>;

  return (
    <div className="space-y-8">
      {/* Header with CTA */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Deliveries</h1>
          <p className="text-gray-600 mt-1">Track and manage your delivery requests</p>
        </div>
        <Link 
          to="/customer/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-colors shadow-lg"
        >
          📦 Create New Delivery
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Deliveries</p>
              <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center text-xl">📦</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Deliveries</p>
              <p className="text-2xl font-bold text-orange-600">{activeDeliveries.length}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center text-xl">🚚</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-green-600">{completedDeliveries.length}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center text-xl">✅</div>
          </div>
        </div>
      </div>

      {/* Active Deliveries */}
      {activeDeliveries.length > 0 && (
        <div className="bg-white rounded-xl border shadow-sm">
          <div className="p-6 border-b">
            <h2 className="text-lg font-semibold text-orange-600">🚚 Active Deliveries</h2>
            <p className="text-sm text-gray-600">Track your packages in real-time</p>
          </div>
          <div className="p-6 space-y-4">
            {activeDeliveries.map((delivery: any) => (
              <div key={delivery._id} className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold">#{delivery._id.slice(-6)}</h3>
                      <DeliveryStatusBadge status={delivery.status} />
                    </div>
                    <p className="text-sm text-gray-600">{delivery.pickup.address} → {delivery.dropoff.address}</p>
                    <p className="text-sm text-gray-600">Driver: {delivery.driverId?.name}</p>
                  </div>
                  <Link 
                    to={`/customer/delivery/${delivery._id}`}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700"
                  >
                    Track Live →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All Deliveries */}
      <div className="bg-white rounded-xl border shadow-sm">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">📋 All Deliveries</h2>
        </div>
        <div className="p-6">
          {deliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-lg font-medium text-gray-900">No deliveries yet</h3>
              <p className="text-gray-600 mb-6">Create your first delivery request to get started</p>
              <Link 
                to="/customer/new" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                Create First Delivery
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.map((delivery: any) => (
                <div key={delivery._id} className="border rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">#{delivery._id.slice(-6)}</h3>
                        <DeliveryStatusBadge status={delivery.status} />
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {delivery.priority}
                        </span>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-green-600 font-medium">📍 From:</span>
                          <span>{delivery.pickup.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-red-600 font-medium">🎯 To:</span>
                          <span>{delivery.dropoff.address}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-gray-600">
                          <span>📦 {delivery.packageDetails.description}</span>
                          {delivery.driverId && <span>👤 {delivery.driverId.name}</span>}
                          {delivery.vehicleId && <span>🚗 {delivery.vehicleId.vehicleNumber}</span>}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-2 text-right">
                      <Link 
                        to={`/customer/delivery/${delivery._id}`}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        Track →
                      </Link>
                      <div className="text-xs text-gray-500">
                        Created: {new Date(delivery.createdAt).toLocaleDateString()}
                      </div>
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
