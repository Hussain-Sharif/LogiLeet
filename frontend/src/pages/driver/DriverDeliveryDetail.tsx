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
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['driver-delivery-detail', id],
    queryFn: async () => {
      const response = await api.get(`/deliveries/${id}`);
      return response.data.data;
    },
    enabled: Boolean(id),
    refetchInterval: 15000
  });

  const updateStatus = useMutation({
    mutationFn: async ({ status, driverNotes }: { status: string; driverNotes?: string }) => {
      const response = await api.put(`/deliveries/${id}/status`, { status, driverNotes });
      return response.data.data;
    },
    onSuccess: (result) => {
      const statusMessages = {
        picked_up: '📦 Package picked up successfully!',
        on_route: '🚚 Journey started - heading to destination',
        delivered: '✅ Package delivered successfully!',
        cancelled: '❌ Delivery cancelled'
      };
      
      toast.success(statusMessages[result.delivery.status as keyof typeof statusMessages] || 'Status updated');
      
      qc.invalidateQueries({ queryKey: ['driver-delivery-detail'] });
      qc.invalidateQueries({ queryKey: ['driver-active'] });
      
      if (result.delivery.status === 'delivered' || result.delivery.status === 'cancelled') {
        setTimeout(() => nav('/driver'), 2000);
      }
    },
    onError: (e: any) => {
      toast.error(e?.response?.data?.message || 'Status update failed');
    }
  });

  const handleCancelDelivery = () => {
    if (!cancelReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    
    updateStatus.mutate({ 
      status: 'cancelled', 
      driverNotes: `CANCELLED: ${cancelReason}` 
    });
    setShowCancelModal(false);
    setCancelReason('');
  };

  const liveTracking = useDeliveryTracking(id);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <div>Loading delivery details...</div>
        </div>
      </div>
    );
  }

  if (!data?.delivery) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium">Delivery not found</h3>
        <button 
          onClick={() => nav('/driver')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const delivery = data.delivery;
  
  if (!delivery.pickup?.latitude || !delivery.dropoff?.latitude) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-lg font-medium">Invalid delivery locations</h3>
        <button 
          onClick={() => nav('/driver')}
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  const pickup = { lat: delivery.pickup.latitude, lng: delivery.pickup.longitude };
  const dropoff = { lat: delivery.dropoff.latitude, lng: delivery.dropoff.longitude };
  const driver = liveTracking?.location 
    ? { lat: liveTracking.location.latitude, lng: liveTracking.location.longitude }
    : null;

  const routePath = delivery.route?.waypoints || [];

  // Can cancel if status is picked_up or on_route
  // const canCancel = ['picked_up', 'on_route'].includes(delivery.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <button
            onClick={() => nav('/driver')}
            className="text-blue-600 hover:text-blue-700 mb-2 flex items-center gap-2 font-medium"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-2xl font-bold">🚚 Delivery #{delivery._id.slice(-6)}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
            <span>👤 {delivery.customerId?.name}</span>
            <span>📞 {delivery.customerId?.phone}</span>
            <DeliveryStatusBadge status={delivery.status} />
          </div>
        </div>
      </div>

      {/* Route Information Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Distance</div>
              <div className="text-2xl font-bold text-blue-600">
                {delivery.route?.distance ? `${(delivery.route.distance / 1000).toFixed(1)} km` : 'N/A'}
              </div>
            </div>
            <div className="text-3xl">📏</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Estimated Time</div>
              <div className="text-2xl font-bold text-green-600">
                {delivery.route?.estimatedDuration ? `${delivery.route.estimatedDuration} min` : 'N/A'}
              </div>
            </div>
            <div className="text-3xl">⏱️</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Priority</div>
              <div className="text-2xl font-bold text-purple-600 capitalize">{delivery.priority}</div>
            </div>
            <div className="text-3xl">🚩</div>
          </div>
        </div>
      </div>

      {/* Live Tracking Status */}
      {liveTracking?.location && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
            <div className="flex-1">
              <div className="font-medium text-green-800">📍 Live Location Active</div>
              <div className="text-sm text-green-600">
                Speed: {liveTracking.location.speed ? `${Math.round(liveTracking.location.speed * 3.6)} km/h` : '0 km/h'} • 
                Last update: {liveTracking.location.timestamp ? new Date(liveTracking.location.timestamp).toLocaleTimeString() : 'now'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="bg-white rounded-lg border overflow-hidden shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h2 className="font-semibold text-lg">🗺️ Live Route Map</h2>
          <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
              📍 {delivery.pickup.address}
            </span>
            <span>→</span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              🎯 {delivery.dropoff.address}
            </span>
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

      {/* Package Information */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">📦 Package Information</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="font-medium text-lg">{delivery.packageDetails.description}</div>
            </div>
            {delivery.packageDetails.weight && (
              <div>
                <div className="text-sm text-gray-600">Weight</div>
                <div className="font-medium">{delivery.packageDetails.weight} kg</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Priority Level</div>
              <div className="font-medium capitalize flex items-center gap-2">
                {delivery.priority === 'urgent' && '🔴'}
                {delivery.priority === 'high' && '🟠'} 
                {delivery.priority === 'medium' && '🟡'}
                {delivery.priority === 'low' && '🟢'}
                {delivery.priority}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Customer Contact</div>
              <div className="font-medium">{delivery.customerId?.phone}</div>
            </div>
            {delivery.packageDetails.isFragile && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <div className="font-medium text-orange-800">⚠️ Handle with Care</div>
                <div className="text-sm text-orange-600">This package is fragile</div>
              </div>
            )}
            {delivery.packageDetails.specialInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm font-medium text-blue-800">📝 Special Instructions:</div>
                <div className="text-sm text-blue-700">{delivery.packageDetails.specialInstructions}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
       {/* Action Buttons */}
      <div className="bg-white rounded-lg border p-6">
        <h3 className="font-semibold text-lg mb-4">🎯 Delivery Actions</h3>
        
        <div className="space-y-4">
          {delivery.status === 'assigned' && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="mb-3">
                <div className="font-medium text-amber-800">📦 Ready for Pickup</div>
                <div className="text-sm text-amber-600">Go to pickup location and collect the package</div>
              </div>
              <button 
                className="w-full bg-amber-600 hover:bg-amber-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors"
                onClick={() => updateStatus.mutate({ status: 'picked_up' })}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? '⏳ Updating...' : '📦 Mark as Picked Up'}
              </button>
            </div>
          )}

          {delivery.status === 'picked_up' && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="mb-3">
                  <div className="font-medium text-blue-800">🚚 Start Journey</div>
                  <div className="text-sm text-blue-600">Begin navigation to dropoff location</div>
                </div>
                <button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors"
                  onClick={() => updateStatus.mutate({ status: 'on_route' })}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? '⏳ Starting...' : '🚚 Start Journey to Destination'}
                </button>
              </div>
              
              {/* Cancel Option for Picked Up */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="mb-3">
                  <div className="font-medium text-red-800">❌ Cancel Delivery</div>
                  <div className="text-sm text-red-600">Cancel this delivery if unable to proceed</div>
                </div>
                <button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => setShowCancelModal(true)}
                  disabled={updateStatus.isPending}
                >
                  Cancel Delivery
                </button>
              </div>
            </>
          )}

          {delivery.status === 'on_route' && (
            <>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="mb-4">
                  <div className="font-medium text-green-800">✅ Complete Delivery</div>
                  <div className="text-sm text-green-600">Mark as delivered when package is handed over</div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Delivery Notes (Optional)</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add any delivery notes, customer feedback, or special observations..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500"
                    rows={3}
                  />
                </div>

                <button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold text-lg transition-colors"
                  onClick={() => updateStatus.mutate({ status: 'delivered', driverNotes: notes })}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? '⏳ Completing...' : '✅ Mark as Delivered'}
                </button>
              </div>
              
              {/* Cancel Option for On Route */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="mb-3">
                  <div className="font-medium text-red-800">❌ Cancel Delivery</div>
                  <div className="text-sm text-red-600">Cancel delivery due to unforeseen circumstances</div>
                </div>
                <button 
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
                  onClick={() => setShowCancelModal(true)}
                  disabled={updateStatus.isPending}
                >
                  Cancel Delivery
                </button>
              </div>
            </>
          )}

          {delivery.status === 'delivered' && (
            <div className="bg-green-100 border border-green-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">🎉</div>
              <div className="font-bold text-green-800 text-xl mb-2">Delivery Completed!</div>
              <div className="text-green-700 mb-4">Great job completing this delivery successfully</div>
              <button
                onClick={() => nav('/driver')}
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700"
              >
                Return to Dashboard
              </button>
            </div>
          )}

          {delivery.status === 'cancelled' && (
            <div className="bg-red-100 border border-red-300 rounded-lg p-6 text-center">
              <div className="text-4xl mb-4">❌</div>
              <div className="font-bold text-red-800 text-xl mb-2">Delivery Cancelled</div>
              <div className="text-red-700 mb-4">This delivery has been cancelled</div>
              {delivery.driverNotes && (
                <div className="bg-red-50 p-3 rounded mb-4 text-sm text-red-700">
                  <strong>Reason:</strong> {delivery.driverNotes.replace('CANCELLED: ', '')}
                </div>
              )}
              <button
                onClick={() => nav('/driver')}
                className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700"
              >
                Return to Dashboard
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2">⚠️</div>
              <h3 className="text-lg font-bold text-red-800">Cancel Delivery</h3>
              <p className="text-sm text-gray-600 mt-2">Please provide a reason for cancellation</p>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g., Vehicle breakdown, customer unavailable, package damaged..."
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500"
                rows={4}
                required
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason('');
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-lg font-medium"
              >
                Keep Delivery
              </button>
              <button
                onClick={handleCancelDelivery}
                disabled={!cancelReason.trim() || updateStatus.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-medium disabled:opacity-50"
              >
                {updateStatus.isPending ? 'Cancelling...' : 'Cancel Delivery'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
