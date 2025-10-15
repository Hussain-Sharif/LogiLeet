// backend/src/routes/auth.ts
import { Router } from 'express';
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  updateProfile
} from '../controllers/authController.js';
// import { authenticate } from '../middleware/auth.js'
import { validateUserRegistration, validateUserLogin } from '../middlewares/validation.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

// Public routes
router.post('/register', validateUserRegistration, registerUser);
router.post('/login', validateUserLogin, loginUser);

// Protected routes
router.use(authenticate); // All routes below require authentication

router.post('/logout', logoutUser);
router.get('/me', getCurrentUser);
router.put('/profile', updateProfile);

export default router;
