import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useCreateProject } from "@/hooks/useProjects";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal = ({ open, onClose }: CreateProjectModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "draft" as const,
  });

  const createProjectMutation = useCreateProject();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await createProjectMutation.mutateAsync({
        project: {
          name: formData.name.trim(),
          description: formData.description.trim(),
          status: formData.status,
        },
      });
      
      // Reset form and close modal on success
      setFormData({
        name: "",
        description: "",
        status: "draft",
      });
      onClose();
    } catch (error) {
      // Error handling is done by the hook
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
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] card-elegant border-0">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Create New Project
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Project Name *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Enter project name"
              className="border-border focus:ring-primary"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Describe your project goals and objectives (minimum 10 characters)"
              className="border-border focus:ring-primary min-h-[100px]"
              rows={4}
              required
              minLength={10}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Initial Status
            </Label>
            <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
              <SelectTrigger className="border-border focus:ring-primary">
                <SelectValue placeholder="Select project status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-muted/20">
                      Draft
                    </Badge>
                    <span className="text-sm">Work in progress</span>
                  </div>
                </SelectItem>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-warning/10 text-warning border-warning/20">
                      Active
                    </Badge>
                    <span className="text-sm">Currently working</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={createProjectMutation.isPending}
              className="border-border hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-hero"
              disabled={
                !formData.name.trim() || 
                formData.description.trim().length < 10 || 
                createProjectMutation.isPending
              }
            >
              {createProjectMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};