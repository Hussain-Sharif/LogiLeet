// backend/src/routes/deliveries.ts
import { Router } from 'express';
import {
  createDelivery,
  assignDelivery,
  updateDeliveryStatus,
  getDeliveries,
  getDeliveryById
} from '../controllers/deliveryController.js';
import { authenticate, adminOnly, customerOnly, driverOrAdmin } from '../middlewares/auth.js';
import { validateDelivery } from '../middlewares/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer can create deliveries
router.post('/', customerOnly, validateDelivery, createDelivery);

// Admin can assign deliveries
router.put('/:deliveryId/assign', adminOnly, assignDelivery);

// Driver or Admin can update delivery status
router.put('/:deliveryId/status', driverOrAdmin, updateDeliveryStatus);

// All authenticated users can view deliveries (filtered by role in controller)
router.get('/', getDeliveries);
router.get('/:deliveryId', getDeliveryById);

export default router;
