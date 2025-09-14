import { apiClient } from '@/lib/api';
import { AdminNotification, NotificationStats, AdminDashboardStats } from '@/types/api';

/**
 * Admin service for handling administrative features
 */
export class AdminService {
  /**
   * Get admin dashboard statistics
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    try {
      const response = await apiClient.getAdminDashboardStats();

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load dashboard stats');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to load dashboard stats');
    }
  }

  /**
   * Get admin notifications
   */
  async getNotifications(params: {
    status?: string;
    priority?: string;
    notification_type?: string;
    page?: number;
    per_page?: number;
  } = {}): Promise<AdminNotification[]> {
    try {
      const response = await apiClient.getAdminNotifications(params);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load notifications');
      }

      return response.data.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to load notifications');
    }
  }

  /**
   * Acknowledge a notification
   */
  async acknowledgeNotification(notificationId: number): Promise<AdminNotification> {
    try {
      const response = await apiClient.acknowledgeNotification(notificationId);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to acknowledge notification');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to acknowledge notification');
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(): Promise<NotificationStats> {
    try {
      const response = await apiClient.getNotificationStats();

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load notification stats');
      }

      return response.data;
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to load notification stats');
    }
  }

  /**
   * Export project tasks
   */
  async exportProjectTasks(projectId: number, format: 'csv' | 'json' | 'ndjson' = 'json'): Promise<any[] | void> {
    try {
      return await apiClient.exportProjectTasks(projectId, { format });
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Failed to export tasks');
    }
  }
}

// Export singleton instance
export const adminService = new AdminService();
