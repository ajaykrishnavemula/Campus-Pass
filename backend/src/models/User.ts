/**
 * User Model - Updated to match frontend expectations
 * Supports Student, Warden, Security, and Admin roles
 */

import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export enum UserRole {
  STUDENT = 0,
  ADMIN = 1,
  WARDEN = 2,
  SECURITY = 3,
}

export interface IUser extends Document {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  phone?: string;
  hostel?: string;
  roomNumber?: string;
  department?: string;
  year?: number;
  rollNumber?: string;
  gender?: string;
  photoUrl?: string;
  isActive: boolean;
  
  // Student-specific fields
  status?: boolean;
  remarkScore?: number;
  inCampus?: boolean;
  
  createdAt: Date;
  updatedAt: Date;
  
  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: Number,
      required: true,
      enum: [0, 1, 2, 3], // Student, Admin, Warden, Security
      default: 0,
    },
    phone: {
      type: String,
      trim: true,
    },
    hostel: {
      type: String,
      trim: true,
    },
    roomNumber: {
      type: String,
      trim: true,
    },
    department: {
      type: String,
      trim: true,
    },
    year: {
      type: Number,
      min: 1,
      max: 5,
    },
    rollNumber: {
      type: String,
      trim: true,
      sparse: true, // Allow null but must be unique if provided
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    photoUrl: {
      type: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    
    // Student-specific fields
    status: {
      type: Boolean,
      default: true,
    },
    remarkScore: {
      type: Number,
      default: 0,
      min: 0,
    },
    inCampus: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ hostel: 1 });
UserSchema.index({ rollNumber: 1 });

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error: any) {
    next(error);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
UserSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export const User = mongoose.model<IUser>('User', UserSchema);


