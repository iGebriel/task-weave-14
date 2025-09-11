import { ChevronDown, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "archived";
  isPublic: boolean;
  owner: string;
  collaborators: number;
  tasksCount: number;
  completedTasks: number;
  createdAt: Date;
}

interface ProjectSelectorProps {
  projects: Project[];
  currentProject: Project;
  onProjectChange: (project: Project) => void;
}

export const ProjectSelector = ({ projects, currentProject, onProjectChange }: ProjectSelectorProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-warning/10 text-warning border-warning/20";
      case "completed": return "bg-success/10 text-success border-success/20";
      case "archived": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/80 min-w-[200px] justify-between"
        >
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-4 h-4" />
            <span className="truncate">{currentProject.name}</span>
          </div>
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-80">
        {projects.map((project) => (
          <DropdownMenuItem
            key={project.id}
            className={`p-3 cursor-pointer ${
              project.id === currentProject.id ? "bg-primary/5 border-l-2 border-primary" : ""
            }`}
            onClick={() => onProjectChange(project)}
          >
            <div className="flex-1 space-y-1">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-foreground">{project.name}</h4>
                <Badge className={`text-xs ${getStatusColor(project.status)}`}>
                  {project.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-1">
                {project.description}
              </p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{project.tasksCount} tasks</span>
                <span>{Math.round((project.completedTasks / project.tasksCount) * 100)}% complete</span>
              </div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};