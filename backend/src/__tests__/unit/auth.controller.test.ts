/**
 * Unit Tests for Authentication Controller
 * 
 * These tests verify the controller logic without making HTTP requests.
 * We mock the request/reply objects and test the controller methods directly.
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { AuthController } from '../../controllers/auth.controller';
import { User, UserRole } from '../../models/User';
import { faker } from '@faker-js/faker';
import { FastifyRequest, FastifyReply } from 'fastify';

describe('AuthController', () => {
  let mockRequest: Partial<FastifyRequest>;
  let mockReply: Partial<FastifyReply>;
  let statusCode: number;
  let responseBody: any;

  beforeEach(async () => {
    // Clean database
    await User.deleteMany({});

    // Reset status code and response body
    statusCode = 200;
    responseBody = null;

    // Mock Fastify request
    mockRequest = {
      body: {},
      params: {},
      query: {},
      server: {
        jwt: {
          sign: jest.fn().mockReturnValue('mock-jwt-token'),
          verify: jest.fn().mockReturnValue({ sub: 'user-id', role: 'student' }),
        },
      } as any,
    };

    // Mock Fastify reply
    mockReply = {
      code: jest.fn().mockImplementation((code: number) => {
        statusCode = code;
        return mockReply;
      }),
      send: jest.fn().mockImplementation((body: any) => {
        responseBody = body;
        return mockReply;
      }),
    } as any;
  });

  describe('registerStudent', () => {
    it('should register a new student successfully', async () => {
      // ARRANGE
      const studentData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        rollNumber: 'ST001',
        department: 'Computer Science',
        year: 2,
        hostel: 'Hostel A',
        roomNumber: '101',
        phone: '1234567890',
      };

      mockRequest.body = studentData;

      // ACT
      await AuthController.registerStudent(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.token).toBe('mock-jwt-token');
      expect(responseBody.data.student.email).toBe(studentData.email);
    });

    it('should return 409 for duplicate email', async () => {
      // ARRANGE: Create existing user
      const email = faker.internet.email();
      await User.create({
        name: faker.person.fullName(),
        email,
        password: 'hashedpassword',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      mockRequest.body = {
        name: faker.person.fullName(),
        email, // Same email
        password: 'Test@123',
        rollNumber: 'ST002',
      };

      // ACT
      await AuthController.registerStudent(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(409);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('already exists');
    });

    it('should return 409 for duplicate roll number', async () => {
      // ARRANGE: Create existing user
      const rollNumber = 'ST001';
      await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'hashedpassword',
        role: UserRole.STUDENT,
        rollNumber,
      });

      mockRequest.body = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        rollNumber, // Same roll number
      };

      // ACT
      await AuthController.registerStudent(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(409);
      expect(responseBody.success).toBe(false);
    });
  });

  describe('registerWarden', () => {
    it('should register a new warden successfully', async () => {
      // ARRANGE
      const wardenData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        employeeId: 'W001',
        department: 'Administration',
        hostel: 'Hostel A',
        phone: '1234567890',
      };

      mockRequest.body = wardenData;

      // ACT
      await AuthController.registerWarden(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(201);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.token).toBe('mock-jwt-token');
      expect(responseBody.data.warden.email).toBe(wardenData.email);
    });

    it('should return 409 for duplicate employee ID', async () => {
      // ARRANGE: Create existing warden
      const employeeId = 'W001';
      await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'hashedpassword',
        role: UserRole.WARDEN,
        id: employeeId,
      });

      mockRequest.body = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        employeeId, // Same employee ID
      };

      // ACT
      await AuthController.registerWarden(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(409);
      expect(responseBody.success).toBe(false);
    });
  });

  describe('login', () => {
    it('should login with valid credentials', async () => {
      // ARRANGE: Create user
      const email = faker.internet.email();
      const password = 'Test@123';
      
      // Create user with hashed password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      await User.create({
        name: faker.person.fullName(),
        email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
        id: 'ST001',
        isActive: true,
      });

      mockRequest.body = { email, password };

      // ACT
      await AuthController.login(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.token).toBe('mock-jwt-token');
    });

    it('should return 401 for invalid email', async () => {
      // ARRANGE
      mockRequest.body = {
        email: 'nonexistent@example.com',
        password: 'Test@123',
      };

      // ACT
      await AuthController.login(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(401);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      // ARRANGE: Create user
      const email = faker.internet.email();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      
      await User.create({
        name: faker.person.fullName(),
        email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
        id: 'ST001',
        isActive: true,
      });

      mockRequest.body = {
        email,
        password: 'WrongPassword',
      };

      // ACT
      await AuthController.login(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(401);
      expect(responseBody.success).toBe(false);
    });

    it('should return 403 for inactive user', async () => {
      // ARRANGE: Create inactive user
      const email = faker.internet.email();
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      
      await User.create({
        name: faker.person.fullName(),
        email,
        password: hashedPassword,
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
        id: 'ST001',
        isActive: false, // Inactive
      });

      mockRequest.body = {
        email,
        password: 'Test@123',
      };

      // ACT
      await AuthController.login(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(403);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('disabled');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // ARRANGE: Create user
      const bcrypt = require('bcryptjs');
      const oldPassword = 'Test@123';
      const hashedPassword = await bcrypt.hash(oldPassword, 10);
      
      const user = await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
        id: 'ST001',
        isActive: true,
      });

      (mockRequest as any).user = { id: user.id };
      mockRequest.body = {
        currentPassword: oldPassword,
        newPassword: 'NewTest@456',
      };

      // ACT
      await AuthController.changePassword(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toContain('Password changed');
    });

    it('should return 401 for incorrect current password', async () => {
      // ARRANGE: Create user
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('Test@123', 10);
      
      const user = await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: hashedPassword,
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
        id: 'ST001',
        isActive: true,
      });

      (mockRequest as any).user = { id: user.id };
      mockRequest.body = {
        currentPassword: 'WrongPassword',
        newPassword: 'NewTest@456',
      };

      // ACT
      await AuthController.changePassword(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(401);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('Invalid password');
    });

    it('should return 404 for non-existent user', async () => {
      // ARRANGE
      (mockRequest as any).user = { id: 'nonexistent-id' };
      mockRequest.body = {
        currentPassword: 'Test@123',
        newPassword: 'NewTest@456',
      };

      // ACT
      await AuthController.changePassword(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(404);
      expect(responseBody.success).toBe(false);
      expect(responseBody.error).toContain('not found');
    });
  });

  describe('forgotPassword', () => {
    it('should send reset token for existing email', async () => {
      // ARRANGE: Create user
      const email = faker.internet.email();
      await User.create({
        name: faker.person.fullName(),
        email,
        password: 'hashedpassword',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
        id: 'ST001',
        isActive: true,
      });

      mockRequest.body = { email };

      // ACT
      await AuthController.forgotPassword(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.data.resetToken).toBeDefined();
    });

    it('should return 200 even for non-existent email (security)', async () => {
      // ARRANGE
      mockRequest.body = { email: 'nonexistent@example.com' };

      // ACT
      await AuthController.forgotPassword(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      // Should not reveal if email exists
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // ACT
      await AuthController.logout(
        mockRequest as FastifyRequest,
        mockReply as FastifyReply
      );

      // ASSERT
      expect(statusCode).toBe(200);
      expect(responseBody.success).toBe(true);
      expect(responseBody.message).toContain('Logout successful');
    });
  });
});

// 
