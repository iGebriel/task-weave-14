import { ProjectStatus, TaskStatus } from '@/types';

/**
 * Status styling configuration that follows the Open/Closed Principle.
 * New status types can be added without modifying existing code.
 */
export interface StatusStyleConfig {
  className: string;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

/**
 * Project status styling configuration
 */
export const PROJECT_STATUS_STYLES: Record<ProjectStatus, StatusStyleConfig> = {
  active: {
    className: "bg-warning/10 text-warning border-warning/20",
    label: "Active",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  draft: {
    className: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    label: "Draft",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/20",
  },
  completed: {
    className: "bg-success/10 text-success border-success/20",
    label: "Completed",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
  archived: {
    className: "bg-muted text-muted-foreground border-muted/20",
    label: "Archived",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
    borderColor: "border-muted/20",
  },
};

/**
 * Task status styling configuration
 */
export const TASK_STATUS_STYLES: Record<TaskStatus, StatusStyleConfig> = {
  todo: {
    className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    label: "To Do",
    color: "text-gray-500",
    bgColor: "bg-gray-500/10",
    borderColor: "border-gray-500/20",
  },
  progress: {
    className: "bg-warning/10 text-warning border-warning/20",
    label: "In Progress",
    color: "text-warning",
    bgColor: "bg-warning/10",
    borderColor: "border-warning/20",
  },
  done: {
    className: "bg-success/10 text-success border-success/20",
    label: "Done",
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/20",
  },
};

/**
 * Default status style for unknown status types
 */
export const DEFAULT_STATUS_STYLE: StatusStyleConfig = {
  className: "bg-muted text-muted-foreground border-muted/20",
  label: "Unknown",
  color: "text-muted-foreground",
  bgColor: "bg-muted",
  borderColor: "border-muted/20",
};

/**
 * Utility functions for retrieving status styles
 */
export class StatusStyleManager {
  /**
   * Gets the complete style configuration for a project status
   */
  static getProjectStatusStyle(status: ProjectStatus): StatusStyleConfig {
    return PROJECT_STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
  }

  /**
   * Gets the CSS class for a project status
   */
  static getProjectStatusClass(status: ProjectStatus): string {
    return this.getProjectStatusStyle(status).className;
  }

  /**
   * Gets the complete style configuration for a task status
   */
  static getTaskStatusStyle(status: TaskStatus): StatusStyleConfig {
    return TASK_STATUS_STYLES[status] || DEFAULT_STATUS_STYLE;
  }

  /**
   * Gets the CSS class for a task status
   */
  static getTaskStatusClass(status: TaskStatus): string {
    return this.getTaskStatusStyle(status).className;
  }

  /**
   * Gets all available project status options
   */
  static getAllProjectStatuses(): Array<{ value: ProjectStatus; config: StatusStyleConfig }> {
    return (Object.keys(PROJECT_STATUS_STYLES) as ProjectStatus[]).map(status => ({
      value: status,
      config: PROJECT_STATUS_STYLES[status],
    }));
  }

  /**
   * Gets all available task status options
   */
  static getAllTaskStatuses(): Array<{ value: TaskStatus; config: StatusStyleConfig }> {
    return (Object.keys(TASK_STATUS_STYLES) as TaskStatus[]).map(status => ({
      value: status,
      config: TASK_STATUS_STYLES[status],
    }));
  }
}