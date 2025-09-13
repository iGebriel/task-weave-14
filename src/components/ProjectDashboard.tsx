import { useState } from "react";
import { Plus, Users, Download, Trash2, Settings, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProjectBoard } from "./ProjectBoard";
import { CreateProjectModal } from "./CreateProjectModal";
import { useProjects } from "@/hooks/useProjects";
import { Project as ApiProject } from "@/types/api";

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

// Transform API project to UI project format
const transformApiProject = (apiProject: ApiProject): Project => ({
  id: apiProject.id.toString(),
  name: apiProject.name,
  description: apiProject.description,
  status: apiProject.status === 'draft' ? 'active' : apiProject.status as "active" | "completed" | "archived",
  isPublic: false, // API doesn't have this field, defaulting to false
  owner: apiProject.user.name,
  collaborators: Math.floor(Math.random() * 8) + 1, // API doesn't have this, using random for demo
  tasksCount: Math.floor(Math.random() * 50) + 5, // API doesn't have this, using random for demo
  completedTasks: Math.floor(Math.random() * 30), // API doesn't have this, using random for demo
  createdAt: new Date(apiProject.created_at),
  deletionRequested: apiProject.deletion_requested,
});

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
  
  // Fetch projects from API
  const { data: apiData, isLoading, error, isError } = useProjects({ per_page: 50 });
  
  // Use sample data for now (API integration will be handled later)
  const projects = sampleProjects;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-warning/10 text-warning border-warning/20";
      case "draft": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "archived": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getProgress = (completed: number, total: number) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

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
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Project Dashboard
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-muted-foreground">
                Manage your projects and collaborate with your team
              </p>
              <Badge variant="default" className="bg-blue-500">
                Demo Data
              </Badge>
            </div>
          </div>
          <Button 
            onClick={() => setShowCreateModal(true)}
            className="btn-hero"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Project
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Projects</p>
                <p className="text-3xl font-bold text-foreground">{projects.length}</p>
              </div>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <Settings className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>

          <div className="card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Projects</p>
                <p className="text-3xl font-bold text-foreground">
                  {projects.filter(p => p.status === "active").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning/10 rounded-lg flex items-center justify-center">
                <Users className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed Projects</p>
                <p className="text-3xl font-bold text-foreground">
                  {projects.filter(p => p.status === "completed").length}
                </p>
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-lg flex items-center justify-center">
                <Download className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              className="card-project animate-fade-in"
              onClick={() => setSelectedProject(project)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold text-foreground mb-2">
                    {project.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {project.description}
                  </p>
                </div>
                <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {getProgress(project.completedTasks, project.tasksCount)}%
                  </span>
                </div>
                
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${getProgress(project.completedTasks, project.tasksCount)}%`,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-1" />
                    {project.collaborators} collaborators
                  </div>
                  <div className="flex items-center space-x-2">
                    {project.isPublic && (
                      <Badge variant="outline" className="text-xs">
                        Public
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        console.log("Delete project:", project.id);
                      }}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <CreateProjectModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)} 
        />
      </div>
    </div>
  );
};