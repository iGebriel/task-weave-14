import { useState, useMemo, useCallback, useRef } from "react";
import { Plus, Users, Download, Trash2, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatsCard } from "@/components/ui/StatsCard";
import { ProjectBoard } from "./ProjectBoard";
import { ProjectCard } from "./ProjectCard";
import { CreateProjectModal } from "./CreateProjectModal";
import { useProjects } from "@/hooks/useProjects";
import { ProjectTransformer } from "@/services/transformers/ProjectTransformer";
import { StatusStyleManager } from "@/config/statusStyles";
import { SecurityUtils } from "@/utils/security";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "archived" | "draft";
  isPublic: boolean;
  owner: string;
  collaborators: number;
  tasksCount: number;
  completedTasks: number;
  createdAt: Date;
  deletionRequested?: boolean;
}

// Transform API data to UI format using the ProjectTransformer service
  // This follows SRP by separating transformation logic from UI logic

// Sample data - replace with API integration
const sampleProjects: Project[] = [
  {
    id: "1",
    name: "Website Redesign",
    description: "Complete overhaul of company website with modern design",
    status: "active",
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
    status: "active",
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
    status: "completed",
    isPublic: false,
    owner: "Mike Johnson",
    collaborators: 3,
    tasksCount: 18,
    completedTasks: 18,
    createdAt: new Date("2023-12-10"),
  },
];

export const ProjectDashboard = () => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);
  
  // Fetch projects from API
  const { data: apiData, isLoading, error, isError } = useProjects({ per_page: 50 });
  
  // Transform API data to UI format, fallback to sample data for demo
  const projects = apiData && apiData.data ? ProjectTransformer.apiArrayToUi(apiData.data) : sampleProjects;

  // Memoize project statistics to prevent recalculation on every render
  const projectStats = useMemo(() => {
    return {
      total: projects.length,
      active: projects.filter(p => p.status === "active").length,
      completed: projects.filter(p => p.status === "completed").length,
    };
  }, [projects]);

  // Use configurable status system that follows OCP
  const getStatusColor = useCallback((status: string) => {
    return StatusStyleManager.getProjectStatusClass(status as "active" | "completed" | "archived" | "draft");
  }, []);

  // Memoize progress calculation to prevent unnecessary recalculations
  const getProgress = useCallback((completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, []);

  // Keyboard shortcuts for project dashboard
  useKeyboardNavigation({
    containerRef: dashboardRef,
    shortcuts: [
      {
        key: 'n',
        ctrlKey: true,
        callback: () => setShowCreateModal(true),
        description: 'Create new project'
      },
      {
        key: 'Escape',
        callback: () => {
          if (showCreateModal) {
            setShowCreateModal(false);
          }
        },
        description: 'Close modal or go back'
      },
      {
        key: '/',
        callback: () => {
          // Focus search if available, or first project
          const firstProject = dashboardRef.current?.querySelector('[data-testid="project-card"]') as HTMLElement;
          firstProject?.focus();
        },
        description: 'Focus first project'
      }
    ]
  });

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

  // Show API error if there's an error and no fallback data
  if (isError && !sampleProjects.length) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <p className="text-muted-foreground mb-4">Failed to load projects from API</p>
          <p className="text-sm text-muted-foreground">{error?.message || 'Unknown error occurred'}</p>
        </div>
      </div>
    );
  }

  if (selectedProject) {
    return (
      <ProjectBoard 
        project={selectedProject} 
        projects={projects}
        onBack={() => setSelectedProject(null)}
        onProjectChange={setSelectedProject}
      />
    );
  }

  return (
    <div className="min-h-screen p-6" ref={dashboardRef}>
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
              <Badge variant="default" className={apiData && apiData.data ? "bg-green-500" : "bg-blue-500"}>
                {apiData && apiData.data ? "Live Data" : "Demo Data"}
              </Badge>
              {isError && (
                <Badge variant="destructive" className="ml-2">
                  API Error
                </Badge>
              )}
            </div>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="btn-hero"
            data-testid="create-project-button"
            aria-label="Create a new project"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </header>

        {/* Stats Cards - Using reusable StatsCard component to eliminate DRY violation */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8" aria-label="Project statistics">
          <StatsCard
            label="Total Projects"
            value={projectStats.total}
            icon={Settings}
            variant="primary"
            testId="total-projects-stat"
          />
          
          <StatsCard
            label="Active Projects"
            value={projectStats.active}
            icon={Users}
            variant="warning"
            testId="active-projects-stat"
          />
          
          <StatsCard
            label="Completed Projects"
            value={projectStats.completed}
            icon={Download}
            variant="success"
            testId="completed-projects-stat"
          />
        </section>

        {/* Projects Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Projects list">
          {projects.map((project) => {
            // Memoize progress calculation for each project
            const progress = getProgress(project.completedTasks, project.tasksCount);
            
            return (
            <ProjectCard
              key={project.id}
              project={project}
              progress={progress}
              onSelect={setSelectedProject}
              getStatusColor={getStatusColor}
            />
            );
          })}
        </section>

        <CreateProjectModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      </div>
    </div>
  );
};