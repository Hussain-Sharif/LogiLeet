import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { data: deliveries } = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data
  });
  const { data: vehicles } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: async () => (await api.get('/vehicles')).data.data
  });

  const stats = {
    totalDeliveries: deliveries?.totalDeliveries || 0,
    totalVehicles: vehicles?.totalVehicles || vehicles?.vehicles?.length || 0,
    availableVehicles: vehicles?.vehicles?.filter((v: any) => v.isAvailable).length || 0,
    pending: deliveries?.deliveries?.filter((d: any) => d.status === 'pending').length || 0
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <div className="grid md:grid-cols-4 gap-4">
        {Object.entries({
          'Total Deliveries': stats.totalDeliveries,
          'Pending': stats.pending,
          'Vehicles': stats.totalVehicles,
          'Available': stats.availableVehicles
        }).map(([k, v]) => (
          <div key={k} className="rounded border p-4 bg-white">
            <div className="text-sm text-gray-600">{k}</div>
            <div className="text-2xl font-semibold">{v}</div>
          </div>
        ))}
      </div>
      <div className="rounded border p-4 bg-white">
        <div className="flex items-center justify-between mb-3">
          <div className="font-medium">Recent Deliveries</div>
          <Link to="/admin/deliveries" className="text-blue-600 text-sm">Manage</Link>
        </div>
        <div className="grid gap-2">
          {deliveries?.deliveries?.slice(0,5).map((d: any) => (
            <div key={d._id} className="flex justify-between text-sm">
              <div>#{d._id.slice(-6)} • {d.packageDetails.description}</div>
              <div className="text-gray-600">{d.status}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
