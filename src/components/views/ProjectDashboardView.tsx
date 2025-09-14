import React from 'react';
import { Plus, Settings, Users, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatsCard } from '@/components/ui/StatsCard';
import { ProjectBoard } from '@/components/ProjectBoard';
import { ProjectCard } from '@/components/ProjectCard';
import { CreateProjectModal } from '@/components/CreateProjectModal';
import { Project } from '@/types';

interface DataSource {
  type: 'api' | 'sample';
  hasError: boolean;
  error?: any;
}

interface Statistics {
  total: number;
  active: number;
  completed: number;
}

interface ProjectDashboardViewProps {
  // Data
  projects: Project[];
  selectedProject: Project | null;
  statistics: Statistics;
  dataSource: DataSource;
  
  // Loading states
  isLoading: boolean;
  
  // UI state
  showCreateModal: boolean;
  
  // Event handlers
  onProjectSelect: (project: Project) => void;
  onBackToDashboard: () => void;
  onCreateProject: () => void;
  onCloseCreateModal: () => void;
  onProjectChange: (project: Project) => void;
  
  // Utility functions
  getStatusColor: (status: string) => string;
  getProgress: (completed: number, total: number) => number;
}

/**
 * Presentational component that focuses purely on rendering the UI
 * for the Project Dashboard. Contains no business logic or state management.
 */
export const ProjectDashboardView: React.FC<ProjectDashboardViewProps> = ({
  projects,
  selectedProject,
  statistics,
  dataSource,
  isLoading,
  showCreateModal,
  onProjectSelect,
  onBackToDashboard,
  onCreateProject,
  onCloseCreateModal,
  onProjectChange,
  getStatusColor,
  getProgress,
}) => {
  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading projects...</p>
        </div>
      </div>
    );
  }

  // Error state with no fallback data
  if (dataSource.hasError && projects.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-muted-foreground mb-4">Failed to load projects from API</p>
          <p className="text-sm text-muted-foreground">
            {dataSource.error?.message || 'Unknown error occurred'}
          </p>
        </div>
      </div>
    );
  }

  // Project Board view
  if (selectedProject) {
    return (
      <ProjectBoard 
        project={selectedProject} 
        projects={projects}
        onBack={onBackToDashboard}
        onProjectChange={onProjectChange}
      />
    );
  }

  // Main Dashboard view
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Project Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-muted-foreground">
                Manage your projects and collaborate with your team
              </p>
              <Badge 
                variant="default" 
                className={dataSource.type === 'api' ? "bg-green-500" : "bg-blue-500"}
              >
                {dataSource.type === 'api' ? "Live Data" : "Demo Data"}
              </Badge>
              {dataSource.hasError && (
                <Badge variant="destructive" className="ml-2">
                  API Error
                </Badge>
              )}
            </div>
          </div>
          <Button
            onClick={onCreateProject}
            className="btn-hero"
            data-testid="create-project-button"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </header>

        {/* Stats Cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" aria-label="Project Statistics">
          <StatsCard
            label="Total Projects"
            value={statistics.total}
            icon={Settings}
            variant="primary"
            testId="total-projects-stat"
          />
          
          <StatsCard
            label="Active Projects"
            value={statistics.active}
            icon={Users}
            variant="warning"
            testId="active-projects-stat"
          />
          
          <StatsCard
            label="Completed Projects"
            value={statistics.completed}
            icon={Download}
            variant="success"
            testId="completed-projects-stat"
          />
        </section>

        {/* Projects Grid */}
        <section aria-label="Projects">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => {
              const progress = getProgress(project.completedTasks, project.tasksCount);
              
              return (
                <ProjectCard
                  key={project.id}
                  project={project}
                  progress={progress}
                  onSelect={onProjectSelect}
                  getStatusColor={getStatusColor}
                />
              );
            })}
          </div>

          {projects.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-4">
                <Settings className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No projects found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first project
              </p>
              <Button onClick={onCreateProject} className="btn-hero">
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </div>
          )}
        </section>

        {/* Create Project Modal */}
        <CreateProjectModal 
          open={showCreateModal} 
          onClose={onCloseCreateModal} 
        />
      </div>
    </div>
  );
};