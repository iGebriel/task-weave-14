import { useState } from "react";
import { ArrowLeft, Plus, Download, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TaskColumn } from "./TaskColumn";
import { CreateTaskModal } from "./CreateTaskModal";
import { ProjectSelector } from "./ProjectSelector";
import { ExportModal } from "./ExportModal";
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove } from "@dnd-kit/sortable";
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";

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

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "progress" | "done";
  priority: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: Date;
  createdAt: Date;
}

interface ProjectBoardProps {
  project: Project;
  projects?: Project[];
  onBack: () => void;
  onProjectChange?: (project: Project) => void;
}

// Sample tasks data
const sampleTasks: Task[] = [
  {
    id: "1",
    title: "Design new homepage layout",
    description: "Create wireframes and mockups for the new homepage design",
    status: "todo",
    priority: "high",
    assignee: "Alice Johnson",
    dueDate: new Date("2024-03-15"),
    createdAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    title: "Implement user authentication",
    description: "Set up login/logout functionality with secure token management",
    status: "progress",
    priority: "high",
    assignee: "Bob Smith",
    createdAt: new Date("2024-01-18"),
  },
  {
    id: "3",
    title: "Write API documentation",
    description: "Document all endpoints with examples and response schemas",
    status: "progress",
    priority: "medium",
    assignee: "Carol Davis",
    dueDate: new Date("2024-03-20"),
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "4",
    title: "Setup CI/CD pipeline",
    description: "Configure automated testing and deployment workflows",
    status: "done",
    priority: "medium",
    assignee: "David Wilson",
    createdAt: new Date("2024-01-10"),
  },
  {
    id: "5",
    title: "Design mobile responsive layout",
    description: "Ensure all pages work perfectly on mobile devices",
    status: "todo",
    priority: "medium",
    assignee: "Eva Martinez",
    dueDate: new Date("2024-03-25"),
    createdAt: new Date("2024-01-22"),
  },
];

export const ProjectBoard = ({ project, projects = [], onBack, onProjectChange }: ProjectBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>(sampleTasks);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [createTaskStatus, setCreateTaskStatus] = useState<"todo" | "progress" | "done">("todo");

  const columns = [
    { id: "todo", title: "To Do", status: "todo" as const },
    { id: "progress", title: "In Progress", status: "progress" as const },
    { id: "done", title: "Done", status: "done" as const },
  ];

  const getTasksByStatus = (status: string) => {
    return tasks.filter(task => task.status === status);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const taskId = active.id as string;
    const newStatus = over.id as "todo" | "progress" | "done";

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, status: newStatus } : task
      )
    );

    setActiveTask(null);
  };

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      )
    );
  };

  const handleAddTask = (status: "todo" | "progress" | "done") => {
    setCreateTaskStatus(status);
    setShowCreateTask(true);
  };

  // Mock data for export modal - in real app this would come from API
  const allTasksData = {
    [project.id]: tasks,
    // Add other projects' tasks here
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={onBack}
              className="btn-ghost"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
            
            {/* Project Selector */}
            {projects.length > 0 && onProjectChange && (
              <ProjectSelector
                projects={projects}
                currentProject={project}
                onProjectChange={onProjectChange}
              />
            )}
            
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {project.name}
              </h1>
              <p className="text-muted-foreground mt-1">{project.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              className="border-border hover:bg-secondary/50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            <Button
              onClick={() => setShowCreateTask(true)}
              className="btn-hero"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
          </div>
        </div>

        {/* Project Info */}
        <div className="card-elegant mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {project.collaborators} collaborators
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  Created {project.createdAt.toLocaleDateString()}
                </span>
              </div>
              {project.isPublic && (
                <Badge variant="outline" className="text-success border-success/20">
                  Public Project
                </Badge>
              )}
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress</p>
              <p className="text-2xl font-bold text-foreground">
                {Math.round((project.completedTasks / project.tasksCount) * 100)}%
              </p>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <DndContext 
          onDragStart={handleDragStart} 
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {columns.map((column) => (
              <TaskColumn
                key={column.id}
                column={column}
                tasks={getTasksByStatus(column.status)}
                onAddTask={handleAddTask}
                onTaskUpdate={handleTaskUpdate}
              />
            ))}
          </div>
          
          <DragOverlay>
            {activeTask ? (
              <div className="card-elegant opacity-90 transform rotate-3">
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground">{activeTask.title}</h4>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {activeTask.description}
                  </p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <CreateTaskModal
          open={showCreateTask}
          onClose={() => setShowCreateTask(false)}
          onCreateTask={(newTask) => {
            setTasks(prev => [...prev, { 
              ...newTask, 
              id: Date.now().toString(),
              status: createTaskStatus 
            }]);
            setShowCreateTask(false);
          }}
          defaultStatus={createTaskStatus}
        />

        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          projects={projects}
          allTasks={allTasksData}
          currentProjectId={project.id}
        />
      </div>
    </div>
  );
};