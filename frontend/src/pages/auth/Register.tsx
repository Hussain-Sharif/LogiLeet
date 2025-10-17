import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { useNavigate, Link } from 'react-router-dom';

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  address: z.string().min(5)
});

type FormValues = z.infer<typeof schema>;

export default function Register() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });
  const nav = useNavigate();

  const onSubmit = async (v: FormValues) => {
    try {
      await api.post('/auth/register', { ...v, role: 'customer' });
      toast.success('Account created! Please login');
      nav('/login');
    } catch (e: any) {
      toast.error(e?.response?.data?.message || 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-2xl font-semibold mb-2">Create Account</h1>
        <p className="text-gray-600 mb-6">Register as a customer to request deliveries</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input className="w-full border rounded px-3 py-2" {...register('name')} />
            {errors.name && <p className="text-red-600 text-sm">{errors.name.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input className="w-full border rounded px-3 py-2" type="email" {...register('email')} />
            {errors.email && <p className="text-red-600 text-sm">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input className="w-full border rounded px-3 py-2" type="password" {...register('password')} />
            {errors.password && <p className="text-red-600 text-sm">{errors.password.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input className="w-full border rounded px-3 py-2" {...register('phone')} />
            {errors.phone && <p className="text-red-600 text-sm">{errors.phone.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Address</label>
            <textarea className="w-full border rounded px-3 py-2" rows={3} {...register('address')} />
            {errors.address && <p className="text-red-600 text-sm">{errors.address.message}</p>}
          </div>

          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded"
          >
            {isSubmitting ? 'Creating...' : 'Create Account'}
          </button>
        </form>

        <div className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <Link to="/login" className="text-emerald-700">Login</Link>
        </div>
      </div>
    </div>
  );
}
