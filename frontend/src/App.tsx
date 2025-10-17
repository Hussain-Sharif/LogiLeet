import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import CreateDelivery from './pages/customer/CreateDelivery';
import DeliveryDetails from './pages/shared/DeliveryDetails';
import Deliveries from './pages/admin/Deliveries';
import UserManagement from './pages/admin/UserManagement';
import VehicleManagement from './pages/admin/VehicleManagement';
import DriverDeliveryDetail from './pages/driver/DriverDeliveryDetail';
import DriverHistory from './pages/driver/DriverHistory';
import AppLayout from './components/layout/AppLayout';
import { useAuth } from './store/auth';
import { Toaster } from 'react-hot-toast';
import './index.css';
import type { JSX } from 'react';
import MapTest from './test/maptest';

function PrivateRoute({ children, roles }: { children: JSX.Element; roles?: Array<'admin' | 'driver' | 'customer'> }) {
  const user = useAuth((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Toaster position="top-right" />
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          {/* Dashboard Routes */}
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><AdminDashboard /></AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/driver" element={
            <PrivateRoute roles={['driver']}>
              <AppLayout><DriverDashboard /></AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/customer" element={
            <PrivateRoute roles={['customer']}>
              <AppLayout><CustomerDashboard /></AppLayout>
            </PrivateRoute>
          } />
<Route path="/test-map" element={<MapTest />} />

          {/* Customer Routes */}
          <Route path="/customer/new" element={
            <PrivateRoute roles={['customer']}>
              <AppLayout><CreateDelivery /></AppLayout>
            </PrivateRoute>
          } />

          <Route path="/customer/delivery/:id" element={
            <PrivateRoute roles={['customer','admin']}>
              <AppLayout><DeliveryDetails role="customer"/></AppLayout>
            </PrivateRoute>
          } />

          {/* Admin Routes */}
          <Route path="/admin/deliveries" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><Deliveries /></AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/admin/delivery/:id" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><DeliveryDetails role={"admin"} /></AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/admin/users" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><UserManagement /></AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/admin/vehicles" element={
            <PrivateRoute roles={['admin']}>
              <AppLayout><VehicleManagement /></AppLayout>
            </PrivateRoute>
          } />

          {/* Driver Routes */}
          <Route path="/driver/delivery/:id" element={
            <PrivateRoute roles={['driver','admin']}>
              <AppLayout><DriverDeliveryDetail /></AppLayout>
            </PrivateRoute>
          } />
          
          <Route path="/driver/history" element={
            <PrivateRoute roles={['driver']}>
              <AppLayout><DriverHistory /></AppLayout>
            </PrivateRoute>
          } />

          {/* Default Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">404</div>
                <h3 className="text-lg font-medium">Page Not Found</h3>
              </div>
            </div>
          } />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
