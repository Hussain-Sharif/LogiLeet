// backend/src/models/User.ts
import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: 'admin' | 'driver' | 'customer';
  isActive: boolean;
  
  // Driver-specific fields
  licenseNumber?: string;
  licenseExpiry?: Date;
  vehicleAssigned?: mongoose.Types.ObjectId;
  
  // Location for drivers (updated via GPS)
  currentLocation?: {
    latitude: number;
    longitude: number;
    lastUpdated: Date;
  };
  
  // Customer address
  address?: string;
  
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number']
  },
  
  role: {
    type: String,
    enum: ['admin', 'driver', 'customer'],
    required: [true, 'Role is required'],
    default: 'customer'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Driver-specific fields
  licenseNumber: {
    type: String,
    required: function(this: IUser) { return this.role === 'driver'; }
  },
  
  licenseExpiry: {
    type: Date,
    required: function(this: IUser) { return this.role === 'driver'; }
  },
  
  vehicleAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    default: null
  },
  
  currentLocation: {
    latitude: { type: Number, min: -90, max: 90 },
    longitude: { type: Number, min: -180, max: 180 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  address: {
    type: String,
    maxlength: [200, 'Address cannot exceed 200 characters']
  }
  
}, { timestamps: true });

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
