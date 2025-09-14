import {
  ITaskService,
  IStorageService,
  INotificationService
} from '../interfaces';
import { Task, CreateTaskData, UpdateTaskData } from '@/types';
import { apiClient } from '@/lib/api';
import { dummyTasks, getDummyTasksForProject } from '@/data/dummyData';

/**
 * DI-compatible Task service implementation
 */
export class DITaskService implements ITaskService {
  private readonly TASKS_STORAGE_KEY = 'tasks';
  private tasks: Task[] = [];

  constructor(
    private storage: IStorageService,
    private notification: INotificationService
  ) {
    this.loadTasksFromStorage();
  }

  async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const response = await apiClient.getTasks({ project_id: parseInt(projectId) });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load project tasks');
      }

      // Transform API tasks to frontend format
      const tasks = response.data.data.map(apiTask => ({
        id: apiTask.id.toString(),
        title: apiTask.title,
        description: apiTask.description,
        status: apiTask.status,
        priority: apiTask.priority,
        dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
        completedAt: apiTask.completed_at ? new Date(apiTask.completed_at) : undefined,
        projectId: apiTask.project.id.toString(),
        assigneeId: apiTask.user.id.toString(),
        createdAt: new Date(apiTask.created_at),
        updatedAt: new Date(apiTask.updated_at),
        tags: [],
        subtasks: [],
        comments: [],
      }));

      return tasks;
    } catch (error) {
      // Fallback to local data if API is not accessible
      console.warn('API failed to load project tasks, falling back to local data:', error);
      this.notification.warning('Using offline data - some features may be limited');

      // Return cached tasks for this project
      let projectTasks = this.tasks.filter(task => task.projectId === projectId);

      // If no cached tasks, use dummy data
      if (projectTasks.length === 0) {
        projectTasks = getDummyTasksForProject(projectId);
        // Add dummy tasks to local cache
        projectTasks.forEach(task => {
          if (!this.tasks.find(t => t.id === task.id)) {
            this.tasks.push(task);
          }
        });
        this.saveTasksToStorage();
      }

      return [...projectTasks];
    }
  }

  async getTask(id: string): Promise<Task> {
    try {
      const response = await apiClient.getTask(parseInt(id));

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Task not found');
      }

      const apiTask = response.data;

      // Transform API task to frontend format
      const task: Task = {
        id: apiTask.id.toString(),
        title: apiTask.title,
        description: apiTask.description,
        status: apiTask.status,
        priority: apiTask.priority,
        dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
        completedAt: apiTask.completed_at ? new Date(apiTask.completed_at) : undefined,
        projectId: apiTask.project.id.toString(),
        assigneeId: apiTask.user.id.toString(),
        createdAt: new Date(apiTask.created_at),
        updatedAt: new Date(apiTask.updated_at),
        tags: [],
        subtasks: [],
        comments: [],
      };

      return task;
    } catch (error) {
      // Fallback to local data if API is not accessible
      console.warn('API failed to load task, falling back to local data:', error);
      this.notification.warning('Using offline data - some features may be limited');

      // Try to find task in local cache
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        return { ...task };
      }

      // If not found locally, throw error
      this.notification.error('Task not found');
      throw new Error('Task not found');
    }
  }

  async createTask(data: CreateTaskData): Promise<Task> {
    try {
      const response = await apiClient.createTask({
        task: {
          title: data.title,
          description: data.description,
          status: data.status || 'todo',
          priority: data.priority || 'medium',
          project_id: parseInt(data.projectId),
          user_id: data.assigneeId ? parseInt(data.assigneeId) : undefined,
          due_date: data.dueDate ? data.dueDate.toISOString() : undefined,
        }
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to create task');
      }

      const apiTask = response.data;

      // Transform API task to frontend format
      const newTask: Task = {
        id: apiTask.id.toString(),
        title: apiTask.title,
        description: apiTask.description,
        status: apiTask.status,
        priority: apiTask.priority,
        projectId: apiTask.project.id.toString(),
        columnId: data.columnId || 'todo',
        assigneeId: apiTask.user.id.toString(),
        dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
        createdAt: new Date(apiTask.created_at),
        updatedAt: new Date(apiTask.updated_at),
        order: this.getNextOrder(data.projectId, data.columnId || 'todo'),
        tags: data.tags || [],
        attachments: data.attachments || [],
        comments: [],
      };

      // Update local cache
      this.tasks.push(newTask);
      this.saveTasksToStorage();

      this.notification.success('Task created successfully');
      return { ...newTask };
    } catch (error) {
      // Fallback to local creation if API is not accessible
      console.warn('API failed to create task, creating locally:', error);
      this.notification.warning('Task created offline - will sync when connection is restored');

      // Create task locally
      const newTask: Task = {
        id: `task_${Date.now()}`,
        title: data.title,
        description: data.description,
        status: data.status || 'todo',
        priority: data.priority || 'medium',
        projectId: data.projectId,
        columnId: data.columnId || 'todo',
        assigneeId: data.assigneeId || '1',
        dueDate: data.dueDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        order: this.getNextOrder(data.projectId, data.columnId || 'todo'),
        tags: data.tags || [],
        attachments: data.attachments || [],
        comments: [],
      };

      // Update local cache
      this.tasks.push(newTask);
      this.saveTasksToStorage();

      this.notification.success('Task created successfully (offline)');
      return { ...newTask };
    }
  }

  async updateTask(id: string, data: UpdateTaskData): Promise<Task> {
    try {
      const index = this.tasks.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Task not found');
      }

      const updatedTask: Task = {
        ...this.tasks[index],
        ...data,
        updatedAt: new Date(),
      };

      this.tasks[index] = updatedTask;
      this.saveTasksToStorage();

      this.notification.success('Task updated successfully');
      return { ...updatedTask };
    } catch (error) {
      this.notification.error('Failed to update task');
      throw error;
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      const index = this.tasks.findIndex(t => t.id === id);
      if (index === -1) {
        throw new Error('Task not found');
      }

      this.tasks.splice(index, 1);
      this.saveTasksToStorage();

      this.notification.success('Task deleted successfully');
    } catch (error) {
      this.notification.error('Failed to delete task');
      throw error;
    }
  }

  async moveTask(taskId: string, newColumnId: string, position: number): Promise<Task> {
    try {
      const taskIndex = this.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const task = this.tasks[taskIndex];
      const updatedTask: Task = {
        ...task,
        columnId: newColumnId,
        status: this.mapColumnIdToStatus(newColumnId),
        order: position,
        updatedAt: new Date(),
      };

      // Update orders for other tasks in the target column
      this.reorderTasks(task.projectId, newColumnId, position);

      this.tasks[taskIndex] = updatedTask;
      this.saveTasksToStorage();

      return { ...updatedTask };
    } catch (error) {
      this.notification.error('Failed to move task');
      throw error;
    }
  }

  async assignTask(taskId: string, assigneeId: string): Promise<Task> {
    try {
      const taskIndex = this.tasks.findIndex(t => t.id === taskId);
      if (taskIndex === -1) {
        throw new Error('Task not found');
      }

      const updatedTask: Task = {
        ...this.tasks[taskIndex],
        assigneeId,
        updatedAt: new Date(),
      };

      this.tasks[taskIndex] = updatedTask;
      this.saveTasksToStorage();

      this.notification.success('Task assigned successfully');
      return { ...updatedTask };
    } catch (error) {
      this.notification.error('Failed to assign task');
      throw error;
    }
  }

  async getTasksByAssignee(assigneeId: string): Promise<Task[]> {
    try {
      return this.tasks.filter(task => task.assigneeId === assigneeId);
    } catch (error) {
      this.notification.error('Failed to load assigned tasks');
      throw error;
    }
  }

  /**
   * Get next order number for a task in a specific column
   */
  private getNextOrder(projectId: string, columnId: string): number {
    const columnTasks = this.tasks.filter(
      task => task.projectId === projectId && task.columnId === columnId
    );

    if (columnTasks.length === 0) {
      return 0;
    }

    const maxOrder = Math.max(...columnTasks.map(task => task.order || 0));
    return maxOrder + 1;
  }

  /**
   * Reorder tasks in a column when a task is moved
   */
  private reorderTasks(projectId: string, columnId: string, insertPosition: number): void {
    const columnTasks = this.tasks.filter(
      task => task.projectId === projectId && task.columnId === columnId
    );

    columnTasks.forEach((task, index) => {
      const taskIndex = this.tasks.findIndex(t => t.id === task.id);
      if (taskIndex !== -1) {
        this.tasks[taskIndex].order = index >= insertPosition ? index + 1 : index;
      }
    });
  }

  /**
   * Map column ID to task status
   */
  private mapColumnIdToStatus(columnId: string): string {
    const statusMap: Record<string, string> = {
      'todo': 'todo',
      'in-progress': 'in-progress',
      'in-review': 'in-review',
      'done': 'completed',
      'completed': 'completed',
    };

    return statusMap[columnId] || columnId;
  }

  /**
   * Load tasks from storage
   */
  private loadTasksFromStorage(): void {
    const storedTasks = this.storage.getItem<Task[]>(this.TASKS_STORAGE_KEY);
    if (storedTasks) {
      this.tasks = storedTasks.map(task => ({
        ...task,
        createdAt: new Date(task.createdAt),
        updatedAt: new Date(task.updatedAt),
        dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
      }));
    }
  }

  /**
   * Save tasks to storage
   */
  private saveTasksToStorage(): void {
    this.storage.setItem(this.TASKS_STORAGE_KEY, this.tasks);
  }
}