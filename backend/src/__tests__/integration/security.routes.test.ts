/**
 * Integration Tests for Security Routes
 * 
 * Tests security guard operations including check-in/out and QR scanning
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { User, UserRole } from '../../models/User';
import { Outpass, OutpassStatus } from '../../models/Outpass';
import { faker } from '@faker-js/faker';

describe('Security Routes Integration Tests', () => {
  let server: FastifyInstance;
  let securityToken: string;
  let studentToken: string;
  let wardenToken: string;
  let studentId: string;
  let securityId: string;

  beforeAll(async () => {
    server = await buildServer();
    await server.ready();
  });

  afterAll(async () => {
    await server.close();
  });

  beforeEach(async () => {
    // Clean database
    await User.deleteMany({});
    await Outpass.deleteMany({});

    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test@123', 10);

    // Create security guard
    const security = await User.create({
      name: faker.person.fullName(),
      email: 'security@test.com',
      password: hashedPassword,
      role: UserRole.SECURITY,
      employeeId: 'SEC001',
      id: 'SEC001',
      isActive: true,
    });
    securityId = security.id;
    securityToken = server.jwt.sign({
      sub: security.id,
      role: security.role,
      email: security.email,
    });

    // Create student
    const student = await User.create({
      name: faker.person.fullName(),
      email: 'student@test.com',
      password: hashedPassword,
      role: UserRole.STUDENT,
      rollNumber: 'ST001',
      id: 'ST001',
      hostel: 'Hostel A',
      roomNumber: '101',
      isActive: true,
    });
    studentId = student.id;
    studentToken = server.jwt.sign({
      sub: student.id,
      role: student.role,
      email: student.email,
    });

    // Create warden
    const warden = await User.create({
      name: faker.person.fullName(),
      email: 'warden@test.com',
      password: hashedPassword,
      role: UserRole.WARDEN,
      employeeId: 'W001',
      id: 'W001',
      hostel: 'Hostel A',
      isActive: true,
    });
    wardenToken = server.jwt.sign({
      sub: warden.id,
      role: warden.role,
      email: warden.email,
    });
  });

  describe('GET /api/security/dashboard', () => {
    it('should return security dashboard statistics', async () => {
      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/security/dashboard',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalCheckedOut).toBeDefined();
      expect(body.data.stats.totalCheckedIn).toBeDefined();
    });

    it('should not allow student to access security dashboard', async () => {
      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/security/dashboard',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/security/outpass/:id/checkout', () => {
    it('should allow security to check out student', async () => {
      // ARRANGE: Create approved outpass
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.APPROVED,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: new Date(),
        qrCode: 'QR123456',
      });

      // ACT
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpass._id}/checkout`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpass.status).toBe(OutpassStatus.CHECKED_OUT);
      expect(body.data.outpass.checkOutTime).toBeDefined();
    });

    it('should not allow checkout of pending outpass', async () => {
      // ARRANGE: Create pending outpass
      const student = await User.findOne({ id: studentId });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.PENDING,
        hostel: 'Hostel A',
      });

      // ACT
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpass._id}/checkout`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('PATCH /api/security/outpass/:id/checkin', () => {
    it('should allow security to check in student', async () => {
      // ARRANGE: Create checked out outpass
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const security = await User.findOne({ id: securityId });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      const outpass = await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: yesterday,
        toDate: today,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.CHECKED_OUT,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: new Date(),
        qrCode: 'QR123456',
        checkOutTime: yesterday,
        checkOutBy: security?._id,
      });

      // ACT
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpass._id}/checkin`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpass.status).toBe(OutpassStatus.CHECKED_IN);
      expect(body.data.outpass.checkInTime).toBeDefined();
    });

    it('should not allow check-in without check-out', async () => {
      // ARRANGE: Create approved outpass (not checked out)
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.APPROVED,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: new Date(),
        qrCode: 'QR123456',
      });

      // ACT
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpass._id}/checkin`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('GET /api/security/outpass/active', () => {
    it('should return list of active outpasses', async () => {
      // ARRANGE: Create checked out outpass
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const security = await User.findOne({ id: securityId });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: yesterday,
        toDate: tomorrow,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.CHECKED_OUT,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: new Date(),
        qrCode: 'QR123456',
        checkOutTime: yesterday,
        checkOutBy: security?._id,
      });

      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/security/outpass/active',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpasses).toBeDefined();
      expect(Array.isArray(body.data.outpasses)).toBe(true);
    });
  });

  describe('GET /api/security/outpass/overdue', () => {
    it('should return list of overdue outpasses', async () => {
      // ARRANGE: Create overdue outpass
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const security = await User.findOne({ id: securityId });
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: threeDaysAgo,
        toDate: yesterday,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.CHECKED_OUT,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: threeDaysAgo,
        qrCode: 'QR123456',
        checkOutTime: threeDaysAgo,
        checkOutBy: security?._id,
      });

      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/security/outpass/overdue',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpasses).toBeDefined();
      expect(Array.isArray(body.data.outpasses)).toBe(true);
    });
  });

  describe('POST /api/security/outpass/scan', () => {
    it('should validate QR code and return outpass details', async () => {
      // ARRANGE: Create approved outpass with QR code
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.APPROVED,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: new Date(),
        qrCode: 'VALID_QR_CODE_123',
      });

      // ACT
      const response = await server.inject({
        method: 'POST',
        url: '/api/security/outpass/scan',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
        payload: {
          qrCode: 'VALID_QR_CODE_123',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpass).toBeDefined();
      expect(body.data.outpass._id.toString()).toBe(outpass._id.toString());
    });

    it('should return error for invalid QR code', async () => {
      // ACT
      const response = await server.inject({
        method: 'POST',
        url: '/api/security/outpass/scan',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
        payload: {
          qrCode: 'INVALID_QR_CODE',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('GET /api/security/history', () => {
    it('should return check-in/out history', async () => {
      // ARRANGE: Create some completed outpasses
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const security = await User.findOne({ id: securityId });
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: yesterday,
        toDate: today,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.CHECKED_IN,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: yesterday,
        qrCode: 'QR123456',
        checkOutTime: yesterday,
        checkOutBy: security?._id,
        checkInTime: today,
        checkInBy: security?._id,
      });

      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/security/history',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.history).toBeDefined();
      expect(Array.isArray(body.data.history)).toBe(true);
    });

    it('should support date range filtering', async () => {
      // ACT
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const response = await server.inject({
        method: 'GET',
        url: `/api/security/history?startDate=${today.toISOString()}&endDate=${tomorrow.toISOString()}`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Complete Security Workflow', () => {
    it('should handle complete check-out and check-in flow', async () => {
      // STEP 1: Create and approve outpass
      const student = await User.findOne({ id: studentId });
      const warden = await User.findOne({ email: 'warden@test.com' });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await Outpass.create({
        student: student?._id,
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.APPROVED,
        hostel: 'Hostel A',
        approvedBy: warden?._id,
        approvedAt: new Date(),
        qrCode: 'WORKFLOW_QR_123',
      });

      // STEP 2: Scan QR code
      const scanResponse = await server.inject({
        method: 'POST',
        url: '/api/security/outpass/scan',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
        payload: {
          qrCode: 'WORKFLOW_QR_123',
        },
      });

      expect(scanResponse.statusCode).toBe(200);

      // STEP 3: Check out student
      const checkOutResponse = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpass._id}/checkout`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      expect(checkOutResponse.statusCode).toBe(200);
      const checkOutBody = JSON.parse(checkOutResponse.body);
      expect(checkOutBody.data.outpass.status).toBe(OutpassStatus.CHECKED_OUT);

      // STEP 4: Verify in active list
      const activeResponse = await server.inject({
        method: 'GET',
        url: '/api/security/outpass/active',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      expect(activeResponse.statusCode).toBe(200);
      const activeBody = JSON.parse(activeResponse.body);
      expect(activeBody.data.outpasses.length).toBeGreaterThan(0);

      // STEP 5: Check in student
      const checkInResponse = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpass._id}/checkin`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      expect(checkInResponse.statusCode).toBe(200);
      const checkInBody = JSON.parse(checkInResponse.body);
      expect(checkInBody.data.outpass.status).toBe(OutpassStatus.CHECKED_IN);

      // STEP 6: Verify in history
      const historyResponse = await server.inject({
        method: 'GET',
        url: '/api/security/history',
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      expect(historyResponse.statusCode).toBe(200);
      const historyBody = JSON.parse(historyResponse.body);
      expect(historyBody.data.history.length).toBeGreaterThan(0);
    });
  });
});

// 
