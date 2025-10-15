// backend/src/routes/index.ts
import { Router } from 'express';
import authRoutes from './auth.js';
import vehicleRoutes from './vehicles.js';
import deliveryRoutes from './deliveries.js';
import trackingRoutes from './tracking.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'LogiLeet API is running',
    timestamp: new Date().toISOString()
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/tracking', trackingRoutes);

export default router;
