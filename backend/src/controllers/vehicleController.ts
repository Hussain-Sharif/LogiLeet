// backend/src/controllers/vehicleController.ts
import type { Request, Response } from 'express';
import { Vehicle } from '../models/Vehicle.js';
import { User } from '../models/User.js';
import  asyncHandler  from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const addVehicle = asyncHandler(async (req: Request, res: Response) => {
  const {
    vehicleNumber,
    type,
    vehicleBrand,
    vehicleModel,
    capacity,
    registrationExpiry,
    insuranceExpiry
  } = req.body;
  
  // Check if vehicle already exists
  const existingVehicle = await Vehicle.findOne({ vehicleNumber: vehicleNumber.toUpperCase() });
  if (existingVehicle) {
    throw new ApiError(409, 'Vehicle with this number already exists');
  }
  
  // Create vehicle
  const vehicle = await Vehicle.create({
    vehicleNumber: vehicleNumber.toUpperCase(),
    type,
    vehicleBrand,
    vehicleModel,
    capacity,
    registrationExpiry,
    insuranceExpiry
  });
  
  res.status(201).json(new ApiResponse(201, { vehicle }, 'Vehicle added successfully'));
});

export const getAllVehicles = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    type,
    isActive,
    isAvailable,
    search
  } = req.query;
  
  // Build filter object
  const filter: any = {};
  if (type) filter.type = type;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
  if (search) {
    filter.$or = [
      { vehicleNumber: { $regex: search, $options: 'i' } },
      { vehicleBrand: { $regex: search, $options: 'i' } },
      { vehicleModel: { $regex: search, $options: 'i' } }
    ];
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [vehicles, totalVehicles] = await Promise.all([
    Vehicle.find(filter)
      .populate('currentDriver', 'name email phone')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Vehicle.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(totalVehicles / Number(limit));
  
  res.status(200).json(new ApiResponse(200, {
    vehicles,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalVehicles,
      hasNext: Number(page) < totalPages,
      hasPrev: Number(page) > 1
    }
  }, 'Vehicles fetched successfully'));
});

export const getVehicleById = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  
  const vehicle = await Vehicle.findById(vehicleId).populate('currentDriver', 'name email phone');
  
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  
  res.status(200).json(new ApiResponse(200, { vehicle }, 'Vehicle details fetched successfully'));
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const updateData = req.body;
  
  // Check if vehicle exists
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  
  // If updating vehicle number, check for duplicates
  if (updateData.vehicleNumber && updateData.vehicleNumber !== vehicle.vehicleNumber) {
    const existingVehicle = await Vehicle.findOne({ 
      vehicleNumber: updateData.vehicleNumber.toUpperCase(),
      _id: { $ne: vehicleId }
    });
    if (existingVehicle) {
      throw new ApiError(409, 'Another vehicle with this number already exists');
    }
    updateData.vehicleNumber = updateData.vehicleNumber.toUpperCase();
  }
  
  const updatedVehicle = await Vehicle.findByIdAndUpdate(
    vehicleId,
    updateData,
    { new: true, runValidators: true }
  ).populate('currentDriver', 'name email phone');
  
  res.status(200).json(new ApiResponse(200, { vehicle: updatedVehicle }, 'Vehicle updated successfully'));
});

export const assignDriverToVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const { driverId } = req.body;
  
  // Check if vehicle exists and is available
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  if (!vehicle.isAvailable || !vehicle.isActive) {
    throw new ApiError(400, 'Vehicle is not available for assignment');
  }
  
  // Check if driver exists and is available
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || !driver.isActive) {
    throw new ApiError(400, 'Invalid or inactive driver');
  }
  if (driver.vehicleAssigned) {
    throw new ApiError(400, 'Driver is already assigned to another vehicle');
  }
  
  // Assign driver to vehicle
  await Promise.all([
    Vehicle.findByIdAndUpdate(vehicleId, {
      currentDriver: driverId,
      isAvailable: false
    }),
    User.findByIdAndUpdate(driverId, {
      vehicleAssigned: vehicleId
    })
  ]);
  
  const updatedVehicle = await Vehicle.findById(vehicleId).populate('currentDriver', 'name email phone');
  
  res.status(200).json(new ApiResponse(200, { vehicle: updatedVehicle }, 'Driver assigned to vehicle successfully'));
});

export const unassignDriverFromVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  
  if (!vehicle.currentDriver) {
    throw new ApiError(400, 'No driver assigned to this vehicle');
  }
  
  // Unassign driver from vehicle
  await Promise.all([
    Vehicle.findByIdAndUpdate(vehicleId, {
      currentDriver: null,
      isAvailable: true
    }),
    User.findByIdAndUpdate(vehicle.currentDriver, {
      vehicleAssigned: null
    })
  ]);
  
  const updatedVehicle = await Vehicle.findById(vehicleId);
  
  res.status(200).json(new ApiResponse(200, { vehicle: updatedVehicle }, 'Driver unassigned from vehicle successfully'));
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new ApiError(404, 'Vehicle not found');
  }
  
  // If vehicle has assigned driver, unassign first
  if (vehicle.currentDriver) {
    await User.findByIdAndUpdate(vehicle.currentDriver, {
      vehicleAssigned: null
    });
  }
  
  await Vehicle.findByIdAndDelete(vehicleId);
  
  res.status(200).json(new ApiResponse(200, {}, 'Vehicle deleted successfully'));
});
