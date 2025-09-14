import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '@/App';
import { render, createMockUser, createMockProject, createMockTask, mockLocalStorage } from '@/test/utils';
import { mockToast, createMockUseProjects, createMockUseTasks } from '@/test/mocks';

// Mock localStorage
const mockStorage = mockLocalStorage();
Object.defineProperty(window, 'localStorage', { value: mockStorage });

// Mock hooks
const mockUseProjects = vi.fn();
const mockUseTasks = vi.fn();

vi.mock('@/hooks/useProjects', () => ({
  useProjects: mockUseProjects,
}));

vi.mock('@/hooks/useTasks', () => ({
  useTasks: mockUseTasks,
}));

describe('Complete User Workflow Acceptance Tests', () => {
  const mockUser = createMockUser({
    name: 'Test User',
    email: 'test@example.com',
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.clear();
    
    // Set up default mock returns
    mockUseProjects.mockReturnValue(createMockUseProjects());
    mockUseTasks.mockReturnValue(createMockUseTasks());
  });

  describe('Complete Project Management Workflow', () => {
    it('should complete the full project lifecycle: create → manage → complete', async () => {
      const user = userEvent.setup();
      
      // Start logged in
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));
      
      // Mock empty projects initially
      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [],
      }));

      render(<App />);

      // Step 1: Verify dashboard loads
      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });

      // Step 2: Create new project
      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      await user.click(newProjectButton);

      // Fill project creation form
      await waitFor(() => {
        expect(screen.getByText(/create.*project/i)).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/project name/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      
      await user.type(nameInput, 'My Test Project');
      await user.type(descriptionInput, 'A comprehensive test project for workflow validation');

      const createButton = screen.getByRole('button', { name: /create project/i });
      await user.click(createButton);

      // Mock project creation success
      const newProject = createMockProject({
        id: '1',
        name: 'My Test Project',
        description: 'A comprehensive test project for workflow validation',
        status: 'active',
      });

      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [newProject],
      }));

      // Step 3: Verify project appears in dashboard
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText('My Test Project')).toBeInTheDocument();
        expect(screen.getByText('A comprehensive test project for workflow validation')).toBeInTheDocument();
      });

      // Step 4: Enter project board
      const projectCard = screen.getByText('My Test Project').closest('[data-testid="project-card"]');
      if (projectCard) {
        await user.click(projectCard);
      }

      // Should navigate to project board
      await waitFor(() => {
        expect(screen.queryByText(/project dashboard/i)).not.toBeInTheDocument();
        expect(screen.getByText('My Test Project')).toBeInTheDocument();
      });

      // Step 5: Create tasks in the project
      const addTaskButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addTaskButton);

      // Fill task creation form
      const taskNameInput = screen.getByLabelText(/task title/i);
      const taskDescInput = screen.getByLabelText(/task description/i);
      
      await user.type(taskNameInput, 'Setup project structure');
      await user.type(taskDescInput, 'Create the basic project structure and folders');

      // Set priority
      const prioritySelect = screen.getByLabelText(/priority/i);
      await user.selectOptions(prioritySelect, 'high');

      const createTaskButton = screen.getByRole('button', { name: /create task/i });
      await user.click(createTaskButton);

      // Mock task creation
      const newTask = createMockTask({
        id: '1',
        title: 'Setup project structure',
        description: 'Create the basic project structure and folders',
        priority: 'high',
        status: 'todo',
        projectId: '1',
      });

      mockUseTasks.mockReturnValue(createMockUseTasks({
        tasks: [newTask],
      }));

      // Step 6: Verify task appears in board
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText('Setup project structure')).toBeInTheDocument();
      });

      // Step 7: Move task through workflow (todo → progress → done)
      const taskCard = screen.getByText('Setup project structure').closest('[data-testid="task-card"]');
      
      // Move to progress column
      const progressColumn = screen.getByText(/in progress/i).closest('[data-testid="column"]');
      
      // Simulate drag and drop (simplified)
      if (taskCard && progressColumn) {
        // In a real test, this would use drag and drop simulation
        const moveButton = within(taskCard).getByRole('button', { name: /move/i });
        await user.click(moveButton);
        
        const progressOption = screen.getByText(/in progress/i);
        await user.click(progressOption);
      }

      // Mock task status update
      const updatedTask = { ...newTask, status: 'progress' as const };
      mockUseTasks.mockReturnValue(createMockUseTasks({
        tasks: [updatedTask],
      }));

      // Step 8: Complete the task
      render(<App />);
      const editTaskButton = screen.getByRole('button', { name: /edit task/i });
      await user.click(editTaskButton);

      const statusSelect = screen.getByLabelText(/status/i);
      await user.selectOptions(statusSelect, 'done');

      const saveTaskButton = screen.getByRole('button', { name: /save task/i });
      await user.click(saveTaskButton);

      // Mock completed task
      const completedTask = { ...updatedTask, status: 'done' as const };
      mockUseTasks.mockReturnValue(createMockUseTasks({
        tasks: [completedTask],
      }));

      // Step 9: Verify task completion
      render(<App />);
      await waitFor(() => {
        expect(screen.getByText('Setup project structure')).toBeInTheDocument();
        // Task should be in done column
        const doneColumn = screen.getByText(/done/i).closest('[data-testid="column"]');
        expect(doneColumn).toContainElement(screen.getByText('Setup project structure'));
      });

      // Step 10: Navigate back to dashboard
      const backToDashboardButton = screen.getByRole('button', { name: /back.*dashboard/i });
      await user.click(backToDashboardButton);

      await waitFor(() => {
        expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();
      });

      // Step 11: Verify project progress is updated
      expect(screen.getByText('My Test Project')).toBeInTheDocument();
      // Should show completion progress (1/1 tasks = 100%)
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Task Management Workflow with Collaboration', () => {
    it('should handle complete task assignment and collaboration workflow', async () => {
      const user = userEvent.setup();
      
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));
      
      const testProject = createMockProject({
        name: 'Collaborative Project',
      });

      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [testProject],
      }));

      render(<App />);

      // Navigate to project
      const projectCard = screen.getByText('Collaborative Project');
      await user.click(projectCard);

      // Create task with assignee
      const addTaskButton = screen.getByRole('button', { name: /add task/i });
      await user.click(addTaskButton);

      await user.type(screen.getByLabelText(/title/i), 'Review design mockups');
      await user.type(screen.getByLabelText(/description/i), 'Review and provide feedback on the new design mockups');
      
      // Assign to team member
      const assigneeInput = screen.getByLabelText(/assignee/i);
      await user.type(assigneeInput, 'Jane Doe');

      // Set due date
      const dueDateInput = screen.getByLabelText(/due date/i);
      await user.type(dueDateInput, '2024-12-31');

      await user.click(screen.getByRole('button', { name: /create task/i }));

      // Mock task with assignment
      const assignedTask = createMockTask({
        title: 'Review design mockups',
        assignee: 'Jane Doe',
        dueDate: new Date('2024-12-31'),
        priority: 'medium',
      });

      mockUseTasks.mockReturnValue(createMockUseTasks({
        tasks: [assignedTask],
      }));

      // Verify task assignment
      render(<App />);
      expect(screen.getByText('Review design mockups')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // Assignee initials
      expect(screen.getByText('12/31/2024')).toBeInTheDocument(); // Due date

      // Add comment to task
      const taskCard = screen.getByText('Review design mockups');
      await user.click(taskCard);

      const commentInput = screen.getByPlaceholderText(/add.*comment/i);
      await user.type(commentInput, 'Added latest design files to the shared folder');

      const addCommentButton = screen.getByRole('button', { name: /add comment/i });
      await user.click(addCommentButton);

      // Verify comment appears
      expect(screen.getByText('Added latest design files to the shared folder')).toBeInTheDocument();
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle network errors gracefully and allow recovery', async () => {
      const user = userEvent.setup();
      
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));

      // Mock network error
      mockUseProjects.mockReturnValue(createMockUseProjects({
        isLoading: false,
        error: new Error('Network error'),
        projects: [],
      }));

      render(<App />);

      // Should still show dashboard but handle error gracefully
      expect(screen.getByText(/project dashboard/i)).toBeInTheDocument();

      // Try to create project despite error
      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      await user.click(newProjectButton);

      await user.type(screen.getByLabelText(/project name/i), 'Recovery Test Project');
      await user.click(screen.getByRole('button', { name: /create project/i }));

      // Should show error toast
      expect(mockToast.error).toHaveBeenCalledWith(
        expect.stringMatching(/error/i)
      );

      // Mock recovery - error resolved
      const recoveredProject = createMockProject({
        name: 'Recovery Test Project',
      });

      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [recoveredProject],
        error: null,
      }));

      // Retry action
      await user.click(screen.getByRole('button', { name: /create project/i }));

      // Should succeed on retry
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringMatching(/project.*created/i)
      );
    });

    it('should handle data inconsistencies and sync issues', async () => {
      const user = userEvent.setup();
      
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));

      const project1 = createMockProject({ id: '1', name: 'Project A' });
      const project2 = createMockProject({ id: '2', name: 'Project B' });

      // Start with two projects
      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [project1, project2],
      }));

      render(<App />);

      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.getByText('Project B')).toBeInTheDocument();

      // Simulate data sync issue - one project disappears
      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [project1], // Project B disappeared
      }));

      // Force re-render to simulate data refresh
      render(<App />);

      // Should handle missing project gracefully
      expect(screen.getByText('Project A')).toBeInTheDocument();
      expect(screen.queryByText('Project B')).not.toBeInTheDocument();

      // Should show correct project count
      expect(screen.getByText('1')).toBeInTheDocument(); // Total projects
    });
  });

  describe('Performance and Loading States', () => {
    it('should handle slow loading gracefully with proper loading states', async () => {
      const user = userEvent.setup();
      
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));

      // Mock slow loading
      mockUseProjects.mockReturnValue(createMockUseProjects({
        isLoading: true,
        projects: [],
      }));

      render(<App />);

      // Should show loading state
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner

      // Simulate loading completion
      await waitFor(() => {
        mockUseProjects.mockReturnValue(createMockUseProjects({
          isLoading: false,
          projects: [createMockProject()],
        }));
      });

      render(<App />);

      // Loading should be hidden, content should appear
      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      expect(screen.getByText('Test Project')).toBeInTheDocument();
    });
  });

  describe('Accessibility Workflow', () => {
    it('should be fully navigable with keyboard only', async () => {
      const user = userEvent.setup();
      
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));
      
      const testProject = createMockProject();
      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [testProject],
      }));

      render(<App />);

      // Tab through interface elements
      await user.tab(); // Should focus on first interactive element

      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      
      // Navigate to new project button using keyboard
      newProjectButton.focus();
      expect(newProjectButton).toHaveFocus();

      // Activate with keyboard
      await user.keyboard('{Enter}');

      // Should open modal
      await waitFor(() => {
        expect(screen.getByText(/create.*project/i)).toBeInTheDocument();
      });

      // Navigate form fields with tab
      await user.tab();
      expect(screen.getByLabelText(/project name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/description/i)).toHaveFocus();

      // Fill and submit with keyboard
      await user.type(screen.getByLabelText(/project name/i), 'Keyboard Navigation Test');
      await user.keyboard('{Tab}'); // Move to next field
      await user.type(screen.getByLabelText(/description/i), 'Testing keyboard accessibility');

      // Submit with Enter key
      const createButton = screen.getByRole('button', { name: /create project/i });
      createButton.focus();
      await user.keyboard('{Enter}');

      // Should create project (mocked success)
      expect(mockToast.success).toHaveBeenCalled();
    });

    it('should have proper ARIA labels and screen reader support', () => {
      mockStorage.setItem('taskflow_user', JSON.stringify(mockUser));
      
      const testProject = createMockProject();
      mockUseProjects.mockReturnValue(createMockUseProjects({
        projects: [testProject],
      }));

      render(<App />);

      // Check for proper ARIA labels
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new project/i })).toBeInTheDocument();
      
      // Statistics should be properly labeled
      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('Active Projects')).toBeInTheDocument();
      expect(screen.getByText('Completed Projects')).toBeInTheDocument();

      // Loading states should be accessible
      mockUseProjects.mockReturnValue(createMockUseProjects({
        isLoading: true,
        projects: [],
      }));

      render(<App />);
      
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
    });
  });
});
