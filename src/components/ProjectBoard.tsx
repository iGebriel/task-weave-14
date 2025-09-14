import { TaskBoard } from "./TaskBoard";
import { Project } from "@/types";

interface ProjectBoardProps {
  project: Project;
  projects?: Project[];
  onBack: () => void;
  onProjectChange?: (project: Project) => void;
}

export const ProjectBoard = ({ project, onBack }: ProjectBoardProps) => {
  // Use the new TaskBoard component for better task management
  return <TaskBoard project={project} onBack={onBack} />;
};
