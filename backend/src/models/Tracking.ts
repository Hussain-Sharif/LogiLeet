// backend/src/models/Tracking.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ITracking extends Document {
  deliveryId: mongoose.Types.ObjectId;
  driverId: mongoose.Types.ObjectId;
  vehicleId: mongoose.Types.ObjectId;
  
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number; // GPS accuracy in meters
    altitude?: number;
    speed?: number; // Speed in km/h
    heading?: number; // Direction in degrees (0-360)
  };
  
  timestamp: Date;
  
  // Status at this location
  status: 'moving' | 'stopped' | 'at_pickup' | 'at_dropoff' | 'idle';
  
  // Optional metadata
  batteryLevel?: number;
  networkType?: 'wifi' | '4g' | '3g' | '2g';
  
  createdAt: Date;
}

const TrackingSchema = new Schema<ITracking>({
  deliveryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Delivery',
    required: [true, 'Delivery ID is required']
  },
  
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Driver ID is required']
  },
  
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: [true, 'Vehicle ID is required']
  },
  
  location: {
    latitude: {
      type: Number,
      required: [true, 'Latitude is required'],
      min: [-90, 'Latitude must be between -90 and 90'],
      max: [90, 'Latitude must be between -90 and 90']
    },
    longitude: {
      type: Number,
      required: [true, 'Longitude is required'],
      min: [-180, 'Longitude must be between -180 and 180'],
      max: [180, 'Longitude must be between -180 and 180']
    },
    accuracy: {
      type: Number,
      min: [0, 'Accuracy cannot be negative']
    },
    altitude: {
      type: Number
    },
    speed: {
      type: Number,
      min: [0, 'Speed cannot be negative'],
      max: [200, 'Speed seems unrealistic (max 200 km/h)']
    },
    heading: {
      type: Number,
      min: [0, 'Heading must be between 0 and 360 degrees'],
      max: [360, 'Heading must be between 0 and 360 degrees']
    }
  },
  
  timestamp: {
    type: Date,
    required: [true, 'Timestamp is required'],
    default: Date.now
  },
  
  status: {
    type: String,
    enum: {
      values: ['moving', 'stopped', 'at_pickup', 'at_dropoff', 'idle'],
      message: 'Invalid tracking status'
    },
    default: 'moving'
  },
  
  batteryLevel: {
    type: Number,
    min: [0, 'Battery level cannot be negative'],
    max: [100, 'Battery level cannot exceed 100%']
  },
  
  networkType: {
    type: String,
    enum: ['wifi', '4g', '3g', '2g']
  }
  
}, { 
  timestamps: { createdAt: true, updatedAt: false } // Only need createdAt for tracking
});

// Indexes for real-time queries and performance
TrackingSchema.index({ deliveryId: 1, timestamp: -1 });
TrackingSchema.index({ driverId: 1, timestamp: -1 });
TrackingSchema.index({ vehicleId: 1, timestamp: -1 });
TrackingSchema.index({ timestamp: -1 }); // For cleanup of old tracking data

// Compound index for real-time tracking queries
TrackingSchema.index({ 
  deliveryId: 1, 
  driverId: 1, 
  timestamp: -1 
});

// TTL index to automatically delete old tracking data after 30 days
TrackingSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export const Tracking = mongoose.model<ITracking>('Tracking', TrackingSchema);
