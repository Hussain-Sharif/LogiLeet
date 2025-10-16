import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => (await api.get('/vehicles')).data.data
  });

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">Admin Dashboard</h1>
      <section className="rounded border p-4">
        <h2 className="font-medium mb-2">Vehicles</h2>
        {isLoading ? 'Loading...' : (
          <ul className="space-y-2">
            {data?.vehicles?.map((v: any) => (
              <li key={v._id} className="border rounded p-2 flex justify-between">
                <span>{v.vehicleNumber} - {v.vehicleBrand} {v.vehicleModel} ({v.type})</span>
                <span className="text-sm opacity-70">{v.isAvailable ? 'Available' : 'Assigned'}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
