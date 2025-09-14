import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/services/implementations/AdminService';
import { AdminNotification, NotificationStats, AdminDashboardStats } from '@/types/api';

/**
 * Hook for admin dashboard functionality
 */
export function useAdminDashboard() {
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getDashboardStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for admin notifications
 */
export function useAdminNotifications(params: {
  status?: string;
  priority?: string;
  notification_type?: string;
  page?: number;
  per_page?: number;
} = {}) {
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getNotifications(params);
      setNotifications(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [params.status, params.priority, params.notification_type, params.page, params.per_page]);

  const acknowledgeNotification = useCallback(async (notificationId: number) => {
    try {
      const updatedNotification = await adminService.acknowledgeNotification(notificationId);

      // Update the notification in the list
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? updatedNotification
            : notification
        )
      );

      return updatedNotification;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to acknowledge notification');
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    refetch: fetchNotifications,
    acknowledgeNotification,
  };
}

/**
 * Hook for notification statistics
 */
export function useNotificationStats() {
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getNotificationStats();
      setStats(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notification stats');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
}

/**
 * Hook for task exports
 */
export function useTaskExport() {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportTasks = useCallback(async (projectId: number, format: 'csv' | 'json' | 'ndjson' = 'json') => {
    try {
      setExporting(true);
      setError(null);
      const result = await adminService.exportProjectTasks(projectId, format);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export tasks';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setExporting(false);
    }
  }, []);

  return {
    exportTasks,
    exporting,
    error,
  };
}