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
          
          <Route path="/admin" element={
            <PrivateRoute roles={['admin']}>
              <AdminDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/driver" element={
            <PrivateRoute roles={['driver']}>
              <DriverDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/customer" element={
            <PrivateRoute roles={['customer']}>
              <CustomerDashboard />
            </PrivateRoute>
          } />
          
          <Route path="/customer/delivery/:id" element={
            <PrivateRoute roles={['customer', 'admin']}>
              <TrackDelivery />
            </PrivateRoute>
          } />

          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<div className="p-4">Not Found</div>} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
