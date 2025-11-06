/**
 * Authentication Service
 * Handles user authentication, registration, and profile management
 */

import { User, UserRole, type IUser } from '../models';

export interface RegisterDTO {
  email: string;
  password: string;
  name: string;
  role?: UserRole;
  phone?: string;
  hostel?: string;
  roomNumber?: string;
  department?: string;
  year?: number;
  rollNumber?: string;
  gender?: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface UpdateProfileDTO {
  name?: string;
  phone?: string;
  hostel?: string;
  roomNumber?: string;
  department?: string;
  year?: number;
}

export interface ChangePasswordDTO {
  currentPassword: string;
  newPassword: string;
}

export class AuthService {
  /**
   * Register a new user
   */
  async register(data: RegisterDTO): Promise<IUser> {
    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Check if roll number already exists (if provided)
    if (data.rollNumber) {
      const existingRollNumber = await User.findOne({
        rollNumber: data.rollNumber,
      });
      if (existingRollNumber) {
        throw new Error('User with this roll number already exists');
      }
    }

    // Create new user
    const user = new User({
      email: data.email,
      password: data.password,
      name: data.name,
      role: data.role || UserRole.STUDENT,
      phone: data.phone,
      hostel: data.hostel,
      roomNumber: data.roomNumber,
      department: data.department,
      year: data.year,
      rollNumber: data.rollNumber,
      gender: data.gender,
      isActive: true,
    });

    await user.save();
    return user;
  }

  /**
   * Login user
   */
  async login(email: string, password: string): Promise<IUser> {
    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    return user;
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Get user by email
   */
  async getUserByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email });
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    data: UpdateProfileDTO
  ): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await user.save();
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: false },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }
  }

  /**
   * Activate user account
   */
  async activateUser(userId: string): Promise<void> {
    const user = await User.findByIdAndUpdate(
      userId,
      { isActive: true },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }
  }

  /**
   * Get all users (admin only)
   */
  async getAllUsers(filters?: {
    role?: UserRole;
    hostel?: string;
    isActive?: boolean;
  }): Promise<IUser[]> {
    const query: any = {};

    if (filters?.role !== undefined) {
      query.role = filters.role;
    }

    if (filters?.hostel) {
      query.hostel = filters.hostel;
    }

    if (filters?.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    return User.find(query).sort({ createdAt: -1 });
  }

  /**
   * Get students by hostel (warden only)
   */
  async getStudentsByHostel(hostel: string): Promise<IUser[]> {
    return User.find({
      role: UserRole.STUDENT,
      hostel,
      isActive: true,
    }).sort({ name: 1 });
  }

  /**
   * Update user role (admin only)
   */
  async updateUserRole(userId: string, role: UserRole): Promise<IUser | null> {
    const user = await User.findByIdAndUpdate(
      userId,
      { role },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Delete user (admin only)
   */
  async deleteUser(userId: string): Promise<void> {
    const user = await User.findByIdAndDelete(userId);
    if (!user) {
      throw new Error('User not found');
    }
  }

  /**
   * Generate JWT token
   */
  generateToken(payload: { id: string; email: string; role: number }): string {
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET not configured');
    }

    const jwt = require('jsonwebtoken');
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    });
  }
}

export const authService = new AuthService();


