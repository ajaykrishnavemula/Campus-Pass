import { describe, it, expect, beforeEach } from '@jest/globals';
import { OutpassService } from '../../services/OutpassService';
import { Outpass, OutpassStatus, OutpassType } from '../../models/Outpass';
import { User, UserRole } from '../../models/User';
import { faker } from '@faker-js/faker';

describe('OutpassService', () => {
  let outpassService: OutpassService;
  let studentId: string;
  let wardenId: string;
  let securityId: string;

  // Runs before each test in this describe block
  beforeEach(async () => {
    outpassService = new OutpassService();

    // Create test users
    const student = await User.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'hashedpassword',
      role: UserRole.STUDENT,
      rollNumber: 'ST001',
      hostel: 'Hostel A',
    });
    studentId = student._id.toString();

    const warden = await User.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'hashedpassword',
      role: UserRole.WARDEN,
      hostel: 'Hostel A',
    });
    wardenId = warden._id.toString();

    const security = await User.create({
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 'hashedpassword',
      role: UserRole.SECURITY,
    });
    securityId = security._id.toString();
  });

  describe('createOutpass', () => {
    it('should create outpass with valid data', async () => {
      // ARRANGE
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpassData = {
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      };

      // ACT
      const outpass = await outpassService.createOutpass(outpassData);

      // ASSERT
      expect(outpass).toBeDefined();
      // Handle both populated and non-populated student field
      const actualStudentId = typeof outpass.student === 'object' && outpass.student._id
        ? outpass.student._id.toString()
        : outpass.student.toString();
      expect(actualStudentId).toBe(studentId);
      expect(outpass.destination).toBe(outpassData.destination);
      expect(outpass.status).toBe(OutpassStatus.PENDING);
      expect(outpass.type).toBe(OutpassType.LOCAL);
    });

    it('should throw error if toDate is before fromDate', async () => {
      // Test edge case: invalid date range
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const outpassData = {
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: yesterday, // Before fromDate
      };

      await expect(
        outpassService.createOutpass(outpassData)
      ).rejects.toThrow('To date must be after from date');
    });

    it('should throw error if fromDate is in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const today = new Date();

      const outpassData = {
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: yesterday, // Past date
        toDate: today,
      };

      await expect(
        outpassService.createOutpass(outpassData)
      ).rejects.toThrow('From date cannot be in the past');
    });

    it('should throw error for invalid student', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpassData = {
        studentId: '507f1f77bcf86cd799439011', // Non-existent ID
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      };

      await expect(
        outpassService.createOutpass(outpassData)
      ).rejects.toThrow('Invalid student');
    });

    it('should throw error for overlapping outpasses', async () => {
      // ARRANGE: Create first outpass
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: 'First outpass',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      // ACT & ASSERT: Try to create overlapping outpass
      await expect(
        outpassService.createOutpass({
          studentId,
          type: OutpassType.LOCAL,
          purpose: 'Overlapping outpass',
          destination: faker.location.city(),
          fromDate: tomorrow,
          toDate: dayAfter,
        })
      ).rejects.toThrow('You have an overlapping outpass request');
    });
  });

  describe('approveOutpass', () => {
    it('should approve outpass and set approval details', async () => {
      // ARRANGE: Create pending outpass
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      // ACT: Approve it
      const approved = await outpassService.approveOutpass(outpass._id.toString(), {
        wardenId,
        remarks: 'Approved for personal work',
      });

      // ASSERT
      expect(approved.status).toBe(OutpassStatus.APPROVED);
      // Handle both populated and non-populated warden field
      const actualWardenId = approved.warden
        ? (typeof approved.warden === 'object' && approved.warden._id
          ? approved.warden._id.toString()
          : approved.warden.toString())
        : '';
      expect(actualWardenId).toBe(wardenId);
      expect(approved.wardenRemarks).toBe('Approved for personal work');
      expect(approved.approvedAt).toBeDefined();
    });

    it('should not approve already approved outpass', async () => {
      // ARRANGE: Create and approve outpass
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      await outpassService.approveOutpass(outpass._id.toString(), { wardenId });

      // ACT & ASSERT: Try to approve again
      await expect(
        outpassService.approveOutpass(outpass._id.toString(), { wardenId })
      ).rejects.toThrow('Only pending outpasses can be approved');
    });

    it('should throw error for invalid warden', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      await expect(
        outpassService.approveOutpass(outpass._id.toString(), {
          wardenId: studentId, // Student ID instead of warden
        })
      ).rejects.toThrow('Invalid warden');
    });
  });

  describe('rejectOutpass', () => {
    it('should reject outpass with reason', async () => {
      // ARRANGE
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      // ACT
      const rejected = await outpassService.rejectOutpass(outpass._id.toString(), {
        wardenId,
        reason: 'Insufficient reason provided',
      });

      // ASSERT
      expect(rejected.status).toBe(OutpassStatus.REJECTED);
      // Handle both populated and non-populated warden field
      const actualWardenId = rejected.warden
        ? (typeof rejected.warden === 'object' && rejected.warden._id
          ? rejected.warden._id.toString()
          : rejected.warden.toString())
        : '';
      expect(actualWardenId).toBe(wardenId);
      expect(rejected.rejectionReason).toBe('Insufficient reason provided');
      expect(rejected.rejectedAt).toBeDefined();
    });

    it('should not reject already rejected outpass', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      await outpassService.rejectOutpass(outpass._id.toString(), {
        wardenId,
        reason: 'First rejection',
      });

      await expect(
        outpassService.rejectOutpass(outpass._id.toString(), {
          wardenId,
          reason: 'Second rejection',
        })
      ).rejects.toThrow('Only pending outpasses can be rejected');
    });
  });

  describe('cancelOutpass', () => {
    it('should allow student to cancel their own outpass', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      const cancelled = await outpassService.cancelOutpass(
        outpass._id.toString(),
        studentId
      );

      expect(cancelled.status).toBe(OutpassStatus.CANCELLED);
    });

    it('should not allow student to cancel another student outpass', async () => {
      // Create another student
      const anotherStudent = await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'hashedpassword',
        role: UserRole.STUDENT,
        rollNumber: 'ST002',
        hostel: 'Hostel A',
      });

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      await expect(
        outpassService.cancelOutpass(outpass._id.toString(), anotherStudent._id.toString())
      ).rejects.toThrow('You can only cancel your own outpasses');
    });
  });

  describe('checkOut', () => {
    it('should check out approved outpass', async () => {
      // ARRANGE: Create and approve outpass
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      await outpassService.approveOutpass(outpass._id.toString(), { wardenId });

      // ACT: Check out
      const checkedOut = await outpassService.checkOut(outpass._id.toString(), {
        securityId,
      });

      // ASSERT
      expect(checkedOut.status).toBe(OutpassStatus.CHECKED_OUT);
      expect(checkedOut.checkOutTime).toBeDefined();
      // Handle both populated and non-populated checkOutBy field
      const actualSecurityId = checkedOut.checkOutBy
        ? (typeof checkedOut.checkOutBy === 'object' && checkedOut.checkOutBy._id
          ? checkedOut.checkOutBy._id.toString()
          : checkedOut.checkOutBy.toString())
        : '';
      expect(actualSecurityId).toBe(securityId);
    });

    it('should not check out pending outpass', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      await expect(
        outpassService.checkOut(outpass._id.toString(), { securityId })
      ).rejects.toThrow('Only approved outpasses can be checked out');
    });
  });

  describe('checkIn', () => {
    it('should check in checked out outpass', async () => {
      // ARRANGE: Create, approve, and check out
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      const outpass = await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      await outpassService.approveOutpass(outpass._id.toString(), { wardenId });
      await outpassService.checkOut(outpass._id.toString(), { securityId });

      // ACT: Check in
      const checkedIn = await outpassService.checkIn(outpass._id.toString(), {
        securityId,
      });

      // ASSERT
      expect(checkedIn.status).toBe(OutpassStatus.CHECKED_IN);
      expect(checkedIn.checkInTime).toBeDefined();
      // Handle both populated and non-populated checkInBy field
      const actualSecurityId = checkedIn.checkInBy
        ? (typeof checkedIn.checkInBy === 'object' && checkedIn.checkInBy._id
          ? checkedIn.checkInBy._id.toString()
          : checkedIn.checkInBy.toString())
        : '';
      expect(actualSecurityId).toBe(securityId);
    });

    it('should mark as overdue if checked in late', async () => {
      // ARRANGE: Create outpass with past dates
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 2);
      const dayBefore = new Date(yesterday);
      dayBefore.setDate(dayBefore.getDate() - 1);

      // Create outpass directly in DB to bypass date validation
      const outpass = await Outpass.create({
        student: studentId,
        type: OutpassType.LOCAL,
        purpose: faker.lorem.sentence(),
        destination: faker.location.city(),
        fromDate: dayBefore,
        toDate: yesterday, // Past date
        status: OutpassStatus.CHECKED_OUT,
        warden: wardenId,
        approvedAt: dayBefore,
        checkOutTime: dayBefore,
        checkOutBy: securityId,
      });

      // ACT: Check in (late)
      const checkedIn = await outpassService.checkIn(outpass._id.toString(), {
        securityId,
      });

      // ASSERT
      expect(checkedIn.status).toBe(OutpassStatus.OVERDUE);
      expect(checkedIn.isOverdue).toBe(true);
    });
  });

  describe('getStudentStats', () => {
    it('should return correct statistics', async () => {
      // ARRANGE: Create multiple outpasses with different statuses
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dayAfter = new Date(tomorrow);
      dayAfter.setDate(dayAfter.getDate() + 1);

      // Pending outpass
      await outpassService.createOutpass({
        studentId,
        type: OutpassType.LOCAL,
        purpose: 'Pending',
        destination: faker.location.city(),
        fromDate: tomorrow,
        toDate: dayAfter,
      });

      // Approved outpass - use different dates to avoid overlap
      const tomorrow2 = new Date();
      tomorrow2.setDate(tomorrow2.getDate() + 3);
      const dayAfter2 = new Date(tomorrow2);
      dayAfter2.setDate(dayAfter2.getDate() + 1);
      
      const outpass2 = await outpassService.createOutpass({
        studentId,
        type: OutpassType.HOME,
        purpose: 'Approved',
        destination: faker.location.city(),
        fromDate: tomorrow2,
        toDate: dayAfter2,
      });
      await outpassService.approveOutpass(outpass2._id.toString(), { wardenId });

      // ACT
      const stats = await outpassService.getStudentStats(studentId);

      // ASSERT
      expect(stats.totalOutpasses).toBe(2);
      expect(stats.pendingOutpasses).toBe(1);
      expect(stats.approvedOutpasses).toBe(1);
    });
  });
});

// 
