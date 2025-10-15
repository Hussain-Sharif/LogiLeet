// backend/src/controllers/deliveryController.ts
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Delivery } from '../models/Delivery.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import asyncHandler  from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const createDelivery = asyncHandler(async (req: Request, res: Response) => {
  const {
    pickup,
    dropoff,
    packageDetails,
    scheduledPickupTime,
    scheduledDeliveryTime,
    priority = 'medium',
    customerNotes
  } = req.body;
  
  const customerId = req.user?.userId;
  
  // Create delivery
  const delivery = await Delivery.create({
    customerId,
    pickup,
    dropoff,
    packageDetails,
    scheduledPickupTime,
    scheduledDeliveryTime,
    priority,
    customerNotes
  });
  
  const populatedDelivery = await Delivery.findById(delivery._id)
    .populate('customerId', 'name email phone')
    .populate('driverId', 'name email phone')
    .populate('vehicleId', 'vehicleNumber vehicleBrand vehicleModel');
  
  res.status(201).json(new ApiResponse(201, { delivery: populatedDelivery }, 'Delivery request created successfully'));
});

export const assignDelivery = asyncHandler(async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { driverId, vehicleId, route } = req.body;
  
  // Check if delivery exists and is assignable
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  if (delivery.status !== 'pending') {
    throw new ApiError(400, 'Delivery is not in pending status');
  }
  
  // Check if driver exists and is available
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'driver' || !driver.isActive) {
    throw new ApiError(400, 'Invalid or inactive driver');
  }
  
  // Check if vehicle exists and is available
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle || !vehicle.isActive) {
    throw new ApiError(400, 'Invalid or inactive vehicle');
  }
  
  // Check for conflicts (driver/vehicle already assigned to active deliveries)
  const conflictingDelivery = await Delivery.findOne({
    $and: [
      {
        $or: [
          { driverId },
          { vehicleId }
        ]
      },
      {
        status: { $in: ['assigned', 'picked_up', 'on_route'] }
      },
      {
        _id: { $ne: deliveryId }
      }
    ]
  });
  
  if (conflictingDelivery) {
    throw new ApiError(409, 'Driver or vehicle is already assigned to another active delivery');
  }
  
  // Assign delivery
  const updatedDelivery = await Delivery.findByIdAndUpdate(
    deliveryId,
    {
      driverId,
      vehicleId,
      route,
      status: 'assigned',
      assignedAt: new Date()
    },
    { new: true }
  ).populate('customerId', 'name email phone')
   .populate('driverId', 'name email phone')
   .populate('vehicleId', 'vehicleNumber vehicleBrand vehicleModel');
  
  res.status(200).json(new ApiResponse(200, { delivery: updatedDelivery }, 'Delivery assigned successfully'));
});

export const updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { status, driverNotes } = req.body;
  const userId = req.user?.userId;
  
  // Check if delivery exists
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  
  // Authorization check - only assigned driver or admin can update status
  const user = await User.findById(userId);
  if (user?.role !== 'admin' && delivery.driverId?.toString() !== userId) {
    throw new ApiError(403, 'Unauthorized to update this delivery');
  }
  
  // Validate status transitions
  const validTransitions: Record<string, string[]> = {
    'assigned': ['picked_up', 'cancelled'],
    'picked_up': ['on_route'],
    'on_route': ['delivered'],
    'delivered': [], // Final state
    'cancelled': [] // Final state
  };
  
  if (!validTransitions[delivery.status]?.includes(status)) {
    throw new ApiError(400, `Invalid status transition from ${delivery.status} to ${status}`);
  }
  
  // Update delivery with timestamp
  const updateData: any = { status };
  if (driverNotes) updateData.driverNotes = driverNotes;
  
  switch (status) {
    case 'picked_up':
      updateData.actualPickupTime = new Date();
      updateData.pickedUpAt = new Date();
      break;
    case 'delivered':
      updateData.actualDeliveryTime = new Date();
      updateData.deliveredAt = new Date();
      break;
  }
  
  const updatedDelivery = await Delivery.findByIdAndUpdate(
    deliveryId,
    updateData,
    { new: true }
  ).populate('customerId', 'name email phone')
   .populate('driverId', 'name email phone')
   .populate('vehicleId', 'vehicleNumber vehicleBrand vehicleModel');
  
  res.status(200).json(new ApiResponse(200, { delivery: updatedDelivery }, `Delivery status updated to ${status}`));
});

export const getDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    driverId,
    customerId,
    startDate,
    endDate
  } = req.query;
  
  const userId = req.user?.userId;
  const user = await User.findById(userId);
  
  // Build filter based on user role
  const filter: any = {};
  
  if (user?.role === 'customer') {
    filter.customerId = userId;
  } else if (user?.role === 'driver') {
    filter.driverId = userId;
  }
  // Admin can see all deliveries
  
  // Apply additional filters
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (driverId && user?.role === 'admin') filter.driverId = driverId;
  if (customerId && user?.role === 'admin') filter.customerId = customerId;
  
  // Date range filter
  if (startDate || endDate) {
    filter.createdAt = {};
    if (startDate) filter.createdAt.$gte = new Date(startDate as string);
    if (endDate) filter.createdAt.$lte = new Date(endDate as string);
  }
  
  const skip = (Number(page) - 1) * Number(limit);
  
  const [deliveries, totalDeliveries] = await Promise.all([
    Delivery.find(filter)
      .populate('customerId', 'name email phone')
      .populate('driverId', 'name email phone')
      .populate('vehicleId', 'vehicleNumber vehicleBrand vehicleModel')
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Delivery.countDocuments(filter)
  ]);
  
  const totalPages = Math.ceil(totalDeliveries / Number(limit));
  
  res.status(200).json(new ApiResponse(200, {
    deliveries,
    pagination: {
      currentPage: Number(page),
      totalPages,
      totalDeliveries,
      hasNext: Number(page) < totalPages,
      hasPrev: Number(page) > 1
    }
  }, 'Deliveries fetched successfully'));
});

export const getDeliveryById = asyncHandler(async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const userId = req.user?.userId;
  
  const delivery = await Delivery.findById(deliveryId)
    .populate('customerId', 'name email phone')
    .populate('driverId', 'name email phone')
    .populate('vehicleId', 'vehicleNumber vehicleBrand vehicleModel');
  
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  
  // Authorization check
  const user = await User.findById(userId);
  if (user?.role === 'customer' && delivery.customerId?._id.toString() !== userId) {
    throw new ApiError(403, 'Unauthorized to view this delivery');
  }
  if (user?.role === 'driver' && delivery.driverId?._id.toString() !== userId) {
    throw new ApiError(403, 'Unauthorized to view this delivery');
  }
  
  res.status(200).json(new ApiResponse(200, { delivery }, 'Delivery details fetched successfully'));
});
