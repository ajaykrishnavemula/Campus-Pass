/**
 * Integration Tests for Outpass Routes
 * 
 * Tests the complete outpass workflow through HTTP endpoints
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import { FastifyInstance } from 'fastify';
import { buildServer } from '../../server';
import { User, UserRole } from '../../models/User';
import { Outpass, OutpassStatus } from '../../models/Outpass';
import { faker } from '@faker-js/faker';

describe('Outpass Routes Integration Tests', () => {
  let server: FastifyInstance;
  let studentToken: string;
  let wardenToken: string;
  let securityToken: string;
  let studentId: string;
  let wardenId: string;
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

    // Create test users
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('Test@123', 10);

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
    wardenId = warden.id;
    wardenToken = server.jwt.sign({
      sub: warden.id,
      role: warden.role,
      email: warden.email,
    });

    // Create security
    const security = await User.create({
      name: faker.person.fullName(),
      email: 'security@test.com',
      password: hashedPassword,
      role: UserRole.SECURITY,
      employeeId: 'S001',
      id: 'S001',
      isActive: true,
    });
    securityId = security.id;
    securityToken = server.jwt.sign({
      sub: security.id,
      role: security.role,
      email: security.email,
    });
  });

  describe('POST /api/student/outpass', () => {
    it('should create outpass for authenticated student', async () => {
      // ARRANGE
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpassData = {
        reason: 'Personal work',
        destination: faker.location.city(),
        fromDate: tomorrow.toISOString(),
        toDate: dayAfter.toISOString(),
        contactNumber: '1234567890',
        purpose: 'Visit family',
      };

      // ACT
      const response = await server.inject({
        method: 'POST',
        url: '/api/student/outpass',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
        payload: outpassData,
      });

      // ASSERT
      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpass).toBeDefined();
      expect(body.data.outpass.status).toBe(OutpassStatus.PENDING);
    });

    it('should return 401 for unauthenticated request', async () => {
      const response = await server.inject({
        method: 'POST',
        url: '/api/student/outpass',
        payload: {},
      });

      expect(response.statusCode).toBe(401);
    });

    it('should return 409 for overlapping outpasses', async () => {
      // ARRANGE: Create first outpass
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      await server.inject({
        method: 'POST',
        url: '/api/student/outpass',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
        payload: {
          reason: 'First outpass',
          destination: faker.location.city(),
          fromDate: tomorrow.toISOString(),
          toDate: dayAfter.toISOString(),
          contactNumber: '1234567890',
          purpose: 'Visit family',
        },
      });

      // ACT: Try to create overlapping outpass
      const response = await server.inject({
        method: 'POST',
        url: '/api/student/outpass',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
        payload: {
          reason: 'Overlapping outpass',
          destination: faker.location.city(),
          fromDate: tomorrow.toISOString(),
          toDate: dayAfter.toISOString(),
          contactNumber: '1234567890',
          purpose: 'Visit family',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
      expect(body.error).toContain('Overlapping');
    });
  });

  describe('GET /api/student/outpass', () => {
    it('should get student outpasses', async () => {
      // ARRANGE: Create outpass
      const student = await User.findOne({ id: studentId });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      await Outpass.create({
        student: student?._id,
        reason: 'Test outpass',
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
        method: 'GET',
        url: '/api/student/outpass',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpasses).toBeDefined();
      expect(body.data.outpasses.length).toBeGreaterThan(0);
    });

    it('should filter outpasses by status', async () => {
      // ARRANGE: Create outpasses with different statuses
      const student = await User.findOne({ id: studentId });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      await Outpass.create({
        student: student?._id,
        reason: 'Pending outpass',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.PENDING,
        hostel: 'Hostel A',
      });

      await Outpass.create({
        student: student?._id,
        reason: 'Approved outpass',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
        contactNumber: '1234567890',
        purpose: 'Visit family',
        status: OutpassStatus.APPROVED,
        hostel: 'Hostel A',
      });

      // ACT: Filter by pending status
      const response = await server.inject({
        method: 'GET',
        url: '/api/student/outpass?status=pending',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.outpasses.length).toBe(1);
      expect(body.data.outpasses[0].status).toBe(OutpassStatus.PENDING);
    });
  });

  describe('PATCH /api/warden/outpass/:id/approve', () => {
    it('should allow warden to approve outpass', async () => {
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
        url: `/api/warden/outpass/${outpass._id}/approve`,
        headers: {
          authorization: `Bearer ${wardenToken}`,
        },
        payload: {
          remarks: 'Approved for personal work',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpass.status).toBe(OutpassStatus.APPROVED);
    });

    it('should not allow student to approve outpass', async () => {
      // ARRANGE
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

      // ACT: Try to approve with student token
      const response = await server.inject({
        method: 'PATCH',
        url: `/api/warden/outpass/${outpass._id}/approve`,
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
        payload: {
          remarks: 'Trying to approve',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(403);
    });
  });

  describe('PATCH /api/warden/outpass/:id/reject', () => {
    it('should allow warden to reject outpass', async () => {
      // ARRANGE
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
        url: `/api/warden/outpass/${outpass._id}/reject`,
        headers: {
          authorization: `Bearer ${wardenToken}`,
        },
        payload: {
          reason: 'Insufficient reason provided',
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.outpass.status).toBe(OutpassStatus.REJECTED);
    });
  });

  describe('GET /api/warden/dashboard', () => {
    it('should return warden dashboard statistics', async () => {
      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/warden/dashboard',
        headers: {
          authorization: `Bearer ${wardenToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalStudents).toBeDefined();
      expect(body.data.stats.pendingOutpasses).toBeDefined();
    });
  });

  describe('GET /api/warden/students', () => {
    it('should return list of students in hostel', async () => {
      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/warden/students',
        headers: {
          authorization: `Bearer ${wardenToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.students).toBeDefined();
      expect(Array.isArray(body.data.students)).toBe(true);
    });

    it('should support pagination', async () => {
      // ACT
      const response = await server.inject({
        method: 'GET',
        url: '/api/warden/students?page=1&limit=10',
        headers: {
          authorization: `Bearer ${wardenToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.data.pagination).toBeDefined();
      expect(body.data.pagination.currentPage).toBe(1);
      expect(body.data.pagination.itemsPerPage).toBe(10);
    });
  });

  describe('Complete Outpass Workflow', () => {
    it('should complete full outpass lifecycle', async () => {
      // STEP 1: Student creates outpass
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const createResponse = await server.inject({
        method: 'POST',
        url: '/api/student/outpass',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
        payload: {
          reason: 'Personal work',
          destination: faker.location.city(),
          fromDate: tomorrow.toISOString(),
          toDate: dayAfter.toISOString(),
          contactNumber: '1234567890',
          purpose: 'Visit family',
        },
      });

      expect(createResponse.statusCode).toBe(201);
      const createBody = JSON.parse(createResponse.body);
      const outpassId = createBody.data.outpass._id;

      // STEP 2: Warden approves outpass
      const approveResponse = await server.inject({
        method: 'PATCH',
        url: `/api/warden/outpass/${outpassId}/approve`,
        headers: {
          authorization: `Bearer ${wardenToken}`,
        },
        payload: {
          remarks: 'Approved',
        },
      });

      expect(approveResponse.statusCode).toBe(200);
      const approveBody = JSON.parse(approveResponse.body);
      expect(approveBody.data.outpass.status).toBe(OutpassStatus.APPROVED);

      // STEP 3: Security checks out student
      const checkOutResponse = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpassId}/checkout`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      expect(checkOutResponse.statusCode).toBe(200);
      const checkOutBody = JSON.parse(checkOutResponse.body);
      expect(checkOutBody.data.outpass.status).toBe(OutpassStatus.CHECKED_OUT);

      // STEP 4: Security checks in student
      const checkInResponse = await server.inject({
        method: 'PATCH',
        url: `/api/security/outpass/${outpassId}/checkin`,
        headers: {
          authorization: `Bearer ${securityToken}`,
        },
      });

      expect(checkInResponse.statusCode).toBe(200);
      const checkInBody = JSON.parse(checkInResponse.body);
      expect(checkInBody.data.outpass.status).toBe(OutpassStatus.CHECKED_IN);
    });
  });

  describe('GET /api/student/stats', () => {
    it('should return student statistics', async () => {
      // ARRANGE: Create some outpasses
      const student = await User.findOne({ id: studentId });
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      await Outpass.create({
        student: student?._id,
        reason: 'Test',
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
        method: 'GET',
        url: '/api/student/stats',
        headers: {
          authorization: `Bearer ${studentToken}`,
        },
      });

      // ASSERT
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.stats).toBeDefined();
      expect(body.data.stats.totalOutpasses).toBeGreaterThan(0);
    });
  });
});

// 
