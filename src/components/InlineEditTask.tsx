import { useState } from "react";
import { Check, X, Edit3, Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";

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

interface InlineEditTaskProps {
  task: Task;
  onSave: (updatedTask: Task) => void;
  onCancel: () => void;
}

export const InlineEditTask = ({ task, onSave, onCancel }: InlineEditTaskProps) => {
  const [editData, setEditData] = useState({
    title: task.title,
    description: task.description,
    priority: task.priority,
    assignee: task.assignee || "",
    dueDate: task.dueDate || null,
  });

  const handleSave = () => {
    onSave({
      ...task,
      ...editData,
    });
  };

  const handleInputChange = (field: string, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive border-destructive/20";
      case "medium": return "bg-warning/10 text-warning border-warning/20";
      case "low": return "bg-success/10 text-success border-success/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="card-elegant border-primary/50 bg-primary/5">
      <div className="space-y-4">
        {/* Priority and Actions */}
        <div className="flex items-start justify-between">
          <Select
            value={editData.priority}
            onValueChange={(value) => handleInputChange("priority", value)}
          >
            <SelectTrigger className="w-24 h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              className="h-7 w-7 p-0 hover:bg-success/20 hover:text-success"
            >
              <Check className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              className="h-7 w-7 p-0 hover:bg-destructive/20 hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Input
            value={editData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            className="font-semibold text-sm border-border/50 focus:border-primary"
            placeholder="Task title"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Textarea
            value={editData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            className="text-sm min-h-[60px] border-border/50 focus:border-primary resize-none"
            placeholder="Task description"
          />
        </div>

        {/* Assignee and Due Date */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex items-center space-x-3">
            {/* Assignee */}
            <div className="flex items-center space-x-2">
              {editData.assignee && (
                <Avatar className="w-6 h-6">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(editData.assignee)}
                  </AvatarFallback>
                </Avatar>
              )}
              <Input
                value={editData.assignee}
                onChange={(e) => handleInputChange("assignee", e.target.value)}
                className="w-24 h-7 text-xs border-border/50"
                placeholder="Assignee"
              />
            </div>

            {/* Due Date */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs hover:bg-secondary/50"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  {editData.dueDate ? format(editData.dueDate, "MMM dd") : "Set date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={editData.dueDate || undefined}
                  onSelect={(date) => handleInputChange("dueDate", date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          
          <div className="text-xs text-muted-foreground">
            {task.createdAt.toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};