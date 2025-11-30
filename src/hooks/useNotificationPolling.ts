import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationsApi, Notification } from '../services/api';
import { toast } from 'sonner';

interface UseNotificationPollingOptions {
  enabled?: boolean;
  pollingInterval?: number; // in milliseconds
  showToasts?: boolean;
}

export function useNotificationPolling(options: UseNotificationPollingOptions = {}) {
  const { 
    enabled = true, 
    pollingInterval = 10000, // Default 10 seconds
    showToasts = true 
  } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const lastTimestampRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const fetchNotifications = useCallback(async () => {
    if (!enabled) return;

    try {
      setIsPolling(true);
      const response = await notificationsApi.poll(lastTimestampRef.current || undefined);
      
      if (response.success && response.data) {
        const { notifications: newNotifications, unreadCount: newUnreadCount, timestamp } = response.data;
        
        // Update timestamp for next poll
        lastTimestampRef.current = timestamp;
        
        // If we have new notifications, show toasts
        if (newNotifications.length > 0 && showToasts) {
          newNotifications.forEach(notif => {
            // Show toast based on notification type
            switch (notif.type) {
              case 'booking_confirmed':
                toast.success(notif.title, { description: notif.message });
                break;
              case 'booking_rejected':
                toast.error(notif.title, { description: notif.message });
                break;
              case 'booking_request':
                toast.info(notif.title, { description: notif.message });
                break;
              case 'grade_updated':
                toast.info(notif.title, { description: notif.message });
                break;
              case 'intervention_created':
                toast.warning(notif.title, { description: notif.message });
                break;
              default:
                toast(notif.title, { description: notif.message });
            }
          });

          // Update notifications list
          setNotifications(prev => [...newNotifications, ...prev].slice(0, 50)); // Keep max 50
        }

        setUnreadCount(newUnreadCount);
      }
    } catch (error) {
      console.error('Failed to poll notifications:', error);
    } finally {
      setIsPolling(false);
    }
  }, [enabled, showToasts]);

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await notificationsApi.markAsRead(notificationId);
      if (response.success) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter(n => !n.read);
      await Promise.all(unreadNotifications.map(n => notificationsApi.markAsRead(n.id)));
      
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [notifications]);

  // Initial fetch of all notifications
  useEffect(() => {
    const fetchInitial = async () => {
      try {
        const response = await notificationsApi.getAll();
        if (response.success && response.data) {
          setNotifications(response.data.notifications);
          setUnreadCount(response.data.unreadCount);
          // Set initial timestamp to now for subsequent polls
          lastTimestampRef.current = new Date().toISOString();
        }
      } catch (error) {
        console.error('Failed to fetch initial notifications:', error);
      }
    };

    if (enabled) {
      fetchInitial();
    }
  }, [enabled]);

  // Set up polling interval
  useEffect(() => {
    if (enabled && pollingInterval > 0) {
      intervalRef.current = setInterval(fetchNotifications, pollingInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollingInterval, fetchNotifications]);

  return {
    notifications,
    unreadCount,
    isPolling,
    markAsRead,
    markAllAsRead,
    refresh: fetchNotifications,
  };
}

export default useNotificationPolling;
