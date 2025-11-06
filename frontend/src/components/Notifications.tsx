import { useEffect, useState } from 'react';
import { useNotificationStore } from '../store/notificationStore';
import { notificationService } from '../services/notification.service';
import { Bell, X, Check, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const Notifications = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAllNotifications
  } = useNotificationStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationService.getNotifications();
      
      if (response.success && response.data) {
        // Notifications are already in the store from socket events
        // This is just to sync on initial load
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      markAsRead(id);
    } catch (error) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      markAllAsRead();
      toast.success('All notifications marked as read');
    } catch (error) {
      toast.error('Failed to mark all as read');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications?')) {
      return;
    }

    try {
      await deleteAllNotifications();
      toast.success('All notifications cleared');
    } catch (error) {
      toast.error('Failed to clear notifications');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'outpass_approved':
        return '✅';
      case 'outpass_rejected':
        return '❌';
      case 'outpass_checked_out':
        return '🚪';
      case 'outpass_checked_in':
        return '🏠';
      case 'outpass_overdue':
        return '⚠️';
      case 'system_alert':
        return '🔔';
      default:
        return '📢';
    }
  };

  return (
    <div className="relative">
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell size={24} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-600 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Panel */}
          <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-[600px] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <p className="text-sm text-gray-600">{unreadCount} unread</p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    title="Mark all as read"
                  >
                    <Check size={18} />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                    title="Clear all"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Bell className="mx-auto mb-3 text-gray-400" size={48} />
                  <p className="text-gray-600">No notifications</p>
                  <p className="text-sm text-gray-500 mt-1">You're all caught up!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <div
                      key={notification._id}
                      className={`p-4 hover:bg-gray-50 transition-colors ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 text-2xl">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <button
                                onClick={() => handleMarkAsRead(notification._id)}
                                className="flex-shrink-0 text-primary-600 hover:text-primary-700"
                                title="Mark as read"
                              >
                                <Check size={16} />
                              </button>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <p className="text-xs text-gray-500">
                              {format(new Date(notification.createdAt), 'MMM dd, hh:mm a')}
                            </p>
                            <button
                              onClick={() => handleDelete(notification._id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-3 border-t bg-gray-50">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    // Navigate to notifications page if you have one
                  }}
                  className="w-full text-center text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  View All Notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Notifications;

