import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

interface CreateProjectModalProps {
  open: boolean;
  onClose: () => void;
}

export const CreateProjectModal = ({ open, onClose }: CreateProjectModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    isPublic: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Integrate with API
    console.log("Creating project:", formData);
    
    // Reset form
    setFormData({
      name: "",
      description: "",
      isPublic: false,
    });
    
    onClose();
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
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
              placeholder="Describe your project goals and objectives"
              className="border-border focus:ring-primary min-h-[100px]"
              rows={4}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Project Visibility</Label>
              <p className="text-xs text-muted-foreground">
                {formData.isPublic 
                  ? "Anyone can view and contribute to this project"
                  : "Only invited collaborators can access this project"
                }
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Badge variant={formData.isPublic ? "default" : "outline"} className="text-xs">
                {formData.isPublic ? "Public" : "Private"}
              </Badge>
              <Switch
                checked={formData.isPublic}
                onCheckedChange={(checked) => handleInputChange("isPublic", checked)}
                className="data-[state=checked]:bg-primary"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-border hover:bg-secondary/50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-hero"
              disabled={!formData.name.trim()}
            >
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};