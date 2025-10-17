import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';

export default function DriverHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['driver-history'],
    queryFn: async () => (await api.get('/deliveries?status=delivered')).data.data
  });

  const completedDeliveries = data?.deliveries || [];

  if (isLoading) return <div className="text-center py-8">Loading delivery history...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📋 Delivery History</h1>
          <p className="text-gray-600">Your completed deliveries</p>
        </div>
        <Link to="/driver" className="text-blue-600 hover:text-blue-700">← Back to Dashboard</Link>
      </div>

      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">Completed Deliveries ({completedDeliveries.length})</h2>
          </div>
        </div>

        <div className="p-6">
          {completedDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium">No completed deliveries yet</h3>
              <p className="text-gray-600">Your delivery history will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {completedDeliveries.map((delivery: any) => (
                <div key={delivery._id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-semibold">#{delivery._id.slice(-6)}</span>
                        <DeliveryStatusBadge status={delivery.status} />
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>📦 {delivery.packageDetails.description}</div>
                        <div>👤 {delivery.customerId?.name}</div>
                        <div>📍 {delivery.pickup.address} → {delivery.dropoff.address}</div>
                        <div>🕒 Completed: {new Date(delivery.deliveredAt || delivery.updatedAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-green-600">✅</div>
                      <div className="text-xs text-gray-500">
                        {delivery.route?.distance && `${(delivery.route.distance / 1000).toFixed(1)} km`}
                      </div>
                    </div>
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
