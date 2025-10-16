import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';

export default function Deliveries() {
  const qc = useQueryClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data
  });

  const { data: driversData } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => (await api.get('/admin/drivers/available')).data.data
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: async () => (await api.get('/vehicles?isAvailable=true')).data.data
  });

  const assign = useMutation({
    mutationFn: async ({ deliveryId, driverId, vehicleId }: any) => {
      const routeData = await calculateSimpleRoute(
        data?.deliveries?.find((d:any) => d._id === deliveryId)
      );
      return (await api.put(`/deliveries/${deliveryId}/assign`, { 
        driverId, 
        vehicleId, 
        route: routeData 
      })).data.data;
    },
    onSuccess: () => {
      toast.success('Delivery assigned successfully!');
      qc.invalidateQueries({ queryKey: ['admin-deliveries'] });
      qc.invalidateQueries({ queryKey: ['available-drivers'] });
      qc.invalidateQueries({ queryKey: ['available-vehicles'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Assignment failed')
  });

  // Calculate simple route for assignment
  const calculateSimpleRoute = async (delivery: any) => {
    if (!delivery) return null;
    
    try {
      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${delivery.pickup.latitude},${delivery.pickup.longitude}:${delivery.dropoff.latitude},${delivery.dropoff.longitude}/json?key=${import.meta.env.VITE_TOMTOM_API_KEY}&traffic=true`
      );
      const data = await response.json();
      
      if (data.routes?.[0]) {
        const route = data.routes[0];
        return {
          waypoints: route.legs[0].points?.map((p: any) => ({ lat: p.latitude, lng: p.longitude })) || [],
          distance: route.summary.lengthInMeters,
          estimatedDuration: Math.round(route.summary.travelTimeInSeconds / 60),
          encodedPolyline: null
        };
      }
    } catch (error) {
      console.error('Route calculation failed:', error);
    }
    
    // Fallback to straight line
    return {
      waypoints: [
        { lat: delivery.pickup.latitude, lng: delivery.pickup.longitude },
        { lat: delivery.dropoff.latitude, lng: delivery.dropoff.longitude }
      ],
      distance: 0,
      estimatedDuration: 30
    };
  };

  if (isLoading) return <div className="text-center py-8">Loading deliveries...</div>;

  const deliveries = data?.deliveries || [];
  const drivers = driversData?.drivers || [];
  const vehicles = vehiclesData?.vehicles || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Delivery Management</h1>
        <div className="text-sm text-gray-600">
          {deliveries.filter((d:any) => d.status === 'pending').length} pending assignments
        </div>
      </div>

      <div className="grid gap-4">
        {deliveries.map((d: any) => (
          <div key={d._id} className="bg-white border rounded-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold">#{d._id.slice(-8)}</h3>
                  <DeliveryStatusBadge status={d.status} />
                  <span className="text-sm text-gray-600">Priority: {d.priority}</span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <div>📦 {d.packageDetails.description}</div>
                  <div>👤 Customer: {d.customerId?.name}</div>
                  <div>📍 {d.pickup.address} → {d.dropoff.address}</div>
                  {d.driverId && <div>🚗 Driver: {d.driverId.name} | Vehicle: {d.vehicleId?.vehicleNumber}</div>}
                </div>
              </div>
              
              <Link 
                to={`/admin/delivery/${d._id}`}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Track Details →
              </Link>
            </div>

            {d.status === 'pending' && (
              <div className="border-t pt-4">
                <div className="grid md:grid-cols-4 gap-3 items-end">
                  <div>
                    <label className="block text-sm font-medium mb-1">Assign Driver</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2"
                      id={`driver-${d._id}`}
                      defaultValue=""
                    >
                      <option value="">Select Driver</option>
                      {drivers.map((driver: any) => (
                        <option key={driver._id} value={driver._id}>
                          {driver.name} • {driver.phone}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-1">Assign Vehicle</label>
                    <select 
                      className="w-full border rounded-lg px-3 py-2"
                      id={`vehicle-${d._id}`}
                      defaultValue=""
                    >
                      <option value="">Select Vehicle</option>
                      {vehicles.map((vehicle: any) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.vehicleNumber} • {vehicle.vehicleBrand} {vehicle.vehicleModel}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="md:col-span-2">
                    <button
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
                      disabled={assign.isPending}
                      onClick={() => {
                        const driverId = (document.getElementById(`driver-${d._id}`) as HTMLSelectElement)?.value;
                        const vehicleId = (document.getElementById(`vehicle-${d._id}`) as HTMLSelectElement)?.value;
                        
                        if (!driverId || !vehicleId) {
                          toast.error('Please select both driver and vehicle');
                          return;
                        }
                        
                        assign.mutate({ deliveryId: d._id, driverId, vehicleId });
                      }}
                    >
                      {assign.isPending ? 'Assigning...' : 'Assign & Calculate Route'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {deliveries.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📋</div>
          <h3 className="text-lg font-medium">No deliveries found</h3>
          <p className="text-gray-600">Deliveries will appear here once customers create them</p>
        </div>
      )}
    </div>
  );
}
