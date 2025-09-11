import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { TaskCard } from "./TaskCard";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

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

interface Column {
  id: string;
  title: string;
  status: "todo" | "progress" | "done";
}

interface TaskColumnProps {
  column: Column;
  tasks: Task[];
}

export const TaskColumn = ({ column, tasks }: TaskColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id: column.status,
  });

  const getColumnStyle = () => {
    switch (column.status) {
      case "todo":
        return "border-muted bg-muted/5";
      case "progress":
        return "border-warning/20 bg-warning/5";
      case "done":
        return "border-success/20 bg-success/5";
      default:
        return "border-muted bg-muted/5";
    }
  };

  const getHeaderBadgeStyle = () => {
    switch (column.status) {
      case "todo":
        return "bg-muted text-muted-foreground";
      case "progress":
        return "bg-warning/10 text-warning border-warning/20";
      case "done":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className={`rounded-xl border-2 transition-all duration-200 ${getColumnStyle()} ${isOver ? 'border-primary bg-primary/5' : ''}`}>
      {/* Column Header */}
      <div className="p-4 border-b border-border/50">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-foreground">{column.title}</h3>
          <Badge className={getHeaderBadgeStyle()}>
            {tasks.length}
          </Badge>
        </div>
        <button className="w-full flex items-center justify-center py-2 px-3 text-sm text-muted-foreground hover:text-foreground hover:bg-secondary/50 rounded-lg transition-colors duration-200 border-2 border-dashed border-muted hover:border-primary/30">
          <Plus className="w-4 h-4 mr-2" />
          Add task
        </button>
      </div>

      {/* Tasks List */}
      <div
        ref={setNodeRef}
        className="p-4 space-y-3 min-h-[400px]"
      >
        <SortableContext items={tasks.map(t => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </SortableContext>
        
        {tasks.length === 0 && (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <p className="text-sm">No tasks yet</p>
          </div>
        )}
      </div>
    </div>
  );
};