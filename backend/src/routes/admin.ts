import { Router } from 'express';
import { 
  getAvailableDrivers, 
  getAllUsers, 
  createUser, 
  updateUser 
} from '../controllers/adminController.js';
import { authenticate, adminOnly } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate, adminOnly);

router.get('/drivers/available', getAvailableDrivers);
router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);

export default router;
