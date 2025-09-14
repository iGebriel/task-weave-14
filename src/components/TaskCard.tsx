import { useState } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, GripVertical, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InlineEditTask } from "./InlineEditTask";

interface Task {
  id: string;
  title: string;
  description: string;
  status: "todo" | "progress" | "done";
  priority: "low" | "medium" | "high";
  assignee?: string;
  dueDate?: Date;
  createdAt?: Date;
}

interface TaskCardProps {
  task: Task;
  onTaskUpdate?: (updatedTask: Task) => void;
}

export const TaskCard = ({ task, onTaskUpdate }: TaskCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium":
        return "bg-warning/10 text-warning border-warning/20";
      case "low":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const isOverdue = task.dueDate && task.dueDate < new Date() && task.status !== "done";

  const handleSave = (updatedTask: Task) => {
    setIsEditing(false);
    onTaskUpdate?.(updatedTask);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <InlineEditTask 
        task={task} 
        onSave={handleSave} 
        onCancel={handleCancel} 
      />
    );
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`card-elegant cursor-grab active:cursor-grabbing group ${
        isDragging ? "opacity-50 rotate-3 shadow-hover" : ""
      }`}
      data-testid="task-card"
      role="article"
      aria-label={`Task: ${task.title}. Status: ${task.status}. Priority: ${task.priority}${task.assignee ? `. Assigned to: ${task.assignee}` : ''}${task.dueDate ? `. Due: ${task.dueDate.toLocaleDateString()}` : ''}`}
      {...attributes}
    >
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center space-x-1">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-6 w-6 p-0 hover:bg-primary/20 hover:text-primary"
          aria-label={`Edit task ${task.title}`}
          title={`Edit task ${task.title}`}
        >
          <Edit3 className="w-3 h-3" aria-hidden="true" />
        </Button>
        <div
          {...listeners}
          className="p-1 hover:bg-muted rounded cursor-grab active:cursor-grabbing"
          role="button"
          aria-label={`Drag to move task ${task.title}`}
          title="Drag to move task"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" aria-hidden="true" />
        </div>
      </div>

      <div className="space-y-3">
        {/* Priority Badge */}
        <div className="flex items-start justify-between">
          <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
          {isOverdue && (
            <Badge variant="destructive" className="text-xs">
              Overdue
            </Badge>
          )}
        </div>

        {/* Title and Description */}
        <div className="space-y-2">
          <h4 className="font-semibold text-foreground leading-tight pr-6">
            {task.title}
          </h4>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {task.description}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center space-x-2">
            {task.assignee && (
              <Avatar className="w-6 h-6">
                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                  {getInitials(task.assignee)}
                </AvatarFallback>
              </Avatar>
            )}
            {task.dueDate && (
              <div className={`flex items-center space-x-1 text-xs ${
                isOverdue ? "text-destructive" : "text-muted-foreground"
              }`}>
                <Calendar className="w-3 h-3" />
                <span>{task.dueDate.toLocaleDateString()}</span>
              </div>
            )}
          </div>
          
          {task.createdAt && (
            <div className="text-xs text-muted-foreground">
              {task.createdAt.toLocaleDateString()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};