// frontend/src/pages/customer/CreateDelivery.tsx
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const schema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  priority: z.enum(['low','medium','high','urgent']),
  weight: z.number().optional(),
  volume: z.number().optional(),
  specialInstructions: z.string().optional(),
  isFragile: z.boolean().optional()
});

type FormValues = z.infer<typeof schema>;

interface LocationData {
  address: string;
  latitude: number;
  longitude: number;
}

export default function CreateDelivery() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'medium', isFragile: false }
  });
  const nav = useNavigate();
  
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [dropoff, setDropoff] = useState<LocationData | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Geocoding function using TomTom
  const searchLocation = async (query: string): Promise<LocationData[]> => {
    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/search/${encodeURIComponent(query)}.json?key=${import.meta.env.VITE_TOMTOM_API_KEY}&limit=5&countrySet=IN`
      );
      const data = await response.json();
      return data.results?.map((r: any) => ({
        address: r.address.freeformAddress,
        latitude: r.position.lat,
        longitude: r.position.lon
      })) || [];
    } catch {
      return [];
    }
  };

  const handleLocationSearch = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) return;
    setIsSearching(true);
    const results = await searchLocation(query);
    setIsSearching(false);
    
    if (results.length > 0) {
      const location = results[0]; // Use first result for simplicity
      if (type === 'pickup') {
        setPickup(location);
        toast.success('Pickup location set');
      } else {
        setDropoff(location);
        toast.success('Dropoff location set');
      }
    } else {
      toast.error('Location not found');
    }
  };

  const onSubmit = async (v: FormValues) => {
    if (!pickup || !dropoff) {
      toast.error('Please set both pickup and dropoff locations');
      return;
    }

    try {
      const body = {
        pickup: { latitude: pickup.latitude, longitude: pickup.longitude, address: pickup.address },
        dropoff: { latitude: dropoff.latitude, longitude: dropoff.longitude, address: dropoff.address },
        packageDetails: {
          description: v.description,
          weight: v.weight,
          volume: v.volume,
          specialInstructions: v.specialInstructions,
          isFragile: v.isFragile
        },
        priority: v.priority
      };
      const res = await api.post('/deliveries', body);
      toast.success('Delivery created successfully!');
      nav(`/customer/delivery/${res.data.data.delivery._id}`);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Failed to create delivery');
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-medium">1</div>
        <h1 className="text-2xl font-semibold">Create New Delivery</h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Location Selection */}
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <h2 className="font-medium text-gray-900">📍 Delivery Locations</h2>
          
          {/* Pickup Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Pickup Location</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search pickup location (e.g., Vijayawada, Andhra Pradesh)"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={pickupSearch}
                onChange={(e) => setPickupSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(pickupSearch, 'pickup')}
              />
              <button
                type="button"
                onClick={() => handleLocationSearch(pickupSearch, 'pickup')}
                disabled={isSearching || pickupSearch.length < 3}
                className="absolute right-2 top-2 bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                {isSearching ? '...' : 'Set'}
              </button>
            </div>
            {pickup && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800">✅ Pickup: {pickup.address}</div>
                <div className="text-xs text-green-600">{pickup.latitude.toFixed(4)}, {pickup.longitude.toFixed(4)}</div>
              </div>
            )}
          </div>

          {/* Dropoff Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Dropoff Location</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search dropoff location (e.g., Hyderabad, Telangana)"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={dropoffSearch}
                onChange={(e) => setDropoffSearch(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(dropoffSearch, 'dropoff')}
              />
              <button
                type="button"
                onClick={() => handleLocationSearch(dropoffSearch, 'dropoff')}
                disabled={isSearching || dropoffSearch.length < 3}
                className="absolute right-2 top-2 bg-blue-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
              >
                {isSearching ? '...' : 'Set'}
              </button>
            </div>
            {dropoff && (
              <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="text-sm font-medium text-green-800">✅ Dropoff: {dropoff.address}</div>
                <div className="text-xs text-green-600">{dropoff.latitude.toFixed(4)}, {dropoff.longitude.toFixed(4)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Package Details */}
        <div className="rounded-lg border bg-white p-6 space-y-4">
          <h2 className="font-medium text-gray-900">📦 Package Information</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Package Description *</label>
            <input
              type="text"
              placeholder="e.g., Electronics, Documents, Furniture"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('description')}
            />
            {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
              <input
                type="number"
                step="0.1"
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('weight', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Volume (m³)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Optional"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('volume', { valueAsNumber: true })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
              <select 
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                {...register('priority')}
              >
                <option value="low">🟢 Low</option>
                <option value="medium">🟡 Medium</option>
                <option value="high">🟠 High</option>
                <option value="urgent">🔴 Urgent</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <input 
              type="checkbox" 
              id="fragile"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register('isFragile')} 
            />
            <label htmlFor="fragile" className="text-sm text-gray-700">📱 Fragile item - Handle with care</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
            <textarea
              rows={3}
              placeholder="Any special handling instructions, delivery notes, etc."
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              {...register('specialInstructions')}
            />
          </div>
        </div>

        {pickup && dropoff && (
          <div className="rounded-lg border bg-white p-4">
            <div className="font-medium mb-2">Preview Route</div>
            <DeliveryMap
              pickup={{ lat: pickup.latitude, lng: pickup.longitude }}
              dropoff={{ lat: dropoff.latitude, lng: dropoff.longitude }}
              height="260px"
            />
            <div className="text-xs text-gray-600 mt-2">This is a preview. Exact route and ETA will be available after assignment.</div>
          </div>
          )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting || !pickup || !dropoff}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-4 px-6 rounded-lg transition-colors"
        >
          {isSubmitting ? '🔄 Creating Delivery...' : '🚚 Create Delivery Request'}
        </button>
      </form>
    </div>
  );
}
