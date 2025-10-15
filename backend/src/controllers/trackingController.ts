// backend/src/controllers/trackingController.ts
import type { Request, Response } from 'express';
import { Tracking } from '../models/Tracking.js';
import { Delivery } from '../models/Delivery.js';
import { User } from '../models/User.js';
import  asyncHandler  from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import type mongoose from 'mongoose';

export const updateDriverLocation = asyncHandler(async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { location, status, batteryLevel, networkType } = req.body;
  const driverId = req.user?.userId;
  
  // Check if delivery exists and driver is assigned
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  if (delivery.driverId?.toString() !== driverId) {
    throw new ApiError(403, 'Unauthorized to update location for this delivery');
  }
  if (!['assigned', 'picked_up', 'on_route'].includes(delivery.status)) {
    throw new ApiError(400, 'Cannot update location for this delivery status');
  }
  
  // Create tracking record
  const tracking = await Tracking.create({
    deliveryId,
    driverId,
    vehicleId: delivery.vehicleId,
    location,
    status: status || 'moving',
    batteryLevel,
    networkType,
    timestamp: new Date()
  });
  
  // Update driver's current location in User model
  await User.findByIdAndUpdate(driverId, {
    currentLocation: {
      latitude: location.latitude,
      longitude: location.longitude,
      lastUpdated: new Date()
    }
  });
  
  // Emit real-time update via Socket.IO (will be handled in socket service)
  req.app.get('io')?.to(`delivery-${deliveryId}`).emit('location-update', {
    deliveryId,
    location,
    status,
    timestamp: tracking.timestamp
  });
  
  res.status(201).json(new ApiResponse(201, { tracking }, 'Location updated successfully'));
});

export const getDeliveryTracking = asyncHandler(async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const { startTime, endTime, limit = 100 } = req.query;
  let userId = req.user?.userId;
  
  // Check if delivery exists
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  
  // Authorization check - customer, assigned driver, or admin
  const user = await User.findById(userId);

  const checkAccess = (user: any, delivery: any, userId: string) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'customer' && delivery.customerId?.toString() === userId) return true;
    if (user?.role === 'driver' && delivery.driverId?.toString() === userId) return true;
    return false;
  };

    // Usage:
    if (!checkAccess(user, delivery, userId!)) {
        throw new ApiError(403, 'Unauthorized to view this delivery');
    }
  
  // Build time filter
  const timeFilter: any = { deliveryId };
  if (startTime || endTime) {
    timeFilter.timestamp = {};
    if (startTime) timeFilter.timestamp.$gte = new Date(startTime as string);
    if (endTime) timeFilter.timestamp.$lte = new Date(endTime as string);
  }
  
  const trackingData = await Tracking.find(timeFilter)
    .sort({ timestamp: -1 })
    .limit(Number(limit))
    .select('location status timestamp batteryLevel networkType');
  
  // Get latest location for real-time tracking
  const latestLocation = trackingData[0];
  
  res.status(200).json(new ApiResponse(200, {
    delivery: {
      _id: delivery._id,
      status: delivery.status,
      pickup: delivery.pickup,
      dropoff: delivery.dropoff
    },
    tracking: trackingData,
    latestLocation,
    totalPoints: trackingData.length
  }, 'Tracking data fetched successfully'));
});

export const getLiveDeliveryStatus = asyncHandler(async (req: Request, res: Response) => {
  const { deliveryId } = req.params;
  const userId = req.user?.userId;
  
  // Check if delivery exists
  const delivery = await Delivery.findById(deliveryId)
    .populate('driverId', 'name phone currentLocation')
    .populate('vehicleId', 'vehicleNumber vehicleBrand vehicleModel');
    
  if (!delivery) {
    throw new ApiError(404, 'Delivery not found');
  }
  
  // Authorization check
  const user = await User.findById(userId);
 
   const checkAccess = (user: any, delivery: any, userId: string) => {
    if (user?.role === 'admin') return true;
    if (user?.role === 'customer' && delivery.customerId?.toString() === userId) return true;
    if (user?.role === 'driver' && delivery.driverId?.toString() === userId) return true;
    return false;
  };

    // Usage:
    if (!checkAccess(user, delivery, userId!)) {
        throw new ApiError(403, 'Unauthorized to view this delivery');
    }
  
  
  // Get latest tracking data
  const latestTracking = await Tracking.findOne({ deliveryId })
    .sort({ timestamp: -1 })
    .select('location status timestamp batteryLevel');
  
  // Calculate estimated time if delivery is active
  let estimatedTimeRemaining = null;
  if (delivery.status === 'on_route' && delivery.route?.estimatedDuration) {
    const startTime = delivery.actualPickupTime || delivery.assignedAt;
    const elapsedMinutes = startTime ? Math.floor((Date.now() - startTime.getTime()) / 60000) : 0;
    estimatedTimeRemaining = Math.max(0, delivery.route.estimatedDuration - elapsedMinutes);
  }
  
  res.status(200).json(new ApiResponse(200, {
    delivery: {
      _id: delivery._id,
      status: delivery.status,
      pickup: delivery.pickup,
      dropoff: delivery.dropoff,
      route: delivery.route,
      driver: delivery.driverId,
      vehicle: delivery.vehicleId,
      estimatedTimeRemaining,
      actualPickupTime: delivery.actualPickupTime,
      scheduledDeliveryTime: delivery.scheduledDeliveryTime
    },
    currentLocation: latestTracking?.location,
    lastUpdate: latestTracking?.timestamp,
    driverStatus: latestTracking?.status,
    batteryLevel: latestTracking?.batteryLevel
  }, 'Live delivery status fetched successfully'));
});

export const getDriverActiveDeliveries = asyncHandler(async (req: Request, res: Response) => {
  const driverId = req.user?.userId;
  
  // Get active deliveries for the driver
  const activeDeliveries = await Delivery.find({
    driverId,
    status: { $in: ['assigned', 'picked_up', 'on_route'] }
  })
  .populate('customerId', 'name phone')
  .populate('vehicleId', 'vehicleNumber vehicleBrand vehicleModel')
  .sort({ assignedAt: 1 });
  
  // Get latest tracking data for each delivery
  const deliveriesWithTracking = await Promise.all(
    activeDeliveries.map(async (delivery) => {
      const latestTracking = await Tracking.findOne({ deliveryId: delivery._id })
        .sort({ timestamp: -1 })
        .select('location timestamp status');
      
      return {
        ...delivery.toObject(),
        currentLocation: latestTracking?.location,
        lastLocationUpdate: latestTracking?.timestamp
      };
    })
  );
  
  res.status(200).json(new ApiResponse(200, {
    activeDeliveries: deliveriesWithTracking,
    totalActive: deliveriesWithTracking.length
  }, 'Active deliveries fetched successfully'));
});
