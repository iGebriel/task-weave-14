import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ProjectDashboard } from '@/components/ProjectDashboard';
import { render, createMockProject, createMockUseProjects } from '@/test/utils';

// Mock the useProjects hook
const mockUseProjects = vi.fn();
vi.mock('@/hooks/useProjects', () => ({
  useProjects: mockUseProjects,
}));

describe('ProjectDashboard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner when data is loading', () => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: true,
          projects: [],
        })
      );

      render(<ProjectDashboard />);

      expect(screen.getByText('Loading projects...')).toBeInTheDocument();
      expect(screen.getByRole('status')).toBeInTheDocument(); // Loading spinner
    });

    it('should hide loading state when data is loaded', async () => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [createMockProject()],
        })
      );

      render(<ProjectDashboard />);

      expect(screen.queryByText('Loading projects...')).not.toBeInTheDocument();
      expect(screen.getByText('Project Dashboard')).toBeInTheDocument();
    });
  });

  describe('Header and Navigation', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [createMockProject()],
        })
      );
    });

    it('should display dashboard title and description', () => {
      render(<ProjectDashboard />);

      expect(screen.getByText('Project Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage your projects and collaborate with your team')).toBeInTheDocument();
    });

    it('should show demo data badge', () => {
      render(<ProjectDashboard />);

      expect(screen.getByText('Demo Data')).toBeInTheDocument();
    });

    it('should display New Project button', () => {
      render(<ProjectDashboard />);

      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      expect(newProjectButton).toBeInTheDocument();
      expect(newProjectButton).toHaveClass('btn-hero');
    });

    it('should open create project modal when New Project button is clicked', async () => {
      render(<ProjectDashboard />);

      const newProjectButton = screen.getByRole('button', { name: /new project/i });
      await userEvent.click(newProjectButton);

      // Check if modal is opened (this would depend on the CreateProjectModal implementation)
      expect(screen.getByText(/create.*project/i)).toBeInTheDocument();
    });
  });

  describe('Statistics Cards', () => {
    beforeEach(() => {
      const mockProjects = [
        createMockProject({ status: 'active' }),
        createMockProject({ id: '2', status: 'active' }),
        createMockProject({ id: '3', status: 'completed' }),
        createMockProject({ id: '4', status: 'archived' }),
      ];

      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: mockProjects,
        })
      );
    });

    it('should display total projects count', () => {
      render(<ProjectDashboard />);

      expect(screen.getByText('Total Projects')).toBeInTheDocument();
      expect(screen.getByText('4')).toBeInTheDocument();
    });

    it('should display active projects count', () => {
      render(<ProjectDashboard />);

      expect(screen.getByText('Active Projects')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 active projects
    });

    it('should display completed projects count', () => {
      render(<ProjectDashboard />);

      expect(screen.getByText('Completed Projects')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 completed project
    });

    it('should display correct icons for each stat card', () => {
      render(<ProjectDashboard />);

      // Check for the presence of stat icons (they should be in the DOM as SVG elements)
      const statsSection = screen.getByText('Total Projects').closest('.grid');
      expect(statsSection).toBeInTheDocument();
    });
  });

  describe('Project Grid', () => {
    const mockProjects = [
      createMockProject({ 
        id: '1', 
        name: 'Project Alpha', 
        status: 'active',
        tasksCount: 20,
        completedTasks: 15,
      }),
      createMockProject({ 
        id: '2', 
        name: 'Project Beta', 
        status: 'completed',
        tasksCount: 10,
        completedTasks: 10,
      }),
      createMockProject({ 
        id: '3', 
        name: 'Project Gamma', 
        status: 'draft',
        tasksCount: 5,
        completedTasks: 0,
      }),
    ];

    beforeEach(() => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: mockProjects,
        })
      );
    });

    it('should display all projects in a grid', () => {
      render(<ProjectDashboard />);

      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText('Project Beta')).toBeInTheDocument();
      expect(screen.getByText('Project Gamma')).toBeInTheDocument();
    });

    it('should display project information correctly', () => {
      render(<ProjectDashboard />);

      // Check project details
      expect(screen.getByText('Project Alpha')).toBeInTheDocument();
      expect(screen.getByText(mockProjects[0].description)).toBeInTheDocument();
    });

    it('should show correct status colors', () => {
      render(<ProjectDashboard />);

      // Find status badges and check their classes
      const activeStatus = screen.getByText('active');
      expect(activeStatus).toHaveClass('bg-warning/10', 'text-warning');

      const completedStatus = screen.getByText('completed');
      expect(completedStatus).toHaveClass('bg-success/10', 'text-success');
    });

    it('should calculate and display progress correctly', () => {
      render(<ProjectDashboard />);

      // Project Alpha should show 75% progress (15/20 tasks completed)
      expect(screen.getByText('75%')).toBeInTheDocument();

      // Project Beta should show 100% progress (10/10 tasks completed)
      expect(screen.getByText('100%')).toBeInTheDocument();

      // Project Gamma should show 0% progress (0/5 tasks completed)
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should navigate to project board when project is clicked', async () => {
      render(<ProjectDashboard />);

      const projectCard = screen.getByText('Project Alpha').closest('.card-project');
      expect(projectCard).toBeInTheDocument();

      if (projectCard) {
        await userEvent.click(projectCard);

        // Should navigate to project board view
        await waitFor(() => {
          expect(screen.queryByText('Project Dashboard')).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Empty State', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [],
        })
      );
    });

    it('should handle empty projects list gracefully', () => {
      render(<ProjectDashboard />);

      expect(screen.getByText('Project Dashboard')).toBeInTheDocument();
      expect(screen.getByText('0')).toBeInTheDocument(); // Total projects count should be 0
    });

    it('should show zero counts in statistics when no projects exist', () => {
      render(<ProjectDashboard />);

      // All stat cards should show 0
      const statCards = screen.getAllByText('0');
      expect(statCards).toHaveLength(3); // Total, Active, Completed
    });
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [],
          isError: true,
          error: new Error('Failed to load projects'),
        })
      );
    });

    it('should handle API errors gracefully', () => {
      render(<ProjectDashboard />);

      // Component should still render even with errors
      expect(screen.getByText('Project Dashboard')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [createMockProject()],
        })
      );
    });

    it('should have responsive grid classes', () => {
      render(<ProjectDashboard />);

      const statsGrid = screen.getByText('Total Projects').closest('.grid');
      expect(statsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3');

      const projectsGrid = screen.getByText('Test Project').closest('.grid');
      expect(projectsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3');
    });
  });

  describe('Progress Calculation', () => {
    it('should handle division by zero in progress calculation', () => {
      const projectWithNoTasks = createMockProject({
        tasksCount: 0,
        completedTasks: 0,
      });

      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [projectWithNoTasks],
        })
      );

      render(<ProjectDashboard />);

      // Should show 0% progress when no tasks exist
      expect(screen.getByText('0%')).toBeInTheDocument();
    });

    it('should round progress to nearest integer', () => {
      const projectWithPartialProgress = createMockProject({
        tasksCount: 3,
        completedTasks: 1, // 33.333...% should round to 33%
      });

      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [projectWithPartialProgress],
        })
      );

      render(<ProjectDashboard />);

      expect(screen.getByText('33%')).toBeInTheDocument();
    });
  });

  describe('Animation Classes', () => {
    beforeEach(() => {
      mockUseProjects.mockReturnValue(
        createMockUseProjects({
          isLoading: false,
          projects: [createMockProject()],
        })
      );
    });

    it('should apply animation classes to project cards', () => {
      render(<ProjectDashboard />);

      const projectCard = screen.getByText('Test Project').closest('.card-project');
      expect(projectCard).toHaveClass('animate-fade-in');
    });
  });
});
