import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Link } from 'react-router-dom';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';
import DeliveryAssignmentModal from './DeliveryAssignmentModal';
// import DeliveryAssignmentModal from '@/components/admin/DeliveryAssignmentModal';

type StatusFilter = 'all' | 'pending' | 'assigned' | 'picked_up' | 'on_route' | 'delivered' | 'cancelled';

export default function Deliveries() {
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-deliveries'],
    queryFn: async () => (await api.get('/deliveries')).data.data,
    refetchInterval: 30000
  });

  const deliveries = data?.deliveries || [];

  // Filter deliveries based on status and search
  const filteredDeliveries = deliveries.filter((delivery: any) => {
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter;
    const matchesSearch = !searchQuery || 
      delivery._id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.customerId?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.packageDetails?.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesStatus && matchesSearch;
  });

  const handleViewDelivery = (delivery: any) => {
    if (delivery.status === 'pending') {
      setSelectedDelivery(delivery);
      setShowModal(true);
    } else {
      window.location.href = `/admin/delivery/${delivery._id}`;
    }
  };

  // Status counts for filter badges
  const statusCounts = {
    all: deliveries.length,
    pending: deliveries.filter((d: any) => d.status === 'pending').length,
    assigned: deliveries.filter((d: any) => d.status === 'assigned').length,
    picked_up: deliveries.filter((d: any) => d.status === 'picked_up').length,
    on_route: deliveries.filter((d: any) => d.status === 'on_route').length,
    delivered: deliveries.filter((d: any) => d.status === 'delivered').length,
    cancelled: deliveries.filter((d: any) => d.status === 'cancelled').length
  };

  if (isLoading) return <div className="text-center py-8">Loading deliveries...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📦 Delivery Management</h1>
          <p className="text-gray-600">{statusCounts.pending} pending • {statusCounts.on_route + statusCounts.picked_up} active • {statusCounts.delivered} completed</p>
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

      {/* Filters */}
      <div className="bg-white rounded-lg border p-6">
        <div className="space-y-4">
          {/* Search Bar */}
          <div>
            <input
              type="text"
              placeholder="Search by ID, customer name, or package description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Status Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {([
              { key: 'all', label: 'All', color: 'bg-gray-100 text-gray-700' },
              { key: 'pending', label: 'Pending', color: 'bg-orange-100 text-orange-700' },
              { key: 'assigned', label: 'Assigned', color: 'bg-blue-100 text-blue-700' },
              { key: 'picked_up', label: 'Picked Up', color: 'bg-amber-100 text-amber-700' },
              { key: 'on_route', label: 'On Route', color: 'bg-purple-100 text-purple-700' },
              { key: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700' },
              { key: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700' }
            ] as const).map((filter) => (
              <button
                key={filter.key}
                onClick={() => setStatusFilter(filter.key)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  statusFilter === filter.key
                    ? filter.color + ' ring-2 ring-offset-2 ring-blue-500'
                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
              >
                {filter.label} ({statusCounts[filter.key]})
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      <div className="bg-white rounded-xl border">
        <div className="p-6 border-b">
          <h2 className="font-semibold">
            {statusFilter === 'all' ? 'All Deliveries' : `${statusFilter.charAt(0).toUpperCase() + statusFilter.slice(1).replace('_', ' ')} Deliveries`}
            {searchQuery && ` matching "${searchQuery}"`}
          </h2>
          <p className="text-sm text-gray-600 mt-1">Showing {filteredDeliveries.length} of {deliveries.length} deliveries</p>
        </div>

        <div className="divide-y">
          {filteredDeliveries.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">
                {searchQuery ? '🔍' : statusFilter === 'pending' ? '⏳' : '📋'}
              </div>
              <h3 className="text-lg font-medium">
                {searchQuery ? 'No matching deliveries' : `No ${statusFilter === 'all' ? '' : statusFilter} deliveries found`}
              </h3>
              <p className="text-gray-600">
                {searchQuery ? 'Try adjusting your search terms' : 'Delivery requests will appear here'}
              </p>
            </div>
          ) : (
            filteredDeliveries.map((delivery: any) => (
              <div key={delivery._id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="font-semibold text-lg">#{delivery._id.slice(-6)}</h3>
                      <DeliveryStatusBadge status={delivery.status} />
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full capitalize">
                        {delivery.priority}
                      </span>
                      {delivery.status === 'cancelled' && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                          ❌ Cancelled
                        </span>
                      )}
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-600">Customer:</span>
                          <span className="ml-2 font-medium">{delivery.customerId?.name}</span>
                        </div>
                        <div>
                          <span className="text-gray-600">Package:</span>
                          <span className="ml-2">{delivery.packageDetails?.description}</span>
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

                    {/* Cancellation reason if cancelled */}
                    {delivery.status === 'cancelled' && delivery.driverNotes && (
                      <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                        <div className="text-sm">
                          <span className="font-medium text-red-800">Cancellation Reason:</span>
                          <span className="ml-2 text-red-700">{delivery.driverNotes.replace('CANCELLED: ', '')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDelivery(delivery)}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        delivery.status === 'pending'
                          ? 'bg-blue-600 hover:bg-blue-700 text-white'
                          : delivery.status === 'cancelled'
                          ? 'bg-gray-100 text-gray-600'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                    >
                      {delivery.status === 'pending' ? '⚙️ Assign' : 
                       delivery.status === 'cancelled' ? '📄 View' :
                       '🗺️ Track Live'}
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
