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
  experience?: number; // years of experience
  
  // Customer-specific fields
  address?: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Timestamps
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
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
    select: false // Don't include password in queries by default
  },
  
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true,
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
  },
  
  role: {
    type: String,
    enum: {
      values: ['admin', 'driver', 'customer'],
      message: '{VALUE} is not a valid role'
    },
    required: [true, 'Role is required'],
    default: 'customer'
  },
  
  isActive: {
    type: Boolean,
    default: true
  },
  
  // Driver-specific fields (conditional validation)
  licenseNumber: {
    type: String,
    trim: true,
    validate: {
      validator: function(this: IUser, value: string) {
        // Required only if role is driver
        if (this.role === 'driver') {
          return value && value.length > 0;
        }
        return true;
      },
      message: 'License number is required for drivers'
    }
  },
  
  licenseExpiry: {
    type: Date,
    validate: {
      validator: function(this: IUser, value: Date) {
        // Required and must be future date if role is driver
        if (this.role === 'driver') {
          return value && value > new Date();
        }
        return true;
      },
      message: 'Valid future license expiry date is required for drivers'
    }
  },
  
  experience: {
    type: Number,
    min: [0, 'Experience cannot be negative'],
    max: [50, 'Experience cannot exceed 50 years'],
    validate: {
      validator: function(this: IUser, value: number) {
        // Optional for drivers, not applicable for others
        if (this.role === 'driver') {
          return value >= 0;
        }
        return true;
      },
      message: 'Experience must be a positive number for drivers'
    }
  },
  
  // Customer address (optional)
  address: {
    street: {
      type: String,
      trim: true
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    zipCode: {
      type: String,
      trim: true,
      match: [/^[0-9]{6}$/, 'Please enter a valid 6-digit zip code']
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1, isActive: 1 }); // Compound index for active users by role

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified or new
  if (!this.isModified('password')) return next();
  
  try {
    // Hash password with salt rounds of 12
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Virtual for full address
userSchema.virtual('fullAddress').get(function() {
  if (!this.address) return null;
  const { street, city, state, zipCode } = this.address;
  return `${street}, ${city}, ${state} - ${zipCode}`;
});

// Static method to find active users by role
userSchema.statics.findActiveByRole = function(role: string) {
  return this.find({ role, isActive: true });
};

export const User = mongoose.model<IUser>('User', userSchema);