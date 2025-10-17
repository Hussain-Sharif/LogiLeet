import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { api } from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { DeliveryMap } from '@/components/maps/DeliveryMap';

const schema = z.object({
  description: z.string().min(3, 'Description must be at least 3 characters'),
  priority: z.enum(['low','medium','high','urgent']),
  weight: z.number().min(0.1).optional(),
  volume: z.number().min(0.01).optional(),
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
    defaultValues: { 
      priority: 'medium', 
      isFragile: false,
      weight: undefined,
      volume: undefined 
    }
  });
  const nav = useNavigate();
  
  const [pickup, setPickup] = useState<LocationData | null>(null);
  const [dropoff, setDropoff] = useState<LocationData | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [dropoffSearch, setDropoffSearch] = useState('');
  const [isSearching, setIsSearching] = useState(false);

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
    } catch (error) {
      console.error('Location search failed:', error);
      return [];
    }
  };

  const handleLocationSearch = async (query: string, type: 'pickup' | 'dropoff') => {
    if (query.length < 3) return;
    setIsSearching(true);
    
    try {
      const results = await searchLocation(query);
      setIsSearching(false);
      
      if (results.length > 0) {
        const location = results[0];
        if (type === 'pickup') {
          setPickup(location);
          toast.success('✅ Pickup location set');
        } else {
          setDropoff(location);
          toast.success('✅ Dropoff location set');
        }
      } else {
        toast.error('❌ Location not found. Please try a more specific address');
      }
    } catch (error) {
      setIsSearching(false);
      toast.error('Search failed. Please try again');
    }
  };

  const onSubmit = async (v: FormValues) => {
    if (!pickup || !dropoff) {
      toast.error('❌ Please set both pickup and dropoff locations');
      return;
    }

    try {
      const requestBody = {
        pickup: { 
          latitude: pickup.latitude, 
          longitude: pickup.longitude, 
          address: pickup.address 
        },
        dropoff: { 
          latitude: dropoff.latitude, 
          longitude: dropoff.longitude, 
          address: dropoff.address 
        },
        packageDetails: {
          description: v.description,
          weight: v.weight || undefined,
          volume: v.volume || undefined,
          specialInstructions: v.specialInstructions || undefined,
          isFragile: v.isFragile || false
        },
        priority: v.priority
      };

      console.log('Sending request:', requestBody); // Debug log
      const res = await api.post('/deliveries', requestBody);
      
      toast.success('🎉 Delivery created successfully!');
      nav(`/customer/delivery/${res.data.data.delivery._id}`);
    } catch (e: any) {
      console.error('Create delivery error:', e);
      toast.error(e?.response?.data?.message || 'Failed to create delivery');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Create New Delivery</h1>
        <p className="text-gray-600">Schedule a pickup and delivery with our fleet</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: Form */}
        <div className="space-y-6">
          {/* Location Selection */}
          <div className="bg-white rounded-xl border p-6 space-y-6">
            <h2 className="font-semibold text-lg">📍 Delivery Locations</h2>
            
            {/* Pickup */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">From (Pickup Location)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter pickup address (e.g., Vijayawada, Andhra Pradesh)"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  value={pickupSearch}
                  onChange={(e) => setPickupSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(pickupSearch, 'pickup')}
                />
                <button
                  type="button"
                  onClick={() => handleLocationSearch(pickupSearch, 'pickup')}
                  disabled={isSearching || pickupSearch.length < 3}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? '⏳' : '🔍'}
                </button>
              </div>
              {pickup && (
                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">✅ {pickup.address}</div>
                  <div className="text-xs text-green-600">{pickup.latitude.toFixed(4)}, {pickup.longitude.toFixed(4)}</div>
                </div>
              )}
            </div>

            {/* Dropoff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">To (Dropoff Location)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter dropoff address (e.g., Hyderabad, Telangana)"
                  className="flex-1 border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                  value={dropoffSearch}
                  onChange={(e) => setDropoffSearch(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleLocationSearch(dropoffSearch, 'dropoff')}
                />
                <button
                  type="button"
                  onClick={() => handleLocationSearch(dropoffSearch, 'dropoff')}
                  disabled={isSearching || dropoffSearch.length < 3}
                  className="bg-blue-600 text-white px-4 py-3 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSearching ? '⏳' : '🔍'}
                </button>
              </div>
              {dropoff && (
                <div className="mt-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-sm font-medium text-green-800">✅ {dropoff.address}</div>
                  <div className="text-xs text-green-600">{dropoff.latitude.toFixed(4)}, {dropoff.longitude.toFixed(4)}</div>
                </div>
              )}
            </div>
          </div>

          {/* Package Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border p-6 space-y-6">
            <h2 className="font-semibold text-lg">📦 Package Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What are you sending? *</label>
              <input
                type="text"
                placeholder="e.g., Electronics, Documents, Furniture, Food"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500"
                {...register('description')}
              />
              {errors.description && <p className="text-red-600 text-sm mt-1">{errors.description.message}</p>}
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weight (kg)</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="0.5"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  {...register('weight', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Volume (m³)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
                  {...register('volume', { valueAsNumber: true })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg px-4 py-3"
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
                className="h-4 w-4 text-blue-600"
                {...register('isFragile')} 
              />
              <label htmlFor="fragile" className="text-sm text-gray-700">📱 Fragile item - Handle with care</label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Special Instructions</label>
              <textarea
                rows={4}
                placeholder="Any special handling instructions, contact details, or delivery notes..."
                className="w-full border border-gray-300 rounded-lg px-4 py-3"
                {...register('specialInstructions')}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !pickup || !dropoff}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors text-lg"
            >
              {isSubmitting ? '🔄 Creating Delivery...' : '🚚 Schedule Delivery'}
            </button>
          </form>
        </div>

        {/* Right: Preview Map */}
        <div className="space-y-6">
          {pickup && dropoff ? (
            <div className="bg-white rounded-xl border overflow-hidden">
              <div className="p-4 border-b">
                <h3 className="font-semibold">🗺️ Route Preview</h3>
                <p className="text-sm text-gray-600">Preview of your delivery route</p>
              </div>
              <DeliveryMap
                pickup={{ lat: pickup.latitude, lng: pickup.longitude }}
                dropoff={{ lat: dropoff.latitude, lng: dropoff.longitude }}
                height="400px"
              />
            </div>
          ) : (
            <div className="bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-8 text-center">
              <div className="text-4xl mb-4">🗺️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Route Preview</h3>
              <p className="text-gray-600">Set pickup and dropoff locations to see route preview</p>
            </div>
          )}

          {pickup && dropoff && (
            <div className="bg-white rounded-xl border p-6">
              <h3 className="font-semibold mb-4">📋 Delivery Summary</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{pickup.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{dropoff.address}</span>
                </div>
                <div className="pt-3 border-t text-xs text-gray-500">
                  Exact route and delivery time will be calculated after driver assignment
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
