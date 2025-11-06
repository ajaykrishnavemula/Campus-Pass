/**
 * useAuth Hook Tests
 * 
 * Tests the authentication hook that manages user state and auth operations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '../../hooks/useAuth';
import * as authService from '../../services/auth.service';

// Mock the auth service
vi.mock('../../services/auth.service');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('Initial State', () => {
    it('should initialize with null user and not loading', () => {
      // ARRANGE & ACT
      const { result } = renderHook(() => useAuth());

      // ASSERT
      expect(result.current.user).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should load user from localStorage on mount', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'student',
      };
      localStorage.setItem('user', JSON.stringify(mockUser));

      // ACT
      const { result } = renderHook(() => useAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.isAuthenticated).toBe(true);
      });
    });
  });

  describe('Login', () => {
    it('should login successfully with valid credentials', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'student',
      };
      const mockToken = 'mock-jwt-token';

      vi.mocked(authService.login).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const { result } = renderHook(() => useAuth());

      // ACT
      await act(async () => {
        await result.current.login('john@test.com', 'password123');
      });

      // ASSERT
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(localStorage.getItem('token')).toBe(mockToken);
      expect(localStorage.getItem('user')).toBe(JSON.stringify(mockUser));
    });

    it('should handle login failure', async () => {
      // ARRANGE
      const mockError = new Error('Invalid credentials');
      vi.mocked(authService.login).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      // ACT & ASSERT
      await expect(
        act(async () => {
          await result.current.login('wrong@test.com', 'wrongpass');
        })
      ).rejects.toThrow('Invalid credentials');

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should set loading state during login', async () => {
      // ARRANGE
      vi.mocked(authService.login).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useAuth());

      // ACT
      act(() => {
        result.current.login('john@test.com', 'password123');
      });

      // ASSERT
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Register', () => {
    it('should register student successfully', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'Jane Doe',
        email: 'jane@test.com',
        role: 'student',
        rollNumber: 'ST001',
      };
      const mockToken = 'mock-jwt-token';

      vi.mocked(authService.register).mockResolvedValue({
        user: mockUser,
        token: mockToken,
      });

      const { result } = renderHook(() => useAuth());

      const registerData = {
        name: 'Jane Doe',
        email: 'jane@test.com',
        password: 'password123',
        role: 'student',
        rollNumber: 'ST001',
        hostel: 'Hostel A',
        roomNumber: '101',
      };

      // ACT
      await act(async () => {
        await result.current.register(registerData);
      });

      // ASSERT
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('should handle registration failure', async () => {
      // ARRANGE
      const mockError = new Error('Email already exists');
      vi.mocked(authService.register).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      // ACT & ASSERT
      await expect(
        act(async () => {
          await result.current.register({
            name: 'Jane Doe',
            email: 'existing@test.com',
            password: 'password123',
            role: 'student',
          });
        })
      ).rejects.toThrow('Email already exists');
    });
  });

  describe('Logout', () => {
    it('should logout and clear user data', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'student',
      };
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-token');

      vi.mocked(authService.logout).mockResolvedValue();

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // ACT
      await act(async () => {
        await result.current.logout();
      });

      // ASSERT
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('user')).toBeNull();
    });
  });

  describe('Update Profile', () => {
    it('should update user profile', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'student',
      };
      const updatedUser = {
        ...mockUser,
        name: 'John Updated',
      };

      localStorage.setItem('user', JSON.stringify(mockUser));
      vi.mocked(authService.updateProfile).mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useAuth());

      // Wait for initial load
      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
      });

      // ACT
      await act(async () => {
        await result.current.updateProfile({ name: 'John Updated' });
      });

      // ASSERT
      expect(result.current.user?.name).toBe('John Updated');
      expect(localStorage.getItem('user')).toBe(JSON.stringify(updatedUser));
    });
  });

  describe('Change Password', () => {
    it('should change password successfully', async () => {
      // ARRANGE
      vi.mocked(authService.changePassword).mockResolvedValue({
        message: 'Password changed successfully',
      });

      const { result } = renderHook(() => useAuth());

      // ACT & ASSERT
      await expect(
        act(async () => {
          await result.current.changePassword('oldPass123', 'newPass123');
        })
      ).resolves.not.toThrow();
    });

    it('should handle incorrect current password', async () => {
      // ARRANGE
      const mockError = new Error('Current password is incorrect');
      vi.mocked(authService.changePassword).mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuth());

      // ACT & ASSERT
      await expect(
        act(async () => {
          await result.current.changePassword('wrongPass', 'newPass123');
        })
      ).rejects.toThrow('Current password is incorrect');
    });
  });

  describe('Token Refresh', () => {
    it('should refresh token when expired', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'student',
      };
      const newToken = 'new-jwt-token';

      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'expired-token');

      vi.mocked(authService.refreshToken).mockResolvedValue({
        token: newToken,
      });

      const { result } = renderHook(() => useAuth());

      // ACT
      await act(async () => {
        await result.current.refreshToken();
      });

      // ASSERT
      expect(localStorage.getItem('token')).toBe(newToken);
    });
  });

  describe('Role Checks', () => {
    it('should correctly identify student role', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'John Doe',
        email: 'john@test.com',
        role: 'student',
      };
      localStorage.setItem('user', JSON.stringify(mockUser));

      // ACT
      const { result } = renderHook(() => useAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isStudent).toBe(true);
        expect(result.current.isWarden).toBe(false);
        expect(result.current.isSecurity).toBe(false);
      });
    });

    it('should correctly identify warden role', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'Dr. Smith',
        email: 'smith@test.com',
        role: 'warden',
      };
      localStorage.setItem('user', JSON.stringify(mockUser));

      // ACT
      const { result } = renderHook(() => useAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isStudent).toBe(false);
        expect(result.current.isWarden).toBe(true);
        expect(result.current.isSecurity).toBe(false);
      });
    });

    it('should correctly identify security role', async () => {
      // ARRANGE
      const mockUser = {
        id: '123',
        name: 'Security Guard',
        email: 'security@test.com',
        role: 'security',
      };
      localStorage.setItem('user', JSON.stringify(mockUser));

      // ACT
      const { result } = renderHook(() => useAuth());

      // ASSERT
      await waitFor(() => {
        expect(result.current.isStudent).toBe(false);
        expect(result.current.isWarden).toBe(false);
        expect(result.current.isSecurity).toBe(true);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      // ARRANGE
      const networkError = new Error('Network error');
      vi.mocked(authService.login).mockRejectedValue(networkError);

      const { result } = renderHook(() => useAuth());

      // ACT & ASSERT
      await expect(
        act(async () => {
          await result.current.login('john@test.com', 'password123');
        })
      ).rejects.toThrow('Network error');

      expect(result.current.user).toBeNull();
    });

    it('should handle unauthorized errors', async () => {
      // ARRANGE
      const unauthorizedError = new Error('Unauthorized');
      vi.mocked(authService.getCurrentUser).mockRejectedValue(unauthorizedError);

      const { result } = renderHook(() => useAuth());

      // ACT
      await act(async () => {
        try {
          await result.current.getCurrentUser();
        } catch (error) {
          // Expected to throw
        }
      });

      // ASSERT
      expect(result.current.user).toBeNull();
    });
  });
});

// 
