import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';
import DeliveryAssignmentModal from './DeliveryAssignmentModal';
// import DeliveryAssignmentModal from '@/components/admin/DeliveryAssignmentModal';

export default function Deliveries() {
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data,
    refetchInterval: 30000
  });

  const deliveries = data?.deliveries || [];
  const pendingCount = deliveries.filter((d: any) => d.status === 'pending').length;

  const handleViewDelivery = (delivery: any) => {
    if (delivery.status === 'pending') {
      setSelectedDelivery(delivery);
      setShowModal(true);
    } else {
      // Redirect to tracking page for assigned/active deliveries
      window.location.href = `/admin/delivery/${delivery._id}`;
    }
  };

  if (isLoading) return <div className="text-center py-8">Loading deliveries...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📦 Delivery Management</h1>
          <p className="text-gray-600">{pendingCount} deliveries pending assignment</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/vehicles" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
            Manage Vehicles
          </Link>
          <Link to="/admin/users" className="bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg">
            Manage Users
          </Link>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="font-semibold">All Deliveries</h2>
        </div>

        <div className="divide-y">
          {deliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📋</div>
              <h3 className="text-lg font-medium">No deliveries found</h3>
              <p className="text-gray-600">Customer delivery requests will appear here</p>
            </div>
          ) : (
            deliveries.map((delivery: any) => (
              <div key={delivery._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="font-semibold text-lg">#{delivery._id.slice(-6)}</h3>
                      <DeliveryStatusBadge status={delivery.status} />
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                        {delivery.priority}
                      </span>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <span className="ml-2 font-medium">{delivery.customerId?.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Package:</span>
                          <span className="ml-2">{delivery.packageDetails.description}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">From:</span>
                          <span className="ml-2">{delivery.pickup.address}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600">Driver:</span>
                          <span className="ml-2">{delivery.driverId?.name || 'Not assigned'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Vehicle:</span>
                          <span className="ml-2">{delivery.vehicleId?.vehicleNumber || 'Not assigned'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">To:</span>
                          <span className="ml-2">{delivery.dropoff.address}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDelivery(delivery)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        delivery.status === 'pending'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {delivery.status === 'pending' ? '⚙️ Assign' : '🗺️ Track Live'}
                    </button>
                    <div className="text-xs text-gray-500 text-center">
                      {new Date(delivery.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Assignment Modal */}
      <DeliveryAssignmentModal
        delivery={selectedDelivery}
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedDelivery(null);
        }}
      />
    </div>
  );
}
