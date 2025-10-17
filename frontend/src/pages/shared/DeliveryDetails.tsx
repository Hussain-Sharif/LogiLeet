import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { DeliveryMap } from '@/components/maps/DeliveryMap';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';
import StatusTimeline from '@/components/deliveries/StatusTimeline';
import { useDeliveryTracking } from '@/hooks/useDeliveryTracking';
import type { Delivery } from '@/types/models';
import { useEffect, useState } from 'react';

export default function DeliveryDetails() {
  const { id } = useParams();
  const [eta, setEta] = useState<string | null>(null);
  
  const { data, isLoading, error } = useQuery({
    queryKey: ['delivery-live', id],
    queryFn: async () => {
      console.log('Fetching delivery details for ID:', id);
      const response = await api.get(`/tracking/deliveries/${id}/live`);
      console.log('API Response:', response.data);
      return response.data.data;
    },
    enabled: Boolean(id),
    refetchInterval: 10000,
    retry: 3
  });

  const liveLocation = useDeliveryTracking(id);

  // Calculate ETA when driver is moving
  useEffect(() => {
    if (liveLocation?.location && data?.delivery?.status === 'on_route') {
      calculateETA();
    }
  }, [liveLocation, data]);

  const calculateETA = async () => {
    if (!liveLocation?.location || !data?.delivery) return;
    
    try {
      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${liveLocation.location.latitude},${liveLocation.location.longitude}:${data.delivery.dropoff.latitude},${data.delivery.dropoff.longitude}/json?key=${import.meta.env.VITE_TOMTOM_API_KEY}&traffic=true`
      );
      const routeData = await response.json();
      
      if (routeData.routes?.[0]) {
        const minutes = Math.round(routeData.routes[0].summary.travelTimeInSeconds / 60);
        setEta(`${minutes} min`);
      }
    } catch (error) {
      console.error('ETA calculation failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="text-4xl mb-4 animate-spin">🔄</div>
          <div className="text-lg font-medium">Loading delivery details...</div>
          <div className="text-sm text-gray-600 mt-2">Delivery ID: {id}</div>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('Delivery fetch error:', error);
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">❌</div>
        <h3 className="text-lg font-medium text-red-600">Failed to load delivery</h3>
        <p className="text-sm text-gray-600 mt-2">Error: {(error as any)?.response?.data?.message || 'Unknown error'}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data?.delivery) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📦</div>
        <h3 className="text-lg font-medium">Delivery not found</h3>
        <p className="text-sm text-gray-600 mt-2">ID: {id}</p>
        <div className="mt-4 text-xs bg-gray-100 p-3 rounded">
          <div>API Response: {JSON.stringify(data, null, 2)}</div>
        </div>
      </div>
    );
  }

  const d: Delivery = data.delivery;
  
  // Validate delivery data structure
  if (!d.pickup?.latitude || !d.dropoff?.latitude) {
    console.error('Invalid delivery location data:', d);
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🗺️</div>
        <h3 className="text-lg font-medium">Invalid delivery locations</h3>
        <div className="mt-4 text-xs bg-red-50 p-3 rounded">
          <div>Pickup: {JSON.stringify(d.pickup)}</div>
          <div>Dropoff: {JSON.stringify(d.dropoff)}</div>
        </div>
      </div>
    );
  }

  const pickup = { lat: d.pickup.latitude, lng: d.pickup.longitude };
  const dropoff = { lat: d.dropoff.latitude, lng: d.dropoff.longitude };
  
  // Use live location if available, otherwise use last known location
  const driverLocation = liveLocation?.location 
    ? { lat: liveLocation.location.latitude, lng: liveLocation.location.longitude }
    : data.currentLocation 
    ? { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude }
    : null;

  const routePath = d.route?.waypoints || [];

  // Safe access to packageDetails
  const packageDetails = d.packageDetails || {};
  const customerName = (d.customerId as any)?.name || 'Unknown Customer';
  const driverName = (d.driverId as any)?.name || null;
  const vehicleNumber = (d.vehicleId as any)?.vehicleNumber || null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">📦 Delivery #{d._id.slice(-8)}</h1>
            <p className="text-gray-600 mt-1">
              Customer: {customerName}
              {driverName && ` • Driver: ${driverName}`}
              {vehicleNumber && ` • Vehicle: ${vehicleNumber}`}
            </p>
          </div>
          <DeliveryStatusBadge status={d.status} />
        </div>
        
        <StatusTimeline d={d} />
      </div>

      {/* Live Status Card */}
      {d.status !== 'pending' && (
        <div className="bg-white border rounded-lg p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {d.route?.distance ? `${(d.route.distance / 1000).toFixed(1)} km` : 'N/A'}
              </div>
              <div className="text-sm text-gray-600">Total Distance</div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {eta || (d.route?.estimatedDuration ? `${d.route.estimatedDuration} min` : 'N/A')}
              </div>
              <div className="text-sm text-gray-600">
                {d.status === 'on_route' ? 'ETA' : 'Estimated Time'}
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {liveLocation?.location?.speed ? `${Math.round(liveLocation.location.speed * 3.6)} km/h` : '0 km/h'}
              </div>
              <div className="text-sm text-gray-600">Current Speed</div>
            </div>
          </div>
          
          {liveLocation?.location && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">
                  Live tracking active • Last updated: {liveLocation.location.timestamp ? new Date(liveLocation.location.timestamp).toLocaleTimeString() : 'now'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Map */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">🗺️ Live Tracking Map</h2>
          <p className="text-sm text-gray-600 mt-1">
            {d.status === 'pending' && 'Route will appear once assigned to a driver'}
            {d.status === 'assigned' && 'Waiting for driver to start pickup'}
            {d.status === 'picked_up' && 'Driver has picked up the package'}
            {d.status === 'on_route' && 'Package is on the way to destination'}
            {d.status === 'delivered' && 'Package has been delivered successfully'}
          </p>
          <div className="text-xs text-gray-500 mt-2">
            📍 {d.pickup.address} → 🎯 {d.dropoff.address}
          </div>
        </div>
        
        <DeliveryMap 
          pickup={pickup} 
          dropoff={dropoff} 
          driver={driverLocation}
          routePath={routePath}
          height="500px" 
        />
      </div>

      {/* Package Details */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold text-lg mb-4">📦 Package Details</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Description</div>
              <div className="font-medium">
                {packageDetails.description || 'No description provided'}
              </div>
            </div>
            {packageDetails.weight && (
              <div>
                <div className="text-sm text-gray-600">Weight</div>
                <div className="font-medium">{packageDetails.weight} kg</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Priority</div>
              <div className="font-medium capitalize flex items-center gap-2">
                {d.priority === 'urgent' && '🔴'}
                {d.priority === 'high' && '🟠'} 
                {d.priority === 'medium' && '🟡'}
                {d.priority === 'low' && '🟢'}
                {d.priority}
              </div>
            </div>
          </div>
          
          <div className="space-y-3">
            <div>
              <div className="text-sm text-gray-600">Customer</div>
              <div className="font-medium">{customerName}</div>
            </div>
            {packageDetails.isFragile && (
              <div className="bg-orange-50 border border-orange-200 rounded p-3">
                <div className="font-medium text-orange-800">⚠️ Fragile Item</div>
                <div className="text-sm text-orange-600">Handle with special care</div>
              </div>
            )}
            {packageDetails.specialInstructions && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <div className="text-sm font-medium text-blue-800">📝 Special Instructions</div>
                <div className="text-sm text-blue-700">{packageDetails.specialInstructions}</div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Created:</span>
              <span className="ml-2 font-medium">{new Date(d.createdAt).toLocaleString()}</span>
            </div>
            {d.assignedAt && (
              <div>
                <span className="text-gray-600">Assigned:</span>
                <span className="ml-2 font-medium">{new Date(d.assignedAt).toLocaleString()}</span>
              </div>
            )}
            {d.actualDeliveryTime && (
              <div>
                <span className="text-gray-600">Delivered:</span>
                <span className="ml-2 font-medium">{new Date(d.actualDeliveryTime).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
