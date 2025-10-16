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
  
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['delivery-live', id],
    queryFn: async () => (await api.get(`/tracking/deliveries/${id}/live`)).data.data,
    enabled: Boolean(id),
    refetchInterval: 10000 // Refetch every 10 seconds for live updates
  });

  const liveLocation = useDeliveryTracking(id);

  // Calculate ETA when driver is moving
  useEffect(() => {
    if (liveLocation && data?.delivery?.status === 'on_route') {
      calculateETA();
    }
  }, [liveLocation, data]);

  const calculateETA = async () => {
    if (!liveLocation || !data?.delivery) return;
    
    try {
      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${liveLocation.latitude},${liveLocation.longitude}:${data.delivery.dropoff.latitude},${data.delivery.dropoff.longitude}/json?key=${import.meta.env.VITE_TOMTOM_API_KEY}&traffic=true`
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
          <div className="text-4xl mb-4">🔄</div>
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
      </div>
    );
  }

  const d: Delivery = data.delivery;
  const pickup = { lat: d.pickup.latitude, lng: d.pickup.longitude };
  const dropoff = { lat: d.dropoff.latitude, lng: d.dropoff.longitude };
  
  // Use live location if available, otherwise use last known location
  const driverLocation = liveLocation 
    ? { lat: liveLocation.latitude, lng: liveLocation.longitude }
    : data.currentLocation 
    ? { lat: data.currentLocation.latitude, lng: data.currentLocation.longitude }
    : null;

  const routePath = d.route?.waypoints || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Delivery #{d._id.slice(-8)}</h1>
            <p className="text-gray-600">
              Customer: {(d.customerId as any)?.name} • 
              {d.driverId && ` Driver: ${(d.driverId as any)?.name} • `}
              {d.vehicleId && ` Vehicle: ${(d.vehicleId as any)?.vehicleNumber}`}
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
                {liveLocation?.speed ? `${Math.round(liveLocation.speed * 3.6)} km/h` : '0 km/h'}
              </div>
              <div className="text-sm text-gray-600">Current Speed</div>
            </div>
          </div>
          
          {liveLocation && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-green-800">
                  Live tracking active • Last updated: {liveLocation.timestamp ? new Date(liveLocation.timestamp).toLocaleTimeString() : 'now'}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Live Map */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Live Tracking Map</h2>
          <p className="text-sm text-gray-600">
            {d.status === 'pending' && 'Route will appear once assigned to a driver'}
            {d.status === 'assigned' && 'Waiting for driver to start pickup'}
            {d.status === 'picked_up' && 'Driver has picked up the package'}
            {d.status === 'on_route' && 'Package is on the way to destination'}
            {d.status === 'delivered' && 'Package has been delivered successfully'}
          </p>
        </div>
        
        <DeliveryMap 
          pickup={pickup} 
          dropoff={dropoff} 
          driver={driverLocation}
        //   routePath={routePath}
          height="500px" 
        />
      </div>

      {/* Package Details */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="font-semibold mb-3">Package Details</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Description</div>
            <div className="font-medium">{d.packageDetails.description}</div>
          </div>
          {d.packageDetails.weight && (
            <div>
              <div className="text-sm text-gray-600">Weight</div>
              <div className="font-medium">{d.packageDetails.weight} kg</div>
            </div>
          )}
          <div>
            <div className="text-sm text-gray-600">Priority</div>
            <div className="font-medium capitalize">{d.priority}</div>
          </div>
          {d.packageDetails.isFragile && (
            <div>
              <div className="text-sm text-gray-600">Special Handling</div>
              <div className="font-medium text-orange-600">⚠️ Fragile Item</div>
            </div>
          )}
        </div>
        
        {d.packageDetails.specialInstructions && (
          <div className="mt-4">
            <div className="text-sm text-gray-600">Special Instructions</div>
            <div className="font-medium">{d.packageDetails.specialInstructions}</div>
          </div>
        )}
      </div>
    </div>
  );
}
