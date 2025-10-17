import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DeliveryMap } from '@/components/maps/DeliveryMap';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function DriverDeliveryDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['driver-delivery-detail', id],
    queryFn: async () => (await api.get(`/deliveries/${id}`)).data.data,
    enabled: Boolean(id),
    refetchInterval: 15000
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, driverNotes }: { status: string; driverNotes?: string }) => 
      (await api.put(`/deliveries/${id}/status`, { status, driverNotes })).data.data,
    onSuccess: (result) => {
      const statusMessages = {
        picked_up: '📦 Package picked up successfully!',
        on_route: '🚚 Journey started - heading to destination',
        delivered: '✅ Package delivered successfully!'
      };
      toast.success(statusMessages[result.delivery.status as keyof typeof statusMessages] || 'Status updated');
      
      qc.invalidateQueries({ queryKey: ['driver-delivery-detail'] });
      qc.invalidateQueries({ queryKey: ['driver-active'] });
      
      if (result.delivery.status === 'delivered') {
        setTimeout(() => nav('/driver'), 2000);
      }
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Status update failed')
  });

  const liveLocation = useDeliveryTracking(id);

  if (isLoading) return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="text-4xl mb-4">🔄</div>
        <div>Loading delivery details...</div>
      </div>
    </div>
  );

  if (!data?.delivery) return (
    <div className="text-center py-12">
      <div className="text-6xl mb-4">❌</div>
      <h3 className="text-lg font-medium">Delivery not found</h3>
    </div>
  );

  const delivery = data.delivery;
  const pickup = { lat: delivery.pickup.latitude, lng: delivery.pickup.longitude };
  const dropoff = { lat: delivery.dropoff.latitude, lng: delivery.dropoff.longitude };
  const driver = liveLocation 
    ? { lat: liveLocation.latitude, lng: liveLocation.longitude }
    : null;

  const routePath = delivery.route?.waypoints || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => nav('/driver')}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">Delivery #{delivery._id.slice(-6)}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span>👤 {delivery.customerId?.name}</span>
            <span>📞 {delivery.customerId?.phone}</span>
            <DeliveryStatusBadge status={delivery.status} />
          </div>
        </div>
      </div>

      {/* Route Information */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Distance</div>
          <div className="text-xl font-bold text-blue-600">
            {delivery.route?.distance ? `${(delivery.route.distance / 1000).toFixed(1)} km` : 'Calculating...'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Estimated Time</div>
          <div className="text-xl font-bold text-green-600">
            {delivery.route?.estimatedDuration ? `${delivery.route.estimatedDuration} min` : 'Calculating...'}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-sm text-gray-600">Priority</div>
          <div className="text-xl font-bold text-purple-600 capitalize">{delivery.priority}</div>
        </div>
      </div>

      {/* Live Map */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">🗺️ Live Route Map</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span>📍 {delivery.pickup.address}</span>
            <span>→</span>
            <span>🎯 {delivery.dropoff.address}</span>
          </div>
        </div>
        <DeliveryMap 
          pickup={pickup} 
          dropoff={dropoff} 
          driver={driver}
          routePath={routePath}
          height="450px" 
        />
      </div>

      {/* Package Details */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">📦 Package Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Description</div>
            <div className="font-medium">{delivery.packageDetails.description}</div>
          </div>
          {delivery.packageDetails.weight && (
            <div>
              <div className="text-sm text-gray-600">Weight</div>
              <div className="font-medium">{delivery.packageDetails.weight} kg</div>
            </div>
          )}
          {delivery.packageDetails.specialInstructions && (
            <div className="md:col-span-2">
              <div className="text-sm text-gray-600">Special Instructions</div>
              <div className="font-medium p-3 bg-yellow-50 border border-yellow-200 rounded">
                ⚠️ {delivery.packageDetails.specialInstructions}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold mb-4">🎯 Delivery Actions</h3>
        
        <div className="space-y-4">
          {delivery.status === 'assigned' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Mark as picked up when you collect the package from pickup location</p>
              <button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-lg font-semibold text-lg"
                onClick={() => updateStatus.mutate({ status: 'picked_up' })}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? '⏳ Updating...' : '📦 Mark as Picked Up'}
              </button>
            </div>
          )}

          {delivery.status === 'picked_up' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">Start your journey to the dropoff location</p>
              <button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg"
                onClick={() => updateStatus.mutate({ status: 'on_route' })}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? '⏳ Starting...' : '🚚 Start Journey'}
              </button>
            </div>
          )}

          {delivery.status === 'on_route' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-2">Delivery Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any notes about the delivery..."
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                />
              </div>
              <p className="text-sm text-gray-600">Mark as delivered when package is successfully delivered</p>
              <button 
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold text-lg"
                onClick={() => updateStatus.mutate({ status: 'delivered', driverNotes: notes })}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? '⏳ Delivering...' : '✅ Mark as Delivered'}
              </button>
            </div>
          )}

          {delivery.status === 'delivered' && (
            <div className="text-center py-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="text-2xl mb-2">🎉</div>
              <div className="font-semibold text-green-800">Delivery Completed!</div>
              <div className="text-sm text-green-600">Great job completing this delivery</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
