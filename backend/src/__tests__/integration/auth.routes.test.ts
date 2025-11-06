/**
 * Integration Tests for Authentication Routes
 * 
 * These tests verify that the HTTP endpoints work correctly
 * by making actual HTTP requests to the server.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { User } from '../../models/User';
import { faker } from '@faker-js/faker';

describe('Authentication Routes Integration Tests', () => {
  let server: FastifyInstance;

  beforeAll(async () => {
    // Build and start the server
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    // Close server and database connections
    await server.close();
  });

  beforeEach(async () => {
    // Clean database before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new student successfully', async () => {
      // ARRANGE
      const studentData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: 'student',
        rollNumber: 'ST001',
        department: 'Computer Science',
        year: 2,
        hostel: 'Hostel A',
        roomNumber: '101',
        phone: '1234567890',
      };

      // ACT
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: studentData,
      });

      // ASSERT
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.student.email).toBe(studentData.email.toLowerCase());
    });

    it('should register a new warden successfully', async () => {
      const wardenData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: 'warden',
        employeeId: 'W001',
        department: 'Administration',
        hostel: 'Hostel A',
        phone: '1234567890',
      };

      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: wardenData,
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
    });

    it('should return 409 for duplicate email', async () => {
      // ARRANGE: Create first user
      const email = faker.internet.email();
      await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'First User',
          email,
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      // ACT: Try to register with same email
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: 'Second User',
          email,
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST002',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('already exists');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: faker.internet.email(),
          // Missing name, password, role
        },
      });

      expect(response.statusCode).toBe(400);
    });

    it('should return 400 for invalid role', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'Test@123',
          role: 'invalid_role',
        },
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      // ARRANGE: Register a user first
      const email = faker.internet.email();
      const password = 'Test@123';
      
      await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email,
          password,
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      // ACT: Login
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.token).toBeDefined();
      expect(body.data.user).toBeDefined();
    });

    it('should return 401 for invalid email', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Test@123',
        },
      });

      expect(response.statusCode).toBe(401);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      // ARRANGE: Register a user
      const email = faker.internet.email();
      await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email,
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      // ACT: Login with wrong password
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password: 'WrongPassword',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(401);
    });

    it('should return 400 for missing credentials', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {},
      });

      expect(response.statusCode).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      // ARRANGE: Register and get token
      const registerResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      const { token } = JSON.parse(registerResponse.body).data;

      // ACT: Get current user
      const response = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.user).toBeDefined();
    });

    it('should return 401 without token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 401 with invalid token', async () => {
      const response = await server.inject({
        method: 'GET',
        url: '/api/auth/me',
        headers: {
          authorization: 'Bearer invalid_token',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully', async () => {
      // ARRANGE: Register user
      const email = faker.internet.email();
      const oldPassword = 'Test@123';
      const newPassword = 'NewTest@456';

      const registerResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email,
          password: oldPassword,
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      const { token } = JSON.parse(registerResponse.body).data;

      // ACT: Change password
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          currentPassword: oldPassword,
          newPassword,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);

      // Verify can login with new password
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password: newPassword,
        },
      });

      expect(loginResponse.statusCode).toBe(200);
    });

    it('should return 401 for incorrect current password', async () => {
      // ARRANGE
      const registerResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      const { token } = JSON.parse(registerResponse.body).data;

      // ACT
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/change-password',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          currentPassword: 'WrongPassword',
          newPassword: 'NewTest@456',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset token for existing email', async () => {
      // ARRANGE: Register user
      const email = faker.internet.email();
      await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email,
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      // ACT
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.resetToken).toBeDefined();
    });

    it('should return 200 even for non-existent email (security)', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: {
          email: 'nonexistent@example.com',
        },
      });

      // Should not reveal if email exists
      expect(response.statusCode).toBe(200);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {
      // ARRANGE: Register and get reset token
      const email = faker.internet.email();
      await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email,
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      const forgotResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/forgot-password',
        payload: { email },
      });

      const { resetToken } = JSON.parse(forgotResponse.body).data;

      // ACT: Reset password
      const newPassword = 'NewTest@456';
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: {
          token: resetToken,
          newPassword,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);

      // Verify can login with new password
      const loginResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email,
          password: newPassword,
        },
      });

      expect(loginResponse.statusCode).toBe(200);
    });

    it('should return 401 for invalid reset token', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/reset-password',
        payload: {
          token: 'invalid_token',
          newPassword: 'NewTest@456',
        },
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      // ARRANGE: Register and get token
      const registerResponse = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'Test@123',
          role: 'student',
          rollNumber: 'ST001',
        },
      });

      const { token } = JSON.parse(registerResponse.body).data;

      // ACT
      const response = await server.inject({
        method: 'POST',
        url: '/api/auth/logout',
        headers: {
          authorization: `Bearer ${token}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });
});

// 
