// backend/src/routes/tracking.ts
import { Router } from 'express';
import {
  updateDriverLocation,
  getDeliveryTracking,
  getLiveDeliveryStatus,
  getDriverActiveDeliveries
} from '../controllers/trackingController.js';
import { authenticate, driverOnly } from '../middlewares/auth.js';
import { validateLocationUpdate } from '../middlewares/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Driver only routes
router.post('/deliveries/:deliveryId/location', driverOnly, validateLocationUpdate, updateDriverLocation);
router.get('/driver/active-deliveries', driverOnly, getDriverActiveDeliveries);

// All authenticated users can view tracking (filtered by role in controller)
router.get('/deliveries/:deliveryId', getDeliveryTracking);
router.get('/deliveries/:deliveryId/live', getLiveDeliveryStatus);

export default router;
