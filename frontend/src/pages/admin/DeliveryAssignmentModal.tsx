import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import DeliveryStatusBadge from '@/components/deliveries/DeliveryStatusBadge';

interface Props {
  delivery: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function DeliveryAssignmentModal({ delivery, isOpen, onClose }: Props) {
  const [selectedDriver, setSelectedDriver] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [scheduledPickup, setScheduledPickup] = useState('');
  const [scheduledDelivery, setScheduledDelivery] = useState('');
  const qc = useQueryClient();

  const { data: driversData } = useQuery({
    queryKey: ['available-drivers'],
    queryFn: async () => (await api.get('/admin/drivers/available')).data.data,
    enabled: isOpen
  });

  const { data: vehiclesData } = useQuery({
    queryKey: ['available-vehicles'],
    queryFn: async () => (await api.get('/vehicles?isAvailable=true')).data.data,
    enabled: isOpen
  });

  const assignMutation = useMutation({
    mutationFn: async () => {
      const payload: any = {
        driverId: selectedDriver,
        vehicleId: selectedVehicle
      };
      if (scheduledPickup) payload.scheduledPickupTime = new Date(scheduledPickup);
      if (scheduledDelivery) payload.scheduledDeliveryTime = new Date(scheduledDelivery);
      
      return (await api.put(`/deliveries/${delivery._id}/assign`, payload)).data;
    },
    onSuccess: () => {
      toast.success('✅ Delivery assigned successfully!');
      qc.invalidateQueries({ queryKey: ['admin-deliveries'] });
      onClose();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Assignment failed')
  });

  const drivers = driversData?.drivers || [];
  const vehicles = vehiclesData?.vehicles || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">📋 Assign Delivery #{delivery._id.slice(-6)}</h2>
              <p className="text-sm text-gray-600 mt-1">Configure delivery assignment details</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Delivery Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-600">Customer</div>
                <div className="font-medium">{delivery.customerId?.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Package</div>
                <div className="font-medium">{delivery.packageDetails.description}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Priority</div>
                <div className="font-medium capitalize">{delivery.priority}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600">Status</div>
                <DeliveryStatusBadge status={delivery.status} />
              </div>
            </div>
          </div>

          {/* Assignment Form */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Select Driver *</label>
              <select
                value={selectedDriver}
                onChange={(e) => setSelectedDriver(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Choose available driver</option>
                {drivers.map((driver: any) => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} • {driver.phone}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Select Vehicle *</label>
              <select
                value={selectedVehicle}
                onChange={(e) => setSelectedVehicle(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                required
              >
                <option value="">Choose available vehicle</option>
                {vehicles.map((vehicle: any) => (
                  <option key={vehicle._id} value={vehicle._id}>
                    {vehicle.vehicleNumber} • {vehicle.vehicleBrand} {vehicle.vehicleModel} ({vehicle.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Scheduling */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Scheduled Pickup Time</label>
              <input
                type="datetime-local"
                value={scheduledPickup}
                onChange={(e) => setScheduledPickup(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Expected Delivery Time</label>
              <input
                type="datetime-local"
                value={scheduledDelivery}
                onChange={(e) => setScheduledDelivery(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
                min={scheduledPickup || new Date().toISOString().slice(0, 16)}
              />
            </div>
          </div>

          {/* Route Preview */}
          <div className="text-sm text-gray-600 bg-blue-50 p-4 rounded-lg">
            📍 <strong>Route:</strong> {delivery.pickup.address} → {delivery.dropoff.address}
            <br />
            ⏱️ Route and ETA will be calculated automatically upon assignment
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t bg-gray-50 flex items-center justify-between rounded-b-xl">
          <Link
            to={`/admin/delivery/${delivery._id}`}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            🗺️ Track Live After Assignment
          </Link>
          
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              onClick={() => assignMutation.mutate()}
              disabled={!selectedDriver || !selectedVehicle || assignMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
            >
              {assignMutation.isPending ? 'Assigning...' : 'Assign & Calculate Route'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
