import { useState, useRef } from "react";
import { Plus, Download, Filter, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TaskCard } from "./TaskCard";
import { CreateTaskModal } from "./CreateTaskModal";
import { ExportModal } from "./ExportModal";
import { useTasks, useExportProjectTasks } from "@/hooks/useTasks";
import { Task as ApiTask, TaskStatus, TaskPriority } from "@/types/api";
import { Project } from "@/types";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { SecurityUtils } from "@/utils/security";

interface TaskBoardProps {
  project: Project;
  onBack: () => void;
}

// Transform API task to UI task format
const transformApiTask = (apiTask: ApiTask) => ({
  id: apiTask.id.toString(),
  title: apiTask.title,
  description: apiTask.description,
  status: mapApiTaskStatus(apiTask.status),
  priority: apiTask.priority as 'low' | 'medium' | 'high',
  assignee: apiTask.user.name,
  assigneeId: apiTask.user.id.toString(),
  dueDate: apiTask.due_date ? new Date(apiTask.due_date) : undefined,
  createdAt: new Date(apiTask.created_at),
  updatedAt: new Date(apiTask.updated_at),
  projectId: apiTask.project.id.toString(),
  tags: [], // Not in API yet
  estimatedHours: 0, // Not in API yet
  actualHours: 0, // Not in API yet
});

// Map API task status to UI status
const mapApiTaskStatus = (apiStatus: TaskStatus): 'todo' | 'progress' | 'done' => {
  switch (apiStatus) {
    case 'todo':
    case 'draft':
      return 'todo';
    case 'in_progress':
      return 'progress';
    case 'completed':
      return 'done';
    case 'cancelled':
      return 'todo'; // Map cancelled back to todo for now
    default:
      return 'todo';
  }
};

// Task columns for the kanban board
const TASK_COLUMNS = [
  { id: 'todo', title: 'To Do', status: 'todo' as const, color: 'bg-blue-500' },
  { id: 'progress', title: 'In Progress', status: 'progress' as const, color: 'bg-yellow-500' },
  { id: 'done', title: 'Done', status: 'done' as const, color: 'bg-green-500' },
];

export const TaskBoard = ({ project, onBack }: TaskBoardProps) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const taskBoardRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Fetch tasks for this project
  const { 
    data: tasksResponse, 
    isLoading: isLoadingTasks, 
    error: tasksError 
  } = useTasks({ 
    project_id: parseInt(project.id),
    per_page: 100
  });

  const exportTasks = useExportProjectTasks();

  // Transform API tasks to UI format
  const allTasks = tasksResponse?.data ? tasksResponse.data.map(transformApiTask) : [];

  // Filter tasks based on search and filters
  const filteredTasks = allTasks.filter(task => {
    const matchesSearch = searchTerm === "" || 
      task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Group tasks by column
  const tasksByColumn = TASK_COLUMNS.reduce((acc, column) => {
    acc[column.status] = filteredTasks.filter(task => task.status === column.status);
    return acc;
  }, {} as Record<string, typeof allTasks>);

  const handleExportTasks = (format: 'json' | 'csv', filters?: Record<string, unknown>) => {
    exportTasks.mutate({
      projectId: parseInt(project.id),
      params: { format, ...filters }
    });
    setShowExportModal(false);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("all");
    setPriorityFilter("all");
  };

  const hasActiveFilters = searchTerm || statusFilter !== "all" || priorityFilter !== "all";

  // Keyboard shortcuts for task board
  useKeyboardNavigation({
    containerRef: taskBoardRef,
    shortcuts: [
      {
        key: 'n',
        ctrlKey: true,
        callback: () => setShowCreateModal(true),
        description: 'Create new task'
      },
      {
        key: 'f',
        ctrlKey: true,
        callback: () => {
          searchInputRef.current?.focus();
        },
        description: 'Focus search'
      },
      {
        key: 'e',
        ctrlKey: true,
        callback: () => {
          if (allTasks.length > 0) {
            setShowExportModal(true);
          }
        },
        description: 'Export tasks'
      },
      {
        key: 'Escape',
        callback: () => {
          if (showCreateModal) {
            setShowCreateModal(false);
          } else if (showExportModal) {
            setShowExportModal(false);
          } else if (hasActiveFilters) {
            clearFilters();
          } else {
            onBack();
          }
        },
        description: 'Close modal, clear filters, or go back'
      },
      {
        key: 'b',
        altKey: true,
        callback: () => onBack(),
        description: 'Back to projects'
      }
    ]
  });

  if (isLoadingTasks) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading tasks...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6" ref={taskBoardRef}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={onBack} aria-label="Back to projects dashboard">
              ← Back to Projects
            </Button>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
                {project.name}
              </h1>
              <p className="text-muted-foreground mt-2">{SecurityUtils.sanitizeText(project.description)}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={() => setShowExportModal(true)}
              disabled={allTasks.length === 0}
            >
              <Download className="w-4 h-4 mr-2" />
              Export Tasks
            </Button>
            <Button 
              onClick={() => setShowCreateModal(true)}
              className="btn-hero"
              data-testid="create-task-button"
              aria-label="Create a new task"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Task
            </Button>
          </div>
        </header>

        {/* Filters */}
        <section className="flex items-center justify-between mb-6 p-4 bg-card border rounded-lg" aria-label="Task filters and search">
          <div className="flex items-center space-x-4 flex-1">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
                ref={searchInputRef}
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Search tasks by title or description"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="todo">To Do</SelectItem>
                <SelectItem value="progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          )}
        </section>

        {/* Task Stats */}
        <section className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8" aria-label="Task statistics">
          <div className="card-elegant">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">{allTasks.length}</p>
              </div>
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <div className="w-3 h-3 bg-primary rounded-full"></div>
              </div>
            </div>
          </div>

          {TASK_COLUMNS.map((column) => (
            <div key={column.id} className="card-elegant">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{column.title}</p>
                  <p className="text-2xl font-bold text-foreground">
                    {tasksByColumn[column.status]?.length || 0}
                  </p>
                </div>
                <div className={`w-8 h-8 ${column.color}/10 rounded-lg flex items-center justify-center`}>
                  <div className={`w-3 h-3 ${column.color} rounded-full`}></div>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Kanban Board */}
        <main className="grid grid-cols-1 lg:grid-cols-3 gap-6" role="main" aria-label="Kanban task board">
          {TASK_COLUMNS.map((column) => {
            const columnTasks = tasksByColumn[column.status] || [];
            return (
              <div key={column.id} className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 ${column.color} rounded-full`}></div>
                    <h3 className="font-semibold text-lg">{column.title}</h3>
                    <Badge variant="secondary">{columnTasks.length}</Badge>
                  </div>
                </div>

                <div 
                  className="flex-1 min-h-96 bg-muted/30 rounded-lg p-4 space-y-3"
                  data-testid={`column-${column.status}`}
                >
                  {columnTasks.length === 0 ? (
                    <div className="flex items-center justify-center h-32 text-muted-foreground">
                      <p className="text-sm">No tasks</p>
                    </div>
                  ) : (
                    columnTasks.map((task) => (
                      <TaskCard key={task.id} task={task} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </main>

        {/* Error State */}
        {tasksError && (
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load tasks: {tasksError.message}</p>
          </div>
        )}

        {/* No Results */}
        {!isLoadingTasks && !tasksError && filteredTasks.length === 0 && allTasks.length > 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No tasks match the current filters</p>
            <Button variant="link" onClick={clearFilters}>Clear filters to see all tasks</Button>
          </div>
        )}

        {/* Modals */}
        <CreateTaskModal 
          open={showCreateModal} 
          onClose={() => setShowCreateModal(false)}
          projectId={parseInt(project.id)}
        />
        
        <ExportModal
          open={showExportModal}
          onClose={() => setShowExportModal(false)}
          onExport={handleExportTasks}
          projectName={project.name}
          taskCount={allTasks.length}
        />
      </div>
    </div>
  );
};