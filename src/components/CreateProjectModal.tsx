import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ModalForm } from "@/components/forms/ModalForm";
import { FormField } from "@/components/forms/FormField";
import { useCreateProject } from "@/hooks/useProjects";
import { StatusStyleManager } from "@/config/statusStyles";
import { projectCreateSchema, validateData, type ProjectCreateInput } from "@/utils/validation";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal = ({ open, onClose }: CreateProjectModalProps) => {
  const [formData, setFormData] = useState<ProjectCreateInput>({
    name: "",
    description: "",
    status: "draft",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const createProjectMutation = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    
    // Validate form data
    const validation = validateData(projectCreateSchema, formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string[]> = {};
      validation.errors?.forEach(error => {
        // Simple error mapping - in production, you'd want more sophisticated field mapping
        if (error.includes('name')) fieldErrors.name = [error];
        else if (error.includes('description')) fieldErrors.description = [error];
        else if (error.includes('status')) fieldErrors.status = [error];
        else fieldErrors.general = fieldErrors.general ? [...fieldErrors.general, error] : [error];
      });
      setErrors(fieldErrors);
      return;
    }
    
    try {
      await createProjectMutation.mutateAsync({
        project: validation.data!,
      });
      
      // Reset form and close modal on success
      setFormData({
        name: "",
        description: "",
        status: "draft",
      });
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Failed to create project:', error);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  // Reset form when modal closes
  const handleClose = () => {
    if (!createProjectMutation.isPending) {
      setFormData({
        name: "",
        description: "",
        status: "draft",
      });
      onClose();
    }
  };

  return (
    <ModalForm
      open={open}
      onClose={handleClose}
      title="Create New Project"
      onSubmit={handleSubmit}
      submitLabel="Create Project"
      isSubmitting={createProjectMutation.isPending}
      isSubmitDisabled={
        !formData.name.trim() ||
        formData.description.trim().length < 10
      }
      submitTestId="create-project-submit"
      className="sm:max-w-[500px]"
    >
      <FormField
        label="Project Name"
        htmlFor="name"
        required
        error={errors.name?.[0]}
      >
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => handleInputChange("name", e.target.value)}
          placeholder="Enter project name"
          className="border-border focus:ring-primary"
          required
          data-testid="project-name-input"
        />
      </FormField>

      <FormField
        label="Description"
        htmlFor="description"
        error={errors.description?.[0]}
      >
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Describe your project goals and objectives"
          className="border-border focus:ring-primary min-h-[100px]"
          rows={4}
          data-testid="project-description-input"
        />
      </FormField>

      <FormField
        label="Initial Status"
        htmlFor="status"
        error={errors.status?.[0]}
      >
        <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
          <SelectTrigger className="border-border focus:ring-primary">
            <SelectValue placeholder="Select project status" />
          </SelectTrigger>
          <SelectContent>
            {StatusStyleManager.getAllProjectStatuses()
              .filter(({ value }) => value === 'draft' || value === 'active')
              .map(({ value, config }) => (
                <SelectItem key={value} value={value}>
                  <div className="flex items-center gap-2">
                    <Badge className={config.className}>
                      {config.label}
                    </Badge>
                    <span className="text-sm">
                      {value === 'draft' ? 'Work in progress' : 'Currently working'}
                    </span>
                  </div>
                </SelectItem>
              ))
            }
          </SelectContent>
        </Select>
      </FormField>
    </ModalForm>
  );
};