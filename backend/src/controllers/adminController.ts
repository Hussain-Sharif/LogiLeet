// backend/src/controllers/adminController.ts
import type { Request, Response } from 'express';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import asyncHandler  from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const getAvailableDrivers = asyncHandler(async (req: Request, res: Response) => {
  const drivers = await User.find({
    role: 'driver',
    isActive: true,
    vehicleAssigned: null // Only unassigned drivers
  }).select('name email phone licenseNumber');
  
  res.status(200).json(new ApiResponse(200, { drivers }, 'Available drivers fetched successfully'));
});

export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const { role } = req.query;
  const filter: any = { isActive: true };
  if (role) filter.role = role;
  
  const users = await User.find(filter).select('-password');
  res.status(200).json(new ApiResponse(200, { users }, 'Users fetched successfully'));
});
