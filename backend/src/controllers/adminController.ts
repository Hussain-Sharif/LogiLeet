import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import  asyncHandler  from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getAvailableDrivers = asyncHandler(async (req: Request, res: Response) => {
  const drivers = await User.find({
    role: 'driver',
    isActive: true,
    vehicleAssigned: null
  }).select('name email phone licenseNumber');
  
  res.status(200).json(new ApiResponse(200, { drivers }, 'Available drivers fetched successfully'));
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  const filter: any = {};
  if (role) filter.role = role;
  
  const users = await User.find(filter)
    .select('-password')
    .populate('vehicleAssigned', 'vehicleNumber vehicleBrand vehicleModel')
    .sort({ createdAt: -1 });
    
  res.status(200).json(new ApiResponse(200, { users }, 'Users fetched successfully'));
});

export const createUser = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, phone, role, licenseNumber, licenseExpiry, address } = req.body;
  
  const existingUser = await User.findOne({ 
    $or: [{ email }, { phone }] 
  });
  
  if (existingUser) {
    throw new ApiError(409, 'User with this email or phone already exists');
  }
  
  const userData: any = {
    name,
    email,
    password,
    phone,
    role: role || 'customer'
  };
  
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
  
  const user = await User.create(userData);
  const userResponse = await User.findById(user._id).select('-password');
  
  res.status(201).json(new ApiResponse(201, { user: userResponse }, 'User created successfully'));
});

export const updateUser = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const updateData = req.body;
  
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  
  if (updateData.email && updateData.email !== user.email) {
    const existingUser = await User.findOne({ 
      email: updateData.email,
      _id: { $ne: userId }
    });
    if (existingUser) {
      throw new ApiError(409, 'Email already exists');
    }
  }
  
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');
  
  res.status(200).json(new ApiResponse(200, { user: updatedUser }, 'User updated successfully'));
});
