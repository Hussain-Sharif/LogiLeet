// backend/src/models/Vehicle.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IVehicle extends Document {
  vehicleNumber: string;
  type: 'bike' | 'car' | 'truck' | 'van';
  vehicleBrand: string;
  vehicleModel: string;
  capacity: {
    weight: number; // in kg
    volume: number; // in cubic meters
  };
  isActive: boolean;
  isAvailable: boolean;
  
  // Current assigned driver
  currentDriver?: mongoose.Types.ObjectId;
  
  // Maintenance info
  lastMaintenance?: Date;
  nextMaintenance?: Date;
  
  // Insurance & Registration
  registrationExpiry: Date;
  insuranceExpiry: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

const VehicleSchema = new Schema<IVehicle>({
  vehicleNumber: {
    type: String,
    required: [true, 'Vehicle number is required'],
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z]{2}[0-9]{2}[A-Z]{2}[0-9]{4}$/, 'Please enter a valid vehicle number format (e.g., KA01AB1234)']
  },
  
  type: {
    type: String,
    enum: {
      values: ['bike', 'car', 'truck', 'van'],
      message: 'Vehicle type must be bike, car, truck, or van'
    },
    required: [true, 'Vehicle type is required']
  },
  
  vehicleBrand: {
    type: String,
    required: [true, 'Brand is required'],
    trim: true,
    maxlength: [30, 'Brand cannot exceed 30 characters']
  },
  
  vehicleModel: {
    type: String,
    required: [true, 'Model is required'],
    trim: true,
    maxlength: [30, 'Model cannot exceed 30 characters']
  },
  
  capacity: {
    weight: {
      type: Number,
      required: [true, 'Weight capacity is required'],
      min: [1, 'Weight capacity must be at least 1 kg'],
      max: [50000, 'Weight capacity cannot exceed 50,000 kg']
    },
    volume: {
      type: Number,
      required: [true, 'Volume capacity is required'],
      min: [0.1, 'Volume capacity must be at least 0.1 cubic meters'],
      max: [1000, 'Volume capacity cannot exceed 1,000 cubic meters']
    }
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  isAvailable: {
    type: Boolean,
    default: true
  },
  
  currentDriver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  lastMaintenance: {
    type: Date
  },
  
  nextMaintenance: {
    type: Date
  },
  
  registrationExpiry: {
    type: Date,
    required: [true, 'Registration expiry date is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Registration must be valid (not expired)'
    }
  },
  
  insuranceExpiry: {
    type: Date,
    required: [true, 'Insurance expiry date is required'],
    validate: {
      validator: function(value: Date) {
        return value > new Date();
      },
      message: 'Insurance must be valid (not expired)'
    }
  }
  
}, { timestamps: true });

// Indexes for performance
VehicleSchema.index({ vehicleNumber: 1 }, { unique: true });
VehicleSchema.index({ type: 1 });
VehicleSchema.index({ isActive: 1, isAvailable: 1 });
VehicleSchema.index({ currentDriver: 1 });

export const Vehicle = mongoose.model<IVehicle>('Vehicle', VehicleSchema);
