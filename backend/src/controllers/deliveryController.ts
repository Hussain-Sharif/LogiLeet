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
  const { status, driverNotes, customerNotes } = req.body;
  const userId = req.user?.userId;
  
  const delivery = await Delivery.findById(deliveryId)
    .populate('customerId', 'name email phone')
    .populate('driverId', 'name email phone');
    
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  
  const user = await User.findById(userId);
  
  // Authorization and validation for cancellation
  if (status === 'cancelled') {
    if (user?.role === 'customer') {
      // Customer can only cancel pending deliveries
      if (delivery.status !== 'pending') {
        throw new ApiError(400, 'Customers can only cancel pending deliveries');
      }
    } else if (user?.role === 'driver') {
      // Driver can cancel picked_up or on_route deliveries
      if (!['picked_up', 'on_route'].includes(delivery.status)) {
        throw new ApiError(400, 'Drivers can only cancel picked up or on-route deliveries');
      }
    } else if (user?.role !== 'admin') {
      throw new ApiError(403, 'Unauthorized to cancel this delivery');
    }
  }
  
  // Update delivery
  const updateData: any = { status };
  if (driverNotes) updateData.driverNotes = driverNotes;
  if (customerNotes) updateData.customerNotes = customerNotes;
  
  // Add timestamps
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
    case 'cancelled':
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = userId;
      break;
  }
  
  const updatedDelivery = await Delivery.findByIdAndUpdate(
    deliveryId,
    updateData,
    { new: true }
  ).populate('customerId driverId vehicleId', 'name email phone vehicleNumber vehicleBrand vehicleModel');
  
  // Notifications
  const io = req.app.get('io');
  
  if (status === 'cancelled') {
    // Notify customer about cancellation
    if (delivery.customerId) {
      io?.to(`user-${delivery.customerId._id}`).emit('delivery-cancelled', {
        deliveryId,
        message: user?.role === 'customer' ? 'You have cancelled your delivery request' : 
                user?.role === 'driver' ? 'Your delivery has been cancelled by the driver' : 
                'Your delivery has been cancelled',
        reason: driverNotes || customerNotes || 'No reason provided',
        delivery: updatedDelivery
      });
    }
    
    // Notify admin
    io?.emit('admin-delivery-update', {
      deliveryId,
      status: 'cancelled',
      message: `Delivery #${deliveryId!.slice(-6)} cancelled by ${user?.role}`,
      delivery: updatedDelivery
    });
  }
  
  res.status(200).json(new ApiResponse(200, { delivery: updatedDelivery }, `Delivery ${status}`));
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
