import { describe, it, expect, beforeEach } from '@jest/globals';
import { AuthService } from '../../services/AuthService';
import { User, UserRole } from '../../models/User';
import { faker } from '@faker-js/faker';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
  });

  describe('register', () => {
    it('should create a new user with hashed password', async () => {
      // ARRANGE: Set up test data
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
        hostel: 'Hostel A',
        roomNumber: '101',
      };

      // ACT: Execute the function we're testing
      const user = await authService.register(userData);

      // ASSERT: Verify the results
      expect(user).toBeDefined();
      expect(user.email).toBe(userData.email.toLowerCase());
      expect(user.name).toBe(userData.name);
      expect(user.password).not.toBe(userData.password); // Password should be hashed
      expect(user.role).toBe(UserRole.STUDENT);
      expect(user.isActive).toBe(true);
    });

    it('should throw error for duplicate email', async () => {
      // ARRANGE: Create a user first
      const email = faker.internet.email();
      await User.create({
        name: faker.person.fullName(),
        email,
        password: 'hashedpassword',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      // ACT & ASSERT: Expect the function to throw
      await expect(
        authService.register({
          name: faker.person.fullName(),
          email, // Same email
          password: 'Test@123',
          role: UserRole.STUDENT,
          rollNumber: 'ST002',
        })
      ).rejects.toThrow('User with this email already exists');
    });

    it('should throw error for duplicate roll number', async () => {
      // ARRANGE: Create a user with roll number
      const rollNumber = 'ST001';
      await User.create({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'hashedpassword',
        role: UserRole.STUDENT,
        rollNumber,
      });

      // ACT & ASSERT
      await expect(
        authService.register({
          name: faker.person.fullName(),
          email: faker.internet.email(),
          password: 'Test@123',
          role: UserRole.STUDENT,
          rollNumber, // Same roll number
        })
      ).rejects.toThrow('User with this roll number already exists');
    });

    it('should default to STUDENT role if not provided', async () => {
      const userData = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        rollNumber: 'ST001',
      };

      const user = await authService.register(userData);

      expect(user.role).toBe(UserRole.STUDENT);
    });
  });

  describe('login', () => {
    it('should return user for valid credentials', async () => {
      // ARRANGE: Create a test user
      const password = 'Test@123';
      const email = faker.internet.email();
      
      await authService.register({
        name: faker.person.fullName(),
        email,
        password,
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      // ACT: Try to login
      const user = await authService.login(email, password);

      // ASSERT: Check the response
      expect(user).toBeDefined();
      expect(user.email).toBe(email.toLowerCase());
    });

    it('should throw error for invalid email', async () => {
      // ACT & ASSERT
      await expect(
        authService.login('nonexistent@example.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for invalid password', async () => {
      // ARRANGE
      const email = faker.internet.email();
      await authService.register({
        name: faker.person.fullName(),
        email,
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      // ACT & ASSERT
      await expect(
        authService.login(email, 'WrongPassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should throw error for inactive user', async () => {
      // ARRANGE: Create and deactivate user
      const email = faker.internet.email();
      const user = await authService.register({
        name: faker.person.fullName(),
        email,
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      await authService.deactivateUser(user._id.toString());

      // ACT & ASSERT
      await expect(
        authService.login(email, 'Test@123')
      ).rejects.toThrow('Your account has been deactivated');
    });
  });

  describe('getUserById', () => {
    it('should return user by ID', async () => {
      // ARRANGE
      const user = await authService.register({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      // ACT
      const foundUser = await authService.getUserById(user._id.toString());

      // ASSERT
      expect(foundUser).toBeDefined();
      expect(foundUser?._id.toString()).toBe(user._id.toString());
    });

    it('should return null for non-existent ID', async () => {
      const result = await authService.getUserById('507f1f77bcf86cd799439011');
      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update user profile', async () => {
      // ARRANGE
      const user = await authService.register({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      const updates = {
        name: 'Updated Name',
        phone: '1234567890',
        hostel: 'Hostel B',
      };

      // ACT
      const updated = await authService.updateProfile(user._id.toString(), updates);

      // ASSERT
      expect(updated).toBeDefined();
      expect(updated?.name).toBe(updates.name);
      expect(updated?.phone).toBe(updates.phone);
      expect(updated?.hostel).toBe(updates.hostel);
    });

    it('should throw error for non-existent user', async () => {
      await expect(
        authService.updateProfile('507f1f77bcf86cd799439011', { name: 'Test' })
      ).rejects.toThrow('User not found');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      // ARRANGE
      const oldPassword = 'Test@123';
      const newPassword = 'NewTest@456';
      const email = faker.internet.email();

      const user = await authService.register({
        name: faker.person.fullName(),
        email,
        password: oldPassword,
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      // ACT
      await authService.changePassword(user._id.toString(), oldPassword, newPassword);

      // ASSERT: Try logging in with new password
      const loggedInUser = await authService.login(email, newPassword);
      expect(loggedInUser).toBeDefined();
    });

    it('should throw error for incorrect current password', async () => {
      // ARRANGE
      const user = await authService.register({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      // ACT & ASSERT
      await expect(
        authService.changePassword(user._id.toString(), 'WrongPassword', 'NewTest@456')
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('user activation/deactivation', () => {
    it('should deactivate user', async () => {
      // ARRANGE
      const user = await authService.register({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      // ACT
      await authService.deactivateUser(user._id.toString());

      // ASSERT
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isActive).toBe(false);
    });

    it('should activate user', async () => {
      // ARRANGE
      const user = await authService.register({
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });
      await authService.deactivateUser(user._id.toString());

      // ACT
      await authService.activateUser(user._id.toString());

      // ASSERT
      const updatedUser = await User.findById(user._id);
      expect(updatedUser?.isActive).toBe(true);
    });
  });

  describe('getAllUsers', () => {
    it('should return all users', async () => {
      // ARRANGE: Create multiple users
      await authService.register({
        name: 'Student 1',
        email: 'student1@test.com',
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      await authService.register({
        name: 'Warden 1',
        email: 'warden1@test.com',
        password: 'Test@123',
        role: UserRole.WARDEN,
      });

      // ACT
      const users = await authService.getAllUsers();

      // ASSERT
      expect(users.length).toBeGreaterThanOrEqual(2);
    });

    it('should filter users by role', async () => {
      // ARRANGE
      await authService.register({
        name: 'Student 1',
        email: 'student1@test.com',
        password: 'Test@123',
        role: UserRole.STUDENT,
        rollNumber: 'ST001',
      });

      await authService.register({
        name: 'Warden 1',
        email: 'warden1@test.com',
        password: 'Test@123',
        role: UserRole.WARDEN,
      });

      // ACT
      const students = await authService.getAllUsers({ role: UserRole.STUDENT });

      // ASSERT
      expect(students.length).toBeGreaterThan(0);
      students.forEach(user => {
        expect(user.role).toBe(UserRole.STUDENT);
      });
    });
  });
});

// 
