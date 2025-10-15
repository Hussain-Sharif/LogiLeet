// backend/src/routes/vehicles.ts
import { Router } from 'express';
import {
  addVehicle,
  getAllVehicles,
  getVehicleById,
  updateVehicle,
  assignDriverToVehicle,
  unassignDriverFromVehicle,
  deleteVehicle
} from '../controllers/vehicleController.js';
import { authenticate, adminOnly, driverOrAdmin } from '../middlewares/auth.js';
import { validateVehicle } from '../middlewares/validation.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Admin only routes
router.post('/', adminOnly, validateVehicle, addVehicle);
router.put('/:vehicleId', adminOnly, updateVehicle);
router.post('/:vehicleId/assign-driver', adminOnly, assignDriverToVehicle);
router.delete('/:vehicleId/unassign-driver', adminOnly, unassignDriverFromVehicle);
router.delete('/:vehicleId', adminOnly, deleteVehicle);

// Admin and Driver can view vehicles
router.get('/', driverOrAdmin, getAllVehicles);
router.get('/:vehicleId', driverOrAdmin, getVehicleById);

export default router;
