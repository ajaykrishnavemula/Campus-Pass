import { apiService } from './api';
import type {
  LoginCredentials,
  RegisterData,
  AuthResponse,
  User,
  ApiResponse,
  ProfileUpdateData
} from '../types';

class AuthService {
  // Login
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse['data']>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store token and user in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return {
      success: response.success,
      message: response.message,
      data: response.data!,
    };
  }

  // Register
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiService.post<AuthResponse['data']>('/auth/register', data);
    
    if (response.success && response.data) {
      // Store token and user in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    
    return {
      success: response.success,
      message: response.message,
      data: response.data!,
    };
  }

  // Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }

  // Get current user from localStorage
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Get token from localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  // Verify token with backend
  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiService.get<{ valid: boolean }>('/auth/verify');
      return response.success && response.data?.valid === true;
    } catch {
      return false;
    }
  }

  // Refresh user data
  async refreshUser(): Promise<User | null> {
    try {
      const response = await apiService.get<User>('/auth/me');
      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data));
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }

  // Update profile
  async updateProfile(data: ProfileUpdateData): Promise<ApiResponse<User>> {
    const response = await apiService.put<User>('/auth/profile', data);
    
    if (response.success && response.data) {
      localStorage.setItem('user', JSON.stringify(response.data));
    }
    
    return response;
  }

  // Change password
  async changePassword(currentPassword: string, newPassword: string): Promise<ApiResponse> {
    return await apiService.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Request password reset
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    return await apiService.post('/auth/forgot-password', { email });
  }

  // Reset password with token
  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    return await apiService.post('/auth/reset-password', {
      token,
      newPassword,
    });
  }
}

export const authService = new AuthService();

