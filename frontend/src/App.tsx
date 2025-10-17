import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import Login from './pages/auth/Login';
import AdminDashboard from './pages/admin/AdminDashboard';
import DriverDashboard from './pages/driver/DriverDashboard';
import CustomerDashboard from './pages/customer/CustomerDashboard';
import TrackDelivery from './pages/customer/TrackDelivery';
import { useAuth } from './store/auth';
import { Toaster } from 'react-hot-toast';
import './index.css';
import type { JSX } from 'react';
import AppLayout from './components/layout/AppLayout';
import CreateDelivery from './pages/customer/CreateDelivery';
import DeliveryDetails from './pages/shared/DeliveryDetails';
import Deliveries from './pages/admin/Deliveries';
import DriverDelivery from './pages/driver/DriverDelivery';
import AdminDelivery from './pages/admin/AdminDelivery';
import Register from './pages/auth/Register';
import UserManagement from './pages/admin/UserManagement';
import VehicleManagement from './pages/admin/VehicleManagement';
import DriverDeliveryDetail from './pages/driver/DriverDeliveryDetail';
import DriverHistory from './pages/driver/DriverHistory';

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
        <Toaster />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}><AppLayout><AdminDashboard /></AppLayout></PrivateRoute>
          } />
          <Route path="/driver" element={
            <PrivateRoute roles={['driver']}><AppLayout><DriverDashboard /></AppLayout></PrivateRoute>
          } />
          <Route path="/customer" element={
            <PrivateRoute roles={['customer']}><AppLayout><CustomerDashboard /></AppLayout></PrivateRoute>
          } />

          
          <Route path="/customer/delivery/:id" element={
            <PrivateRoute roles={['customer', 'admin']}>
              <TrackDelivery />
            </PrivateRoute>
          } />

          <Route path="/customer/new" element={
            <PrivateRoute roles={['customer']}>
              <AppLayout><CreateDelivery /></AppLayout>
            </PrivateRoute>
          } />

          <Route path="/customer/delivery/:id" element={
            <PrivateRoute roles={['customer','admin']}><AppLayout><DeliveryDetails /></AppLayout></PrivateRoute>
          } />
          <Route path="/admin/delivery/:id" element={
            <PrivateRoute roles={['admin']}><AppLayout><AdminDelivery  /></AppLayout></PrivateRoute>
          } />
         <Route path="/driver/delivery/:id" element={
            <PrivateRoute roles={['driver']}>
              <AppLayout><DriverDeliveryDetail /></AppLayout>
            </PrivateRoute>
          } />
          <Route path="/driver/history" element={
            <PrivateRoute roles={['driver']}>
              <AppLayout><DriverHistory /></AppLayout>
            </PrivateRoute>
          } />

          <Route path="/admin/deliveries" element={
            <PrivateRoute roles={['admin']}><AppLayout><Deliveries /></AppLayout></PrivateRoute>
          } />
          
          <Route path="/admin/users" element={
            <PrivateRoute roles={['admin']}><AppLayout><UserManagement /></AppLayout></PrivateRoute>
          } />
          
          <Route path="/admin/vehicles" element={
            <PrivateRoute roles={['admin']}><AppLayout><VehicleManagement /></AppLayout></PrivateRoute>
          } />

          

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div className="p-4">Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
