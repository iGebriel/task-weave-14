import { useState, useCallback, useMemo } from 'react';
import { ProjectDashboardView } from '@/components/views/ProjectDashboardView';
import { useProjects } from '@/hooks/useProjects';
import { ProjectTransformer } from '@/services/transformers/ProjectTransformer';
import { StatusStyleManager } from '@/config/statusStyles';
import { Project } from '@/types';

/**
 * Container component that handles all logic and state management
 * for the Project Dashboard. Follows the container/presentational pattern
 * by separating business logic from presentation.
 */
export const ProjectDashboardContainer = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Fetch projects from API
  const { data: apiData, isLoading, error, isError } = useProjects({ per_page: 50 });
  
  // Sample data for fallback
  const sampleProjects = useMemo(() => [
    {
      id: "1",
      name: "Website Redesign",
      description: "Complete overhaul of company website with modern design",
      status: "active" as const,
      isPublic: false,
      owner: "John Doe",
      collaborators: 5,
      tasksCount: 23,
      completedTasks: 15,
      createdAt: new Date("2024-01-15"),
    },
    {
      id: "2",
      name: "Mobile App Development",
      description: "Cross-platform mobile application for customer engagement",
      status: "active" as const,
      isPublic: true,
      owner: "Jane Smith",
      collaborators: 8,
      tasksCount: 45,
      completedTasks: 12,
      createdAt: new Date("2024-02-01"),
    },
    {
      id: "3",
      name: "Database Migration",
      description: "Migrate legacy database to modern cloud infrastructure",
      status: "completed" as const,
      isPublic: false,
      owner: "Mike Johnson",
      collaborators: 3,
      tasksCount: 18,
      completedTasks: 18,
      createdAt: new Date("2023-12-10"),
    },
  ], []);
  
  // Transform API data to UI format, fallback to sample data for demo
  const projects = useMemo(() => {
    return apiData && apiData.data ? ProjectTransformer.apiArrayToUi(apiData.data) : sampleProjects;
  }, [apiData, sampleProjects]);
  
  // Memoize status color function
  const getStatusColor = useCallback((status: string) => {
    return StatusStyleManager.getProjectStatusClass(status as any);
  }, []);
  
  // Memoize progress calculation
  const getProgress = useCallback((completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, []);
  
  // Event handlers
  const handleProjectSelect = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);
  
  const handleBackToDashboard = useCallback(() => {
    setSelectedProject(null);
  }, []);
  
  const handleCreateProject = useCallback(() => {
    setShowCreateModal(true);
  }, []);
  
  const handleCloseCreateModal = useCallback(() => {
    setShowCreateModal(false);
  }, []);
  
  const handleProjectChange = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);
  
  // Calculate statistics
  const statistics = useMemo(() => {
    const totalProjects = projects.length;
    const activeProjects = projects.filter(p => p.status === "active").length;
    const completedProjects = projects.filter(p => p.status === "completed").length;
    
    return {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
    };
  }, [projects]);
  
  // Determine data source for display
  const dataSource = useMemo(() => {
    if (apiData && apiData.data) {
      return { type: 'api' as const, hasError: false };
    }
    if (isError) {
      return { type: 'sample' as const, hasError: true, error };
    }
    return { type: 'sample' as const, hasError: false };
  }, [apiData, isError, error]);

  return (
    <ProjectDashboardView
      // Data
      projects={projects}
      selectedProject={selectedProject}
      statistics={statistics}
      dataSource={dataSource}
      
      // Loading states
      isLoading={isLoading}
      
      // UI state
      showCreateModal={showCreateModal}
      
      // Event handlers
      onProjectSelect={handleProjectSelect}
      onBackToDashboard={handleBackToDashboard}
      onCreateProject={handleCreateProject}
      onCloseCreateModal={handleCloseCreateModal}
      onProjectChange={handleProjectChange}
      
      // Utility functions
      getStatusColor={getStatusColor}
      getProgress={getProgress}
    />
  );
};