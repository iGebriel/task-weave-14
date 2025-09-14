import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { ModalForm } from "@/components/forms/ModalForm";
import { FormField } from "@/components/forms/FormField";
import { useCreateTask } from '@/hooks/useTasks';
import { useServices } from '@/services/context/ServiceContext';
import { toast } from 'sonner';

type TaskStatus = "todo" | "progress" | "done";

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  projectId: number;
  defaultStatus?: TaskStatus;
}

export const CreateTaskModal = ({ open, onClose, projectId, defaultStatus = "todo" }: CreateTaskModalProps) => {
  const createTaskMutation = useCreateTask();
  const services = useServices();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    assignee: "",
    dueDate: null as Date | null,
    status: defaultStatus as "todo" | "progress" | "done",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Task title is required");
      return;
    }

    // Get current user for task assignment
    const currentUser = services.auth.getCurrentUser();
    if (!currentUser) {
      toast.error("User not authenticated");
      return;
    }

    try {
      // Map UI status to API status
      const mapStatusToApi = (status: TaskStatus): 'draft' | 'todo' | 'in_progress' | 'completed' | 'cancelled' => {
        switch (status) {
          case 'todo': return 'todo';
          case 'progress': return 'in_progress';
          case 'done': return 'completed';
          default: return 'todo';
        }
      };

      const taskData = {
        task: {
          title: formData.title,
          description: formData.description || 'No description provided',
          status: mapStatusToApi(formData.status),
          priority: formData.priority as 'low' | 'medium' | 'high',
          due_date: formData.dueDate ? formData.dueDate.toISOString() : null,
          project_id: projectId,
          user_id: typeof currentUser.id === 'string' ? parseInt(currentUser.id) : currentUser.id,
        }
      };

      await createTaskMutation.mutateAsync(taskData);

      // Reset form and close modal
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assignee: "",
        dueDate: null,
        status: defaultStatus,
      });
      onClose();
    } catch (error) {
      console.error('Failed to create task:', error);
      // Error is handled by the hook's onError callback
    }
  };

  const handleInputChange = (field: string, value: string | Date | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <ModalForm
      open={open}
      onClose={onClose}
      title="Create New Task"
      onSubmit={handleSubmit}
      submitLabel="Create Task"
      isSubmitting={createTaskMutation.isPending}
      isSubmitDisabled={!formData.title.trim()}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          label="Task Title"
          htmlFor="title"
          required
          className="md:col-span-2"
        >
          <Input
            id="title"
            value={formData.title}
            onChange={(e) => handleInputChange("title", e.target.value)}
            placeholder="Enter task title"
            className="border-border focus:ring-primary"
            required
          />
        </FormField>

        <FormField
          label="Description"
          htmlFor="description"
          className="md:col-span-2"
        >
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange("description", e.target.value)}
            placeholder="Describe the task requirements and objectives"
            className="border-border focus:ring-primary min-h-[80px]"
            rows={3}
          />
        </FormField>

        <FormField label="Priority">
          <Select
            value={formData.priority}
            onValueChange={(value) => handleInputChange("priority", value)}
          >
            <SelectTrigger className="border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Status">
          <Select
            value={formData.status}
            onValueChange={(value) => handleInputChange("status", value)}
          >
            <SelectTrigger className="border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo">To Do</SelectItem>
              <SelectItem value="progress">In Progress</SelectItem>
              <SelectItem value="done">Done</SelectItem>
            </SelectContent>
          </Select>
        </FormField>

        <FormField label="Assignee">
          <Input
            value={formData.assignee}
            onChange={(e) => handleInputChange("assignee", e.target.value)}
            placeholder="Assign to team member"
            className="border-border focus:ring-primary"
          />
        </FormField>

        <FormField label="Due Date">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={`w-full justify-start text-left font-normal border-border ${!formData.dueDate && "text-muted-foreground"
                  }`}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.dueDate ? format(formData.dueDate, "PPP") : "Select date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.dueDate || undefined}
                onSelect={(date) => handleInputChange("dueDate", date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </FormField>
      </div>
    </ModalForm>
  );
};