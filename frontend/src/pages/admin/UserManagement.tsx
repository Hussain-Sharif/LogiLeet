import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';

const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  role: z.enum(['admin', 'driver', 'customer']),
  licenseNumber: z.string().optional(),
  licenseExpiry: z.string().optional(),
  address: z.string().optional()
});

type UserForm = z.infer<typeof userSchema>;

export default function UserManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'driver' | 'customer'>('all');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', activeTab],
    queryFn: async () => {
      const role = activeTab === 'all' ? '' : activeTab;
      return (await api.get(`/admin/users${role ? `?role=${role}` : ''}`)).data.data;
    }
  });

  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
    defaultValues: { role: 'customer' }
  });

  const selectedRole = watch('role');

  const addMutation = useMutation({
    mutationFn: async (data: UserForm) => (await api.post('/admin/users', data)).data,
    onSuccess: () => {
      toast.success('User created successfully');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAddForm(false);
      reset();
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to create user')
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) =>
      (await api.put(`/admin/users/${id}`, data)).data,
    onSuccess: () => {
      toast.success('User updated successfully');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (e: any) => toast.error(e.response?.data?.message || 'Failed to update user')
  });

  const onSubmit = (data: UserForm) => {
    const payload = { ...data };
    if (data.role === 'driver') {
      payload.licenseExpiry = data.licenseExpiry ? new Date(data.licenseExpiry).toISOString() : undefined;
    }
    addMutation.mutate(payload);
  };

  const users = data?.users || [];

  if (isLoading) return <div className="text-center py-8">Loading users...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-gray-600">Manage drivers, customers and admins</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
        >
          + Add User
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'All Users' },
          { key: 'driver', label: 'Drivers' },
          { key: 'customer', label: 'Customers' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Create New User</h3>
            <button
              onClick={() => { setShowAddForm(false); reset(); }}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Full Name</label>
              <input
                {...register('name')}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="John Doe"
              />
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Email</label>
              <input
                {...register('email')}
                type="email"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="john@example.com"
              />
              {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <input
                {...register('password')}
                type="password"
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Min 6 characters"
              />
              {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Phone</label>
              <input
                {...register('phone')}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="9876543210"
              />
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Role</label>
              <select {...register('role')} className="w-full border rounded-lg px-3 py-2">
                <option value="customer">Customer</option>
                <option value="driver">Driver</option>
                <option value="admin">Admin</option>
              </select>
            </div>

            {selectedRole === 'driver' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-1">License Number</label>
                  <input
                    {...register('licenseNumber')}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="DL123456789"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">License Expiry</label>
                  <input
                    {...register('licenseExpiry')}
                    type="date"
                    className="w-full border rounded-lg px-3 py-2"
                  />
                </div>
              </>
            )}

            {selectedRole === 'customer' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  {...register('address')}
                  className="w-full border rounded-lg px-3 py-2"
                  rows={3}
                  placeholder="Complete address"
                />
              </div>
            )}

            <div className="md:col-span-2 flex gap-3">
              <button
                type="submit"
                disabled={addMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg disabled:opacity-50"
              >
                {addMutation.isPending ? 'Creating...' : 'Create User'}
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

      {/* Users List */}
      <div className="bg-white border rounded-lg">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold">
            {activeTab === 'all' ? 'All Users' : `${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}s`}
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-4">User</th>
                <th className="text-left p-4">Role</th>
                <th className="text-left p-4">Phone</th>
                <th className="text-left p-4">Status</th>
                <th className="text-left p-4">Created</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user: any) => (
                <tr key={user._id} className="border-b hover:bg-gray-50">
                  <td className="p-4">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-gray-600">{user.email}</div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs capitalize ${
                      user.role === 'admin' 
                        ? 'bg-purple-100 text-purple-800'
                        : user.role === 'driver'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="p-4">{user.phone}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateMutation.mutate({ 
                          id: user._id, 
                          data: { isActive: !user.isActive } 
                        })}
                        className={`text-sm ${
                          user.isActive 
                            ? 'text-red-600 hover:text-red-700' 
                            : 'text-green-600 hover:text-green-700'
                        }`}
                      >
                        {user.isActive ? 'Deactivate' : 'Activate'}
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
