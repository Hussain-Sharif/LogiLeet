import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';

// Separate schemas for each role
const customerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
  role: z.literal('customer'),
  address: z.string().min(10, 'Please enter your complete address'),
});

const driverSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string()
    .min(6, 'Password must be at least 6 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain uppercase, lowercase, and number'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'),
  role: z.literal('driver'),
  address: z.string().min(10, 'Please enter your complete address'),
  licenseNumber: z.string().min(5, 'Please enter your license number'),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
});

type CustomerForm = z.infer<typeof customerSchema>;
type DriverForm = z.infer<typeof driverSchema>;

export default function Register() {
  const [selectedRole, setSelectedRole] = useState<'customer' | 'driver'>('customer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const nav = useNavigate();

  // Use separate forms for each role to avoid TypeScript union issues
  const customerForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: { role: 'customer' }
  });

  const driverForm = useForm<DriverForm>({
    resolver: zodResolver(driverSchema),
    defaultValues: { role: 'driver' }
  });

  // const currentForm = selectedRole === 'customer' ? customerForm : driverForm;
  // const { register, handleSubmit, formState: { errors }, reset } = currentForm;

  const onSubmit = async (data: CustomerForm | DriverForm) => {
    setIsSubmitting(true);
    try {
      const payload = { ...data };
      if (selectedRole === 'driver') {
        (payload as DriverForm).licenseExpiry = new Date((data as DriverForm).licenseExpiry).toISOString();
      }

      await api.post('/auth/register', payload);
      
      toast.success('🎉 Account created successfully!');
      toast('📧 Please check your email for verification', { duration: 4000 });
      
      setTimeout(() => {
        nav('/login');
      }, 2000);
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRoleChange = (role: 'customer' | 'driver') => {
    setSelectedRole(role);
    // Reset the appropriate form
    if (role === 'customer') {
      customerForm.reset({ role: 'customer' });
    } else {
      driverForm.reset({ role: 'driver' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl font-bold text-emerald-600 mb-2">🚚 LogiLeet</div>
          <h1 className="text-2xl font-bold text-gray-900">Create Your Account</h1>
          <p className="text-gray-600 mt-2">Join our smart logistics platform</p>
        </div>

        <div className="bg-white rounded-xl shadow-xl p-8">
          {/* Role Selection */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center">Choose Your Role</h3>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleRoleChange('customer')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedRole === 'customer'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-2">👤</div>
                <div className="font-semibold text-gray-900">Customer</div>
                <div className="text-sm text-gray-600">Request deliveries</div>
              </button>
              
              <button
                type="button"
                onClick={() => handleRoleChange('driver')}
                className={`p-6 rounded-lg border-2 transition-all ${
                  selectedRole === 'driver'
                    ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-200'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="text-4xl mb-2">🚗</div>
                <div className="font-semibold text-gray-900">Driver</div>
                <div className="text-sm text-gray-600">Deliver packages</div>
              </button>
            </div>
          </div>

          <form onSubmit={selectedRole === 'customer' ? customerForm.handleSubmit(onSubmit) : driverForm.handleSubmit(onSubmit)} className="space-y-6">
            {/* Personal Information */}
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Personal Information</h4>
              
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
    <input
      {...(selectedRole === 'customer' ? customerForm.register('name') : driverForm.register('name'))}
      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      placeholder="John Doe"
    />
    {(selectedRole === 'customer' ? customerForm.formState.errors.name : driverForm.formState.errors.name) && (
      <p className="text-red-600 text-sm mt-1">
        {(selectedRole === 'customer' ? customerForm.formState.errors.name : driverForm.formState.errors.name)?.message}
      </p>
    )}
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number *</label>
      <input
        {...(selectedRole === 'customer' ? customerForm.register('phone') : driverForm.register('phone'))}
        placeholder="9876543210"
        className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
      />
      {(selectedRole === 'customer' ? customerForm.formState.errors.phone : driverForm.formState.errors.phone) && (
        <p className="text-red-600 text-sm mt-1">
          {(selectedRole === 'customer' ? customerForm.formState.errors.phone : driverForm.formState.errors.phone)?.message}
        </p>
      )}
    </div>
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
    <input
      {...(selectedRole === 'customer' ? customerForm.register('email') : driverForm.register('email'))}
      type="email"
      placeholder="john@example.com"
      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    />
    {(selectedRole === 'customer' ? customerForm.formState.errors.email : driverForm.formState.errors.email) && (
      <p className="text-red-600 text-sm mt-1">
        {(selectedRole === 'customer' ? customerForm.formState.errors.email : driverForm.formState.errors.email)?.message}
      </p>
    )}
  </div>

  <div>
    <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
    <input
      {...(selectedRole === 'customer' ? customerForm.register('password') : driverForm.register('password'))}
      type="password"
      placeholder="Strong password with uppercase, lowercase & number"
      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
    />
    {(selectedRole === 'customer' ? customerForm.formState.errors.password : driverForm.formState.errors.password) && (
      <p className="text-red-600 text-sm mt-1">
        {(selectedRole === 'customer' ? customerForm.formState.errors.password : driverForm.formState.errors.password)?.message}
      </p>
    )}
  </div>
            </div>

            {/* Driver-specific fields */}
            {selectedRole === 'driver' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Driver Information</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Number *</label>
                    <input
                      {...driverForm.register('licenseNumber')}
                      placeholder="DL123456789"
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {driverForm.formState.errors.licenseNumber && (
                      <p className="text-red-600 text-sm mt-1">{driverForm.formState.errors.licenseNumber.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">License Expiry Date *</label>
                    <input
                      {...driverForm.register('licenseExpiry')}
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                    {driverForm.formState.errors.licenseExpiry && (
                      <p className="text-red-600 text-sm mt-1">{driverForm.formState.errors.licenseExpiry.message}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

           <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedRole === 'customer' ? 'Delivery Address *' : 'Residential Address *'}
            </label>
            <textarea
              {...(selectedRole === 'customer' ? customerForm.register('address') : driverForm.register('address'))}
              rows={4}
              placeholder="Complete address with pincode"
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
            {(selectedRole === 'customer' ? customerForm.formState.errors.address : driverForm.formState.errors.address) && (
              <p className="text-red-600 text-sm mt-1">
                {(selectedRole === 'customer' ? customerForm.formState.errors.address : driverForm.formState.errors.address)?.message}
              </p>
            )}
          </div>


            {/* Terms and conditions */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="text-sm text-gray-600">
                <p className="mb-2">By creating an account, you agree to:</p>
                <ul className="space-y-1 ml-4">
                  <li>• LogiLeet Terms of Service</li>
                  <li>• Privacy Policy and data processing</li>
                  <li>• {selectedRole === 'driver' ? 'Driver safety and vehicle compliance requirements' : 'Delivery service guidelines'}</li>
                </ul>
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="animate-spin text-xl">🔄</div>
                  Creating Account...
                </span>
              ) : (
                `🚀 Create ${selectedRole === 'customer' ? 'Customer' : 'Driver'} Account`
              )}
            </button>
          </form>

          <div className="text-center text-sm text-gray-600 mt-6">
            Already have an account? <Link to="/login" className="text-emerald-600 font-medium hover:text-emerald-700">Sign In</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
