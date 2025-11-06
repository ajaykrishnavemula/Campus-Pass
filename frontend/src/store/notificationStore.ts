import { create } from 'zustand';
import { notificationService } from '../services/notification.service';
import { socketService } from '../services/socket.service';
import type { Notification } from '../types';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  updateNotification: (id: string, updates: Partial<Notification>) => void;
  initialize: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const response = await notificationService.getNotifications();
      if (response.success && response.data) {
        set({ notifications: response.data, isLoading: false });
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await notificationService.getUnreadCount();
      if (response.success && response.data) {
        set({ unreadCount: response.data.count });
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n._id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
      
      // Emit to socket for cross-device sync
      socketService.markNotificationAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      
      // Update local state
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await notificationService.deleteNotification(id);
      
      // Update local state
      set((state) => {
        const notification = state.notifications.find((n) => n._id === id);
        return {
          notifications: state.notifications.filter((n) => n._id !== id),
          unreadCount: notification && !notification.read 
            ? Math.max(0, state.unreadCount - 1) 
            : state.unreadCount,
        };
      });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  deleteAllNotifications: async () => {
    try {
      await notificationService.deleteAllNotifications();
      
      // Update local state
      set({ notifications: [], unreadCount: 0 });
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: !notification.read ? state.unreadCount + 1 : state.unreadCount,
    }));
  },

  updateNotification: (id: string, updates: Partial<Notification>) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, ...updates } : n
      ),
    }));
  },

  initialize: () => {
    // Setup socket listeners
    socketService.onNewNotification((data) => {
      get().addNotification(data.notification);
    });

    socketService.onNotificationRead((data) => {
      get().updateNotification(data.notificationId, { read: true });
      set((state) => ({
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    });

    // Fetch initial data
    get().fetchNotifications();
    get().fetchUnreadCount();
  },
}));

