// backend/src/routes/admin.ts
import { Router } from 'express';
import { getAvailableDrivers, getAllUsers } from '../controllers/adminController.js';
import { authenticate, adminOnly } from '../middlewares/auth.js';

const router = Router();
router.use(authenticate, adminOnly);

router.get('/drivers/available', getAvailableDrivers);
router.get('/users', getAllUsers);

export default router;
