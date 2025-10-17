import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/store/auth';
import NotificationBell from './NotificationBell';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, clearAuth } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();

  const handleLogout = () => {
    clearAuth();
    nav('/login', { replace: true });
  };

  const items = user?.role === 'admin'
    ? [
        { to: '/admin', label: 'Dashboard' }, 
        { to: '/admin/deliveries', label: 'Deliveries' },
        { to: '/admin/vehicles', label: 'Vehicles' },
        { to: '/admin/users', label: 'Users' }
      ]
    : user?.role === 'driver'
    ? [{ to: '/driver', label: 'My Deliveries' }]
    : [
        { to: '/customer', label: 'My Deliveries' }, 
        { to: '/customer/new', label: 'Create Delivery' }
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="h-16 border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between px-6">
          <Link 
            to={user ? `/${user.role}` : '/login'} 
            className="text-2xl font-bold text-blue-600 hover:text-blue-700"
          >
            🚚 LogiLeet
          </Link>
          
          <nav className="flex gap-8">
            {items.map(i => (
              <Link 
                key={i.to} 
                to={i.to} 
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  loc.pathname === i.to 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                {i.label}
              </Link>
            ))}
          </nav>
          
          <div className="flex items-center gap-4">
            <NotificationBell />
            <div className="text-sm">
              <div className="font-medium">{user?.name}</div>
              <div className="text-gray-500 capitalize">{user?.role}</div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto p-6">
        {children}
      </main>
    </div>
  );
}
