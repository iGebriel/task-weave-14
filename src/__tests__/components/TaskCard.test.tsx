import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCard } from '@/components/TaskCard';
import { render, createMockTask, createMockHandlers } from '@/test/utils';

describe('TaskCard Component', () => {
  const mockHandlers = createMockHandlers();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render task information correctly', () => {
      const mockTask = createMockTask({
        title: 'Test Task Title',
        description: 'Test task description',
        priority: 'high',
        assignee: 'John Doe',
        dueDate: new Date('2024-12-25'),
      });

      render(<TaskCard task={mockTask} onTaskUpdate={mockHandlers.onTaskUpdate} />);

      expect(screen.getByText('Test Task Title')).toBeInTheDocument();
      expect(screen.getByText('Test task description')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('JD')).toBeInTheDocument(); // Initials
      expect(screen.getByText('12/25/2024')).toBeInTheDocument();
    });

    it('should display priority badge with correct styling', () => {
      const highPriorityTask = createMockTask({ priority: 'high' });
      const { rerender } = render(<TaskCard task={highPriorityTask} />);

      const priorityBadge = screen.getByText('high');
      expect(priorityBadge).toHaveClass('bg-destructive/10', 'text-destructive');

      const mediumPriorityTask = createMockTask({ priority: 'medium' });
      rerender(<TaskCard task={mediumPriorityTask} />);

      const mediumBadge = screen.getByText('medium');
      expect(mediumBadge).toHaveClass('bg-warning/10', 'text-warning');

      const lowPriorityTask = createMockTask({ priority: 'low' });
      rerender(<TaskCard task={lowPriorityTask} />);

      const lowBadge = screen.getByText('low');
      expect(lowBadge).toHaveClass('bg-success/10', 'text-success');
    });

    it('should show overdue badge for past due dates', () => {
      const overdueTaks = createMockTask({
        dueDate: new Date('2020-01-01'),
        status: 'todo',
      });

      render(<TaskCard task={overdueTaks} />);

      expect(screen.getByText('Overdue')).toBeInTheDocument();
    });

    it('should not show overdue badge for completed tasks', () => {
      const completedTask = createMockTask({
        dueDate: new Date('2020-01-01'),
        status: 'done',
      });

      render(<TaskCard task={completedTask} />);

      expect(screen.queryByText('Overdue')).not.toBeInTheDocument();
    });

    it('should handle tasks without assignee', () => {
      const unassignedTask = createMockTask({ assignee: undefined });

      render(<TaskCard task={unassignedTask} />);

      // Should not crash and should not show avatar
      expect(screen.queryByText('JD')).not.toBeInTheDocument();
    });

    it('should handle tasks without due date', () => {
      const taskWithoutDueDate = createMockTask({
        dueDate: undefined,
        createdAt: undefined as any // This will prevent the created date from showing
      });

      render(<TaskCard task={taskWithoutDueDate} />);

      // Should not crash and should not show any dates (neither due date nor created date)
      expect(screen.queryByText(/\d{1,2}\/\d{1,2}\/\d{4}/)).not.toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should show action buttons on hover', async () => {
      const mockTask = createMockTask();
      render(<TaskCard task={mockTask} onTaskUpdate={mockHandlers.onTaskUpdate} />);

      const taskCard = screen.getByText(mockTask.title).closest('.card-elegant');

      // Action buttons should be hidden initially
      const editButton = screen.getByRole('button');
      expect(editButton.parentElement).toHaveClass('opacity-0');

      // Hover over the card
      if (taskCard) {
        await userEvent.hover(taskCard);

        // Action buttons should become visible (this is CSS-based, so we test the class)
        expect(editButton.parentElement).toHaveClass('group-hover:opacity-100');
      }
    });

    it('should enter edit mode when edit button is clicked', async () => {
      const mockTask = createMockTask();
      render(<TaskCard task={mockTask} onTaskUpdate={mockHandlers.onTaskUpdate} />);

      // Use more specific selector to find the edit button
      const editButton = screen.getByLabelText(/edit task/i);
      await userEvent.click(editButton);

      // Should show the inline edit form
      expect(screen.getByDisplayValue(mockTask.title)).toBeInTheDocument();
      expect(screen.getByDisplayValue(mockTask.description)).toBeInTheDocument();
    });

    it('should call onTaskUpdate when task is saved', async () => {
      const mockTask = createMockTask();
      render(<TaskCard task={mockTask} onTaskUpdate={mockHandlers.onTaskUpdate} />);

      // Enter edit mode
      const editButton = screen.getByLabelText(/edit task/i);
      await userEvent.click(editButton);

      // Modify the task
      const titleInput = screen.getByDisplayValue(mockTask.title);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Updated Task Title');

      // Save the task
      const saveButton = screen.getByRole('button', { name: /save/i });
      await userEvent.click(saveButton);

      // Should call the update handler
      expect(mockHandlers.onTaskUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...mockTask,
          title: 'Updated Task Title',
        })
      );
    });

    it('should cancel edit mode without saving changes', async () => {
      const mockTask = createMockTask();
      render(<TaskCard task={mockTask} onTaskUpdate={mockHandlers.onTaskUpdate} />);

      // Enter edit mode
      const editButton = screen.getByLabelText(/edit task/i);
      await userEvent.click(editButton);

      // Modify the task
      const titleInput = screen.getByDisplayValue(mockTask.title);
      await userEvent.clear(titleInput);
      await userEvent.type(titleInput, 'Modified Title');

      // Cancel editing
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await userEvent.click(cancelButton);

      // Should not call the update handler
      expect(mockHandlers.onTaskUpdate).not.toHaveBeenCalled();

      // Should show original title
      expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    });
  });

  describe('Drag and Drop', () => {
    it('should provide drag handle', () => {
      const mockTask = createMockTask();
      render(<TaskCard task={mockTask} />);

      // Should have drag handle (GripVertical icon) - look for the svg element specifically
      const dragHandle = document.querySelector('.lucide-grip-vertical');
      expect(dragHandle).toBeInTheDocument();
    });

    it('should apply dragging styles when being dragged', () => {
      const mockTask = createMockTask();

      // Mock the useSortable hook to simulate dragging
      vi.mock('@dnd-kit/sortable', () => ({
        useSortable: () => ({
          attributes: {},
          listeners: {},
          setNodeRef: vi.fn(),
          transform: { x: 10, y: 20, scaleX: 1, scaleY: 1 },
          transition: 'transform 200ms ease',
          isDragging: true,
        }),
      }));

      render(<TaskCard task={mockTask} />);

      const taskCard = screen.getByText(mockTask.title).closest('.card-elegant');
      expect(taskCard).toHaveClass('opacity-50', 'rotate-3', 'shadow-hover');
    });
  });

  describe('Date Formatting', () => {
    it('should format due date correctly', () => {
      const mockTask = createMockTask({
        dueDate: new Date('2024-03-15'),
      });

      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('3/15/2024')).toBeInTheDocument();
    });

    it('should format created date correctly', () => {
      const mockTask = createMockTask({
        createdAt: new Date('2024-01-10'),
      });

      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('1/10/2024')).toBeInTheDocument();
    });
  });

  describe('Avatar and Initials', () => {
    it('should generate correct initials for single name', () => {
      const mockTask = createMockTask({ assignee: 'John' });

      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('J')).toBeInTheDocument();
    });

    it('should generate correct initials for full name', () => {
      const mockTask = createMockTask({ assignee: 'John Doe Smith' });

      render(<TaskCard task={mockTask} />);

      expect(screen.getByText('JDS')).toBeInTheDocument();
    });

    it('should handle empty assignee name', () => {
      const mockTask = createMockTask({ assignee: '' });

      render(<TaskCard task={mockTask} />);

      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const mockTask = createMockTask();
      render(<TaskCard task={mockTask} onTaskUpdate={mockHandlers.onTaskUpdate} />);

      const editButton = screen.getByLabelText(/edit task/i);
      expect(editButton).toBeInTheDocument();

      // The drag handle should be accessible
      expect(screen.getByText(mockTask.title)).toBeInTheDocument();
    });

    it('should be keyboard navigable', async () => {
      const mockTask = createMockTask();
      render(<TaskCard task={mockTask} onTaskUpdate={mockHandlers.onTaskUpdate} />);

      const editButton = screen.getByLabelText(/edit task/i);

      // Should be able to focus the edit button
      editButton.focus();
      expect(editButton).toHaveFocus();

      // Should be able to activate with Enter key
      await userEvent.keyboard('{Enter}');

      // Should enter edit mode
      expect(screen.getByDisplayValue(mockTask.title)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long task titles', () => {
      const longTitle = 'A'.repeat(200);
      const mockTask = createMockTask({ title: longTitle });

      render(<TaskCard task={mockTask} />);

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'B'.repeat(500);
      const mockTask = createMockTask({ description: longDescription });

      render(<TaskCard task={mockTask} />);

      // Should render but might be truncated (line-clamp-2 class)
      expect(screen.getByText(longDescription)).toBeInTheDocument();
    });

    it('should handle undefined props gracefully', () => {
      const mockTask = createMockTask();

      expect(() => {
        render(<TaskCard task={mockTask} />);
      }).not.toThrow();
    });
  });
});
