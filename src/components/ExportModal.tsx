import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Users, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "completed" | "archived" | "draft";
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

interface ExportModalProps {
  open: boolean;
  onClose: () => void;
  projects: Project[];
  allTasks: { [projectId: string]: Task[] };
  currentProjectId?: string;
}

export const ExportModal = ({ open, onClose, projects, allTasks, currentProjectId }: ExportModalProps) => {
  const [selectedProjectId, setSelectedProjectId] = useState(currentProjectId || "");
  const [exportScope, setExportScope] = useState<"current" | "selected" | "all">("current");
  const [includeFields, setIncludeFields] = useState({
    title: true,
    description: true,
    status: true,
    priority: true,
    assignee: true,
    dueDate: true,
    createdAt: true,
  });

  const handleExport = () => {
    let tasksToExport: Task[] = [];
    let filename = "";

    switch (exportScope) {
      case "current":
        if (currentProjectId && allTasks[currentProjectId]) {
          tasksToExport = allTasks[currentProjectId];
          const project = projects.find(p => p.id === currentProjectId);
          filename = `${project?.name.replace(/\s+/g, "_")}_tasks.csv`;
        }
        break;
      case "selected":
        if (selectedProjectId && allTasks[selectedProjectId]) {
          tasksToExport = allTasks[selectedProjectId];
          const project = projects.find(p => p.id === selectedProjectId);
          filename = `${project?.name.replace(/\s+/g, "_")}_tasks.csv`;
        }
        break;
      case "all":
        tasksToExport = Object.values(allTasks).flat();
        filename = "all_projects_tasks.csv";
        break;
    }

    if (tasksToExport.length === 0) {
      return;
    }

    // Build CSV headers based on selected fields
    const headers = [];
    if (includeFields.title) headers.push("Title");
    if (includeFields.description) headers.push("Description");
    if (includeFields.status) headers.push("Status");
    if (includeFields.priority) headers.push("Priority");
    if (includeFields.assignee) headers.push("Assignee");
    if (includeFields.dueDate) headers.push("Due Date");
    if (includeFields.createdAt) headers.push("Created Date");

    // Build CSV content
    const csvContent = [
      headers,
      ...tasksToExport.map(task => {
        const row = [];
        if (includeFields.title) row.push(task.title);
        if (includeFields.description) row.push(task.description);
        if (includeFields.status) row.push(task.status);
        if (includeFields.priority) row.push(task.priority);
        if (includeFields.assignee) row.push(task.assignee || "");
        if (includeFields.dueDate) row.push(task.dueDate?.toLocaleDateString() || "");
        if (includeFields.createdAt) row.push(task.createdAt.toLocaleDateString());
        return row;
      })
    ].map(row => row.map(field => `"${field}"`).join(",")).join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);

    onClose();
  };

  const toggleField = (field: keyof typeof includeFields) => {
    setIncludeFields(prev => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const getTaskCount = () => {
    switch (exportScope) {
      case "current":
        return currentProjectId && allTasks[currentProjectId] ? allTasks[currentProjectId].length : 0;
      case "selected":
        return selectedProjectId && allTasks[selectedProjectId] ? allTasks[selectedProjectId].length : 0;
      case "all":
        return Object.values(allTasks).flat().length;
      default:
        return 0;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] card-elegant border-0">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5 text-primary" />
            <span className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              Export Tasks
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Export Scope */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Export Scope</Label>
            <div className="space-y-2">
              {currentProjectId && (
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="current"
                    name="scope"
                    checked={exportScope === "current"}
                    onChange={() => setExportScope("current")}
                    className="w-4 h-4 text-primary"
                  />
                  <Label htmlFor="current" className="flex-1 cursor-pointer">
                    Current Project
                    <Badge className="ml-2 bg-primary/10 text-primary">
                      {allTasks[currentProjectId]?.length || 0} tasks
                    </Badge>
                  </Label>
                </div>
              )}
              
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="selected"
                  name="scope"
                  checked={exportScope === "selected"}
                  onChange={() => setExportScope("selected")}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="selected" className="flex-1 cursor-pointer">
                  Selected Project
                </Label>
              </div>

              {exportScope === "selected" && (
                <div className="ml-6">
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger className="border-border">
                      <SelectValue placeholder="Choose project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project.id} value={project.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{project.name}</span>
                            <Badge className="ml-2 text-xs bg-muted">
                              {allTasks[project.id]?.length || 0} tasks
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="all"
                  name="scope"
                  checked={exportScope === "all"}
                  onChange={() => setExportScope("all")}
                  className="w-4 h-4 text-primary"
                />
                <Label htmlFor="all" className="flex-1 cursor-pointer">
                  All Projects
                  <Badge className="ml-2 bg-success/10 text-success">
                    {Object.values(allTasks).flat().length} tasks
                  </Badge>
                </Label>
              </div>
            </div>
          </div>

          {/* Fields to Include */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Fields to Include</Label>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(includeFields).map(([field, checked]) => (
                <div key={field} className="flex items-center space-x-2">
                  <Checkbox
                    id={field}
                    checked={checked}
                    onCheckedChange={() => toggleField(field as keyof typeof includeFields)}
                  />
                  <Label
                    htmlFor={field}
                    className="text-sm font-normal cursor-pointer capitalize"
                  >
                    {field === "createdAt" ? "Created Date" : field === "dueDate" ? "Due Date" : field}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-muted/30 rounded-lg p-4 space-y-2">
            <div className="flex items-center space-x-2 text-sm">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium">Export Summary:</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <p>{getTaskCount()} tasks will be exported</p>
              <p>{Object.values(includeFields).filter(Boolean).length} fields included</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="border-border hover:bg-secondary/50"
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            className="btn-hero"
            disabled={getTaskCount() === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};