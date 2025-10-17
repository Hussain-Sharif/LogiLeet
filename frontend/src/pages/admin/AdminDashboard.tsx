import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';

export default function AdminDashboard() {
  const { data: deliveriesData } = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: async () => (await api.get('/vehicles')).data.data
  });

  const { data: driversData } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: async () => (await api.get('/admin/drivers/available')).data.data
  });

  const deliveries = deliveriesData?.deliveries || [];
  const vehicles = vehiclesData?.vehicles || [];
  const drivers = driversData?.drivers || [];

  const stats = {
    totalDeliveries: deliveries.length,
    pendingDeliveries: deliveries.filter((d: any) => d.status === 'pending').length,
    activeDeliveries: deliveries.filter((d: any) => ['assigned', 'picked_up', 'on_route'].includes(d.status)).length,
    completedDeliveries: deliveries.filter((d: any) => d.status === 'delivered').length,
    totalVehicles: vehicles.length,
    availableVehicles: vehicles.filter((v: any) => v.isAvailable).length,
    totalDrivers: drivers.length,
    availableDrivers: drivers.length
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Complete logistics management overview</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deliveries</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalDeliveries}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">📦</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-3xl font-bold text-orange-600">{stats.pendingDeliveries}</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">⏳</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-3xl font-bold text-blue-600">{stats.activeDeliveries}</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">🚚</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Completed</p>
              <p className="text-3xl font-bold text-green-600">{stats.completedDeliveries}</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
      </div>

      {/* Resource Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Fleet Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalVehicles}</div>
              <div className="text-sm text-gray-600">Total Vehicles</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.availableVehicles}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
          <Link to="/admin/vehicles" className="mt-4 block text-center bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm font-medium transition-colors">
            Manage Vehicles
          </Link>
        </div>

        <div className="bg-white p-6 rounded-lg border shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Driver Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{stats.totalDrivers}</div>
              <div className="text-sm text-gray-600">Total Drivers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.availableDrivers}</div>
              <div className="text-sm text-gray-600">Available</div>
            </div>
          </div>
          <Link to="/admin/users" className="mt-4 block text-center bg-gray-100 hover:bg-gray-200 py-2 rounded-lg text-sm font-medium transition-colors">
            Manage Users
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Deliveries</h3>
            <Link to="/admin/deliveries" className="text-blue-600 hover:text-blue-700 font-medium">
              View All →
            </Link>
          </div>
        </div>
        <div className="p-6">
          {deliveries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">📋</div>
              <p className="text-gray-600">No deliveries yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {deliveries.slice(0, 5).map((delivery: any) => (
                <div key={delivery._id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <span className="text-sm font-medium">#{delivery._id.slice(-4)}</span>
                    </div>
                    <div>
                      <div className="font-medium">{delivery.packageDetails.description}</div>
                      <div className="text-sm text-gray-600">
                        {delivery.customerId?.name} • {new Date(delivery.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <DeliveryStatusBadge status={delivery.status} />
                    <Link to={`/admin/delivery/${delivery._id}`} className="text-blue-600 hover:text-blue-700">
                      View →
                    </Link>
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
