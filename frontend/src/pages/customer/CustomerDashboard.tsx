import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';

export default function CustomerDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data
  });

  const deliveries = data?.deliveries || [];

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-semibold">My Deliveries</h1>
      <div className="flex justify-end">
        <Link to="/customer/new" className="bg-blue-600 text-white px-3 py-2 rounded">Create Delivery</Link>
      </div>
      {isLoading ? 'Loading...' : deliveries.length === 0 ? 'No deliveries yet' : (
        <ul className="space-y-3">
          {deliveries.map((d: any) => (
            <li key={d._id} className="border rounded p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-medium">Delivery #{d._id.slice(-6)}</div>
                  <div className="text-sm opacity-70">Status: {d.status}</div>
                </div>
                <Link to={`/customer/delivery/${d._id}`} className="text-blue-600">Track</Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
