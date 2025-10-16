// frontend/src/pages/customer/CustomerDashboard.tsx (replace)
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';
import type { Delivery } from '@/types/models';

export default function CustomerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data
  });

  const deliveries: Delivery[] = data?.deliveries || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My Deliveries</h1>
          <p className="text-gray-600">Track and manage your delivery requests</p>
        </div>
        <Link 
          to="/customer/new" 
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          + New Delivery
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading your deliveries...</div>
      ) : deliveries.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-lg font-medium text-gray-900">No deliveries yet</h3>
          <p className="text-gray-600 mb-6">Create your first delivery request to get started</p>
          <Link 
            to="/customer/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Create First Delivery
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {deliveries.map((d) => (
            <div key={d._id} className="border rounded-lg p-6 bg-white hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-medium">#{d._id.slice(-8)}</h3>
                    <DeliveryStatusBadge status={d.status} />
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <span className="text-green-600">📍</span>
                      <span>{d.pickup.address}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-red-600">📍</span>
                      <span>{d.dropoff.address}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-3">
                      <span>📦 {d.packageDetails.description}</span>
                      <span>🚩 {d.priority}</span>
                      {d.driverId && <span>👤 {(d.driverId as any).name}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <Link 
                    to={`/customer/delivery/${d._id}`}
                    className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                  >
                    Track →
                  </Link>
                  <div className="text-xs text-gray-500">
                    {new Date(d.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
