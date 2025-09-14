import React, { memo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Trash2 } from 'lucide-react';
import { Project } from '@/types';
import { SecurityUtils } from '@/utils/security';

interface ProjectCardProps {
  project: Project;
  progress: number;
  onSelect: (project: Project) => void;
  getStatusColor: (status: string) => string;
}

/**
 * Optimized ProjectCard component with memoization
 * Prevents unnecessary re-renders when parent state changes
 */
export const ProjectCard = memo<ProjectCardProps>(({
  project,
  progress,
  onSelect,
  getStatusColor,
}) => {
  const handleClick = () => onSelect(project);
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log("Delete project:", project.id);
  };

  // Memoize progress style to prevent inline object creation
  const progressStyle = React.useMemo(() => ({
    width: `${progress}%`,
  }), [progress]);

  return (
    <div
      className="card-project animate-fade-in"
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      data-testid="project-card"
      aria-label={`View project: ${project.name}. Status: ${project.status}. Progress: ${progress}%`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {project.name}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {SecurityUtils.sanitizeText(project.description)}
          </p>
        </div>
        <Badge className={`ml-2 ${getStatusColor(project.status)}`}>
          {project.status}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{progress}%</span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-2" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label="Project progress">
          <div
            className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all duration-300"
            style={progressStyle}
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center text-sm text-muted-foreground">
            <Users className="w-4 h-4 mr-1" />
            {project.collaborators} collaborators
          </div>
          <div className="flex items-center space-x-2">
            {project.isPublic && (
              <Badge variant="outline" className="text-xs">
                Public
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="hover:bg-destructive/10 hover:text-destructive"
              aria-label={`Delete project ${project.name}`}
              title={`Delete project ${project.name}`}
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison function to prevent unnecessary re-renders
  return (
    prevProps.project.id === nextProps.project.id &&
    prevProps.project.name === nextProps.project.name &&
    prevProps.project.description === nextProps.project.description &&
    prevProps.project.status === nextProps.project.status &&
    prevProps.project.isPublic === nextProps.project.isPublic &&
    prevProps.project.collaborators === nextProps.project.collaborators &&
    prevProps.progress === nextProps.progress
  );
});

ProjectCard.displayName = 'ProjectCard';