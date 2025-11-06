import { create } from 'zustand';
import { authService } from '../services/auth.service';
import { socketService } from '../services/socket.service';
import type { User, LoginCredentials, RegisterData } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login(credentials);
      set({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Connect to Socket.io
      socketService.connect(response.data.token);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      set({
        user: response.data.user,
        token: response.data.token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Connect to Socket.io
      socketService.connect(response.data.token);
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: () => {
    socketService.disconnect();
    authService.logout();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    });
  },

  refreshUser: async () => {
    try {
      const user = await authService.refreshUser();
      if (user) {
        set({ user });
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  },

  setUser: (user: User) => {
    set({ user });
    localStorage.setItem('user', JSON.stringify(user));
  },

  clearError: () => {
    set({ error: null });
  },

  initialize: () => {
    const user = authService.getCurrentUser();
    const token = authService.getToken();
    
    if (user && token) {
      set({
        user,
        token,
        isAuthenticated: true,
      });
      
      // Connect to Socket.io
      socketService.connect(token);
    }
  },
}));

