// backend/src/models/Delivery.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

export interface IRoute {
  waypoints: Array<{ lat: number; lng: number }>;
  distance: number; // in meters
  estimatedDuration: number; // in minutes
  encodedPolyline?: string; // Google Maps encoded polyline
}

export interface IDelivery extends Document {
  customerId: mongoose.Types.ObjectId;
  driverId?: mongoose.Types.ObjectId;
  vehicleId?: mongoose.Types.ObjectId;
  
  pickup: ILocation;
  dropoff: ILocation;
  route?: IRoute;
  
  status: 'pending' | 'assigned' | 'picked_up' | 'on_route' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  
  // Package details
  packageDetails: {
    description: string;
    weight?: number;
    volume?: number;
    specialInstructions?: string;
    isFragile?: boolean;
  };
  
  // Scheduling
  scheduledPickupTime?: Date;
  scheduledDeliveryTime?: Date;
  actualPickupTime?: Date;
  actualDeliveryTime?: Date;
  
  // Pricing
  estimatedCost?: number;
  actualCost?: number;
  
  // Communication
  customerNotes?: string;
  driverNotes?: string;
  
  // Timestamps
  assignedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
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
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  placeId: {
    type: String,
    trim: true
  }
});

const RouteSchema = new Schema<IRoute>({
  waypoints: [{
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  }],
  distance: {
    type: Number,
    required: [true, 'Route distance is required'],
    min: [0, 'Distance cannot be negative']
  },
  estimatedDuration: {
    type: Number,
    required: [true, 'Estimated duration is required'],
    min: [1, 'Duration must be at least 1 minute']
  },
  encodedPolyline: {
    type: String,
    trim: true
  }
});

const DeliverySchema = new Schema<IDelivery>({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer ID is required']
  },
  
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  
  pickup: {
    type: LocationSchema,
    required: [true, 'Pickup location is required']
  },
  
  dropoff: {
    type: LocationSchema,
    required: [true, 'Dropoff location is required']
  },
  
  route: {
    type: RouteSchema,
    default: null
  },
  
  status: {
    type: String,
    enum: {
      values: ['pending', 'assigned', 'picked_up', 'on_route', 'delivered', 'cancelled'],
      message: 'Invalid delivery status'
    },
    default: 'pending'
  },
  
  priority: {
    type: String,
    enum: {
      values: ['low', 'medium', 'high', 'urgent'],
      message: 'Priority must be low, medium, high, or urgent'
    },
    default: 'medium'
  },
  
  packageDetails: {
    description: {
      type: String,
      required: [true, 'Package description is required'],
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters']
    },
    weight: {
      type: Number,
      min: [0.1, 'Weight must be at least 0.1 kg'],
      max: [50000, 'Weight cannot exceed 50,000 kg']
    },
    volume: {
      type: Number,
      min: [0.01, 'Volume must be at least 0.01 cubic meters'],
      max: [1000, 'Volume cannot exceed 1,000 cubic meters']
    },
    specialInstructions: {
      type: String,
      trim: true,
      maxlength: [300, 'Special instructions cannot exceed 300 characters']
    },
    isFragile: {
      type: Boolean,
      default: false
    }
  },
  
  // Scheduling fields
  scheduledPickupTime: { type: Date },
  scheduledDeliveryTime: { type: Date },
  actualPickupTime: { type: Date },
  actualDeliveryTime: { type: Date },
  
  // Pricing
  estimatedCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  actualCost: {
    type: Number,
    min: [0, 'Cost cannot be negative']
  },
  
  // Notes
  customerNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Customer notes cannot exceed 500 characters']
  },
  driverNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Driver notes cannot exceed 500 characters']
  },
  
  // Activity timestamps
  assignedAt: { type: Date },
  pickedUpAt: { type: Date },
  deliveredAt: { type: Date }
  
}, { timestamps: true });

// Indexes for performance and conflict detection
DeliverySchema.index({ customerId: 1 });
DeliverySchema.index({ driverId: 1, status: 1 });
DeliverySchema.index({ vehicleId: 1, status: 1 });
DeliverySchema.index({ status: 1, priority: 1 });
DeliverySchema.index({ scheduledPickupTime: 1 });
DeliverySchema.index({ scheduledDeliveryTime: 1 });
DeliverySchema.index({ createdAt: -1 });

// Compound index for conflict detection (same driver/vehicle at same time)
DeliverySchema.index({ 
  driverId: 1, 
  scheduledPickupTime: 1, 
  scheduledDeliveryTime: 1,
  status: 1 
});

export const Delivery = mongoose.model<IDelivery>('Delivery', DeliverySchema);
