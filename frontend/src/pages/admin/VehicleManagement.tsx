import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const vehicleSchema = z.object({
  vehicleNumber: z.string().regex(/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, 'Invalid vehicle number format'),
  type: z.enum(['bike', 'car', 'truck', 'van']),
  vehicleBrand: z.string().min(1, 'Brand is required'),
  vehicleModel: z.string().min(1, 'Model is required'),
  capacity: z.object({
    weight: z.number().min(1),
    volume: z.number().min(0.1)
  }),
  registrationExpiry: z.string(),
  insuranceExpiry: z.string()
});

type VehicleForm = z.infer<typeof vehicleSchema>;

export default function VehicleManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-vehicles-all'],
    queryFn: async () => (await api.get('/vehicles')).data.data
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<VehicleForm>({
    resolver: zodResolver(vehicleSchema)
  });

  const addMutation = useMutation({
    mutationFn: async (data: VehicleForm) => (await api.post('/vehicles', data)).data,
    onSuccess: () => {
      toast.success('Vehicle added successfully');
      qc.invalidateQueries({ queryKey: ['admin-vehicles-all'] });
      setShowAddForm(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to add vehicle')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<VehicleForm> }) =>
      (await api.put(`/vehicles/${id}`, data)).data,
    onSuccess: () => {
      toast.success('Vehicle updated successfully');
      qc.invalidateQueries({ queryKey: ['admin-vehicles-all'] });
      setEditingVehicle(null);
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update vehicle')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => (await api.delete(`/vehicles/${id}`)).data,
    onSuccess: () => {
      toast.success('Vehicle deleted successfully');
      qc.invalidateQueries({ queryKey: ['admin-vehicles-all'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to delete vehicle')
  });

  const assignDriverMutation = useMutation({
    mutationFn: async ({ vehicleId, driverId }: { vehicleId: string; driverId: string }) =>
      (await api.post(`/vehicles/${vehicleId}/assign-driver`, { driverId })).data,
    onSuccess: () => {
      toast.success('Driver assigned successfully');
      qc.invalidateQueries({ queryKey: ['admin-vehicles-all'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to assign driver')
  });

  const unassignDriverMutation = useMutation({
    mutationFn: async (vehicleId: string) =>
      (await api.delete(`/vehicles/${vehicleId}/unassign-driver`)).data,
    onSuccess: () => {
      toast.success('Driver unassigned successfully');
      qc.invalidateQueries({ queryKey: ['admin-vehicles-all'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to unassign driver')
  });

  const onSubmit = (formData: VehicleForm) => {
    const data = {
      ...formData,
      registrationExpiry: new Date(formData.registrationExpiry),
      insuranceExpiry: new Date(formData.insuranceExpiry)
    };
    addMutation.mutate(data);
  };

  const vehicles = data?.vehicles || [];

  if (isLoading) return <div className="text-center py-8">Loading vehicles...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Management</h1>
          <p className="text-gray-600">Manage your fleet vehicles</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          + Add Vehicle
        </button>
      </div>

      {/* Add Vehicle Form */}
      {showAddForm && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Add New Vehicle</h3>
            <button
              onClick={() => { setShowAddForm(false); reset(); }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Vehicle Number</label>
              <input
                {...register('vehicleNumber')}
                placeholder="TS09AB1234"
                className="w-full border rounded-lg px-3 py-2"
              />
              {errors.vehicleNumber && <p className="text-red-600 text-sm mt-1">{errors.vehicleNumber.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select {...register('type')} className="w-full border rounded-lg px-3 py-2">
                <option value="bike">Bike</option>
                <option value="car">Car</option>
                <option value="truck">Truck</option>
                <option value="van">Van</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Brand</label>
              <input
                {...register('vehicleBrand')}
                placeholder="Honda, Tata, etc."
                className="w-full border rounded-lg px-3 py-2"
              />
              {errors.vehicleBrand && <p className="text-red-600 text-sm mt-1">{errors.vehicleBrand.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Model</label>
              <input
                {...register('vehicleModel')}
                placeholder="City, Ace, etc."
                className="w-full border rounded-lg px-3 py-2"
              />
              {errors.vehicleModel && <p className="text-red-600 text-sm mt-1">{errors.vehicleModel.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Weight Capacity (kg)</label>
              <input
                {...register('capacity.weight', { valueAsNumber: true })}
                type="number"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Volume Capacity (m³)</label>
              <input
                {...register('capacity.volume', { valueAsNumber: true })}
                type="number"
                step="0.1"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Registration Expiry</label>
              <input
                {...register('registrationExpiry')}
                type="date"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Insurance Expiry</label>
              <input
                {...register('insuranceExpiry')}
                type="date"
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {addMutation.isPending ? 'Adding...' : 'Add Vehicle'}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddForm(false); reset(); }}
                className="bg-gray-200 hover:bg-gray-300 px-6 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Vehicles List */}
      <div className="bg-white border rounded-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">Fleet Overview</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">Vehicle</th>
                <th className="text-left p-4">Type</th>
                <th className="text-left p-4">Capacity</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Driver</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle: any) => (
                <tr key={vehicle._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{vehicle.vehicleNumber}</div>
                      <div className="text-sm text-gray-600">{vehicle.vehicleBrand} {vehicle.vehicleModel}</div>
                    </div>
                  </td>
                  <td className="p-4 capitalize">{vehicle.type}</td>
                  <td className="p-4">
                    <div className="text-sm">
                      <div>{vehicle.capacity?.weight}kg</div>
                      <div>{vehicle.capacity?.volume}m³</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      vehicle.isAvailable 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {vehicle.isAvailable ? 'Available' : 'In Use'}
                    </span>
                  </td>
                  <td className="p-4">
                    {vehicle.currentDriver ? (
                      <div>
                        <div className="font-medium">{vehicle.currentDriver.name}</div>
                        <button
                          onClick={() => unassignDriverMutation.mutate(vehicle._id)}
                          className="text-red-600 text-sm hover:text-red-700"
                        >
                          Unassign
                        </button>
                      </div>
                    ) : (
                      <span className="text-gray-400">No driver</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingVehicle(vehicle)}
                        className="text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMutation.mutate(vehicle._id)}
                        className="text-red-600 hover:text-red-700 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
