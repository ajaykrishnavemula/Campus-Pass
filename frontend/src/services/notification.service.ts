import { apiService } from './api';
import type { Notification, ApiResponse } from '../types';

class NotificationService {
  // Get all notifications for current user
  async getNotifications(): Promise<ApiResponse<Notification[]>> {
    return await apiService.get<Notification[]>('/notifications');
  }

  // Get unread notifications count
  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    return await apiService.get<{ count: number }>('/notifications/unread/count');
  }

  // Mark notification as read
  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return await apiService.patch<Notification>(`/notifications/${id}/read`);
  }

  // Mark all notifications as read
  async markAllAsRead(): Promise<ApiResponse> {
    return await apiService.patch('/notifications/read-all');
  }

  // Delete notification
  async deleteNotification(id: string): Promise<ApiResponse> {
    return await apiService.delete(`/notifications/${id}`);
  }

  // Delete all notifications
  async deleteAllNotifications(): Promise<ApiResponse> {
    return await apiService.delete('/notifications');
  }

  // Get notification by ID
  async getNotificationById(id: string): Promise<ApiResponse<Notification>> {
    return await apiService.get<Notification>(`/notifications/${id}`);
  }
}

export const notificationService = new NotificationService();

