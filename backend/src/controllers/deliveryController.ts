// backend/src/controllers/deliveryController.ts
import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { Delivery } from '../models/Delivery.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import asyncHandler  from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { computeRoute } from '../services/routeService.js';

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
  const { driverId, vehicleId } = req.body;
  
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
  
  // Compute route
  const route = await computeRoute(
    { lat: delivery.pickup.latitude, lng: delivery.pickup.longitude },
    { lat: delivery.dropoff.latitude, lng: delivery.dropoff.longitude }
  );
  
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

  // Notify driver via socket
  req.app.get('io')?.to(`user-${driverId}`).emit('delivery-assigned', {
    deliveryId,
    message: 'New delivery assigned to you',
    delivery: updatedDelivery
  });

  // Notify customer via socket
  req.app.get('io')?.to(`user-${delivery.customerId}`).emit('delivery-assigned', {
    deliveryId,
    message: 'Your delivery has been assigned to a driver',
    delivery: updatedDelivery
  });

  res.status(200).json(new ApiResponse(200, { delivery: updatedDelivery }, 'Delivery assigned successfully'));
});

export const updateDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { status, driverNotes } = req.body;
  const userId = req.user?.userId;
  
  console.log(`Status update request: ${deliveryId} -> ${status} by user ${userId}`);
  
  const delivery = await Delivery.findById(deliveryId)
    .populate('customerId', 'name email phone')
    .populate('driverId', 'name email phone');
    
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  
  // Authorization check
  const user = await User.findById(userId);
  if (user?.role !== 'admin' && delivery.driverId?._id.toString() !== userId) {
    throw new ApiError(403, 'Unauthorized to update this delivery');
  }
  
  // Update delivery with timestamp
  const updateData: any = { status };
  if (driverNotes) updateData.driverNotes = driverNotes;
  
  switch (status) {
    case 'picked_up':
      updateData.actualPickupTime = new Date();
      updateData.pickedUpAt = new Date();
      break;
    case 'on_route':
      updateData.onRouteAt = new Date();
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
  ).populate('customerId driverId vehicleId', 'name email phone vehicleNumber vehicleBrand vehicleModel');
  
  // REAL-TIME NOTIFICATIONS
  const io = req.app.get('io');
  
  // Customer notifications
  if (delivery.customerId) {
    const customerMessages = {
      picked_up: '📦 Your package has been picked up by the driver',
      on_route: '🚚 Your package is now on the way to destination',
      delivered: '✅ Your package has been delivered successfully!'
    };
    
    const message = customerMessages[status as keyof typeof customerMessages];
    if (message) {
      console.log(`Sending notification to customer ${delivery.customerId._id}: ${message}`);
      
      io?.to(`user-${delivery.customerId._id}`).emit('delivery-status-updated', {
        deliveryId,
        status,
        message,
        delivery: updatedDelivery,
        timestamp: new Date()
      });
    }
  }
  
  // Admin notifications
  io?.emit('admin-delivery-update', {
    deliveryId,
    status,
    message: `Delivery #${deliveryId!.slice(-6)} status updated to ${status}`,
    delivery: updatedDelivery,
    timestamp: new Date()
  });
  
  // Broadcast to delivery tracking room
  io?.to(`delivery-${deliveryId}`).emit('status-update', {
    deliveryId,
    status,
    timestamp: updateData.actualPickupTime || updateData.onRouteAt || updateData.actualDeliveryTime || new Date(),
    driverNotes
  });
  
  console.log(`Status updated successfully: ${deliveryId} -> ${status}`);
  
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
