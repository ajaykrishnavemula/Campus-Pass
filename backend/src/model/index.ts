/**
 * @author AjayKrishna
 * @summary Data Types for Student, Warden, Permit and System.
 */

import system from '../class/system';
import mongoose, { Date, Schema } from 'mongoose';
import logger from '../utils/logger';
import { PurposeType } from '../types';
const options = { discriminatorKey: 'kind' };

/**
 * enum Role {
  student = 0,
  admin = 1,
  warden = 2,
  security = 3,
}
 */

/**
 * Outpass Data Type
 */

export interface TypePermit {
  name: string;
  id: String;
  phoneNumber: string;
  outTime: Date;
  verifiedOutTime?: Date;
  inTime: Date;
  verifiedInTime?: Date;
  isInVerified: boolean;
  isOutVerified: boolean;
  hostel: string;
  purpose: PurposeType;
  inAprrovedBy?: string;
  outApprovedBy?: string;
  photoUrl?: string;
  autoVerified?: boolean;
}
const PermitSchema = new Schema<TypePermit>({
  name: { type: String, required: true },
  id: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  outTime: { type: Date, required: true },
  verifiedOutTime: { type: Date, required: false },
  isInVerified: { type: Boolean, default: false },
  isOutVerified: { type: Boolean, default: false },
  inTime: { type: Date, required: true },
  verifiedInTime: { type: Date, required: false },
  purpose: { type: Number, required: true },
  hostel: { type: String, default: 'h2' },
  outApprovedBy: { type: String },
  inAprrovedBy: { type: String },
  photoUrl: { type: String },
  autoVerified: { type: Boolean, default: 'false' },
});
export const Permit = mongoose.model('Permit', PermitSchema);

/**
 * System Data Type
 */
interface TypeSystem {
  id: number;
  allow: boolean;
  threshold: number;
  lastUpdated?: Date;
}
const SystemSchema = new Schema<TypeSystem>({
  allow: { type: Boolean, required: true, default: true },
  lastUpdated: { type: Date },
});

SystemSchema.post('init', function (doc) {
  logger.debug(`System has been set to ${doc.allow}`);
  system.setSystemStatus(doc.allow, new Date().toISOString());
});

SystemSchema.post('findOneAndUpdate', function (doc) {
  logger.debug(`System has been set to ${doc.allow}`);
  system.setSystemStatus(doc.allow, new Date().toISOString());
});

export const System = mongoose.model('System', SystemSchema);

/**
 * User Data Type
 */
interface TypeUser {
  id: string;
  name: string;
  password: string;
  role: number;
}
const UserSchema = new Schema<TypeUser>(
  {
    id: { type: String, required: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: Number, required: true },
  },
  options,
);
export const User = mongoose.model('User', UserSchema);

/**
 * Student Data Type, inherits User
 */
interface TypeStudent {
  status: boolean;
  remarkScore: number;
  hostel: string;
  gender: string;
  inCampus: boolean;
  photoUrl: string;
}
const StudentSchema = new Schema<TypeStudent>(
  {
    status: { type: Boolean, required: true, default: true },
    remarkScore: { type: Number, required: true, default: 0 },
    hostel: { type: String, required: true, default: 'h2' },
    gender: { type: String, required: true },
    photoUrl: { type: String },
    inCampus: { type: Boolean, required: true, default: true },
  },
  options,
);
export const Student = User.discriminator('Student', StudentSchema);

/**
 * Security Data Type, inherits User
 */

export const Security = User.discriminator('Security', UserSchema);

/**
 * Warden Data Type, inherits User
 */
interface TypeWarden {
  hostel: string;
}
const WardenSchema = new Schema<TypeWarden>({
  hostel: { type: String, required: true, default: 'h2' },
});
export const Warden = User.discriminator('Warden', WardenSchema);
