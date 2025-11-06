/**
 * Outpass Model - Campus outpass management
 * Tracks student outpass requests, approvals, and check-in/out
 */

import mongoose, { Schema, Document, Types } from 'mongoose';

export enum OutpassStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CHECKED_OUT = 'checked_out',
  CHECKED_IN = 'checked_in',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum OutpassType {
  LOCAL = 'local',
  HOME = 'home',
  EMERGENCY = 'emergency',
  MEDICAL = 'medical',
  OTHER = 'other',
}

export interface IOutpass extends Document {
  student: Types.ObjectId;
  outpassNumber: string;
  type: OutpassType;
  purpose: string;
  destination: string;
  fromDate: Date;
  toDate: Date;
  status: OutpassStatus;
  warden?: Types.ObjectId;
  wardenRemarks?: string;
  approvedAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;
  checkOutTime?: Date;
  checkInTime?: Date;
  checkOutBy?: Types.ObjectId;
  checkInBy?: Types.ObjectId;
  qrCode?: string;
  isOverdue: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OutpassSchema = new Schema<IOutpass>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    outpassNumber: {
      type: String,
      required: false,
      unique: true,
      sparse: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(OutpassType),
      default: OutpassType.LOCAL,
    },
    purpose: {
      type: String,
      required: true,
      trim: true,
    },
    destination: {
      type: String,
      required: true,
      trim: true,
    },
    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: Object.values(OutpassStatus),
      default: OutpassStatus.PENDING,
      index: true,
    },
    warden: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    wardenRemarks: {
      type: String,
      trim: true,
    },
    approvedAt: {
      type: Date,
    },
    rejectedAt: {
      type: Date,
    },
    rejectionReason: {
      type: String,
      trim: true,
    },
    checkOutTime: {
      type: Date,
    },
    checkInTime: {
      type: Date,
    },
    checkOutBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    checkInBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    qrCode: {
      type: String,
    },
    isOverdue: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
OutpassSchema.index({ student: 1, status: 1 });
OutpassSchema.index({ warden: 1, status: 1 });
OutpassSchema.index({ status: 1, fromDate: 1 });
OutpassSchema.index({ status: 1, toDate: 1 });
OutpassSchema.index({ createdAt: -1 });

// Generate outpass number before saving
OutpassSchema.pre('save', async function (next) {
  if (!this.isNew || this.outpassNumber) {
    return next();
  }
  
  try {
    // Generate outpass number: OP-YYYYMMDD-XXXX
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Get count of outpasses created today
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
    
    const Outpass = mongoose.model('Outpass');
    const count = await Outpass.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });
    
    const sequence = String(count + 1).padStart(4, '0');
    this.outpassNumber = `OP-${dateStr}-${sequence}`;
    
    next();
  } catch (error: any) {
    next(error);
  }
});

// Check if outpass is overdue
OutpassSchema.methods.checkOverdue = function (): boolean {
  if (
    this.status === OutpassStatus.CHECKED_OUT &&
    new Date() > this.toDate
  ) {
    this.isOverdue = true;
    this.status = OutpassStatus.OVERDUE;
    return true;
  }
  return false;
};

// Virtual for duration in hours
OutpassSchema.virtual('durationHours').get(function () {
  const diff = this.toDate.getTime() - this.fromDate.getTime();
  return Math.round(diff / (1000 * 60 * 60));
});

// Ensure virtuals are included in JSON
OutpassSchema.set('toJSON', { virtuals: true });
OutpassSchema.set('toObject', { virtuals: true });

export const Outpass = mongoose.model<IOutpass>('Outpass', OutpassSchema);


