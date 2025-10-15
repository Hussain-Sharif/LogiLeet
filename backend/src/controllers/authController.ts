// backend/src/controllers/authController.ts
// backend/src/controllers/authController.ts
import type { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import type mongoose from 'mongoose';


const generateAccessToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET!;
  const expiresIn = '7d'
  
  return jwt.sign({ userId }, secret, { expiresIn });
};


const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: '30d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role, licenseNumber, licenseExpiry, address } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }] 
  });
  
  if (existingUser) {
    throw new ApiError(409, 'User with this email or phone already exists');
  }

  // Create user data object
  const userData: any = {
    name,
    email,
    password,
    phone,
    role: role || 'customer'
  };

  // Add role-specific fields
  if (userData.role === 'driver') {
    if (!licenseNumber || !licenseExpiry) {
      throw new ApiError(400, 'License number and expiry are required for drivers');
    }
    userData.licenseNumber = licenseNumber;
    userData.licenseExpiry = new Date(licenseExpiry);
  }

  if (userData.role === 'customer' && address) {
    userData.address = address;
  }

  // Create user
  const user = await User.create(userData);

  const userId = (user._id as mongoose.Types.ObjectId);

  // Generate tokens
  const accessToken = generateAccessToken(userId.toString());
  const refreshToken = generateRefreshToken(userId.toString());

  // Remove password from response
  // Use proper object destructuring:
const userResponse = await User.findById(userId).select('-password');

  res
    .status(201)
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    })
    .json(new ApiResponse(201, {
      user: userResponse,
      accessToken
    }, 'User registered successfully'));
});

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  // Find user with password field
  const user = await User.findOne({ email }).select('+password');
  
  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Invalid email or password');
  }

  if (!user.isActive) {
    throw new ApiError(403, 'Account is deactivated. Contact admin.');
  }

   const userId = (user._id as mongoose.Types.ObjectId);

  // Generate tokens
  const accessToken = generateAccessToken(userId.toString());
  const refreshToken = generateRefreshToken(userId.toString());

  // Remove password from response
  const userResponse = await User.findById(userId).select('-password');

  res
    .status(200)
    .cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60 * 1000
    })
    .json(new ApiResponse(200, {
      user: userResponse,
      accessToken
    }, 'User logged in successfully'));
});

// @desc    Logout user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = asyncHandler(async (req: Request, res: Response) => {
  res
    .status(200)
    .clearCookie('refreshToken')
    .json(new ApiResponse(200, null, 'User logged out successfully'));
});

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getCurrentUser = asyncHandler(async (req: Request, res: Response) => {
  const user = await User.findById(req.user?.userId).populate('vehicleAssigned', 'vehicleNumber type vehicleBrand vehicleModel');
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json(new ApiResponse(200, user, 'User profile retrieved successfully'));
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  const { name, phone, address, licenseNumber, licenseExpiry } = req.body;
  
  const user = await User.findById(req.user?.userId);
  
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Update basic fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address && user.role === 'customer') user.address = address;
  
  // Update driver-specific fields
  if (user.role === 'driver') {
    if (licenseNumber) user.licenseNumber = licenseNumber;
    if (licenseExpiry) user.licenseExpiry = new Date(licenseExpiry);
  }

  await user.save();

  res.json(new ApiResponse(200, user, 'Profile updated successfully'));
});
