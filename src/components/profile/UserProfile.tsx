import { useState } from "react";
import { User, Mail, Shield, Settings, Camera, Save, X, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  createdAt?: Date;
  projectsCount?: number;
  tasksCompleted?: number;
}

interface UserProfileProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
  onClose?: () => void;
}

export const UserProfile = ({ user, onUserUpdate, onClose }: UserProfileProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name,
    email: user.email,
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map(n => n[0])
      .join("")
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case "admin":
        return "bg-destructive/10 text-destructive border-destructive/20";
      case "manager":
        return "bg-warning/10 text-warning border-warning/20";
      case "user":
        return "bg-success/10 text-success border-success/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // API call implementation needed
      console.log("Updating user:", formData);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      const updatedUser = {
        ...user,
        name: formData.name.trim(),
        email: formData.email,
      };

      onUserUpdate(updatedUser);
      setIsEditing(false);
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user.name,
      email: user.email,
    });
    setErrors({});
    setIsEditing(false);
  };

  const handleAvatarChange = async () => {
    // Avatar upload functionality to be implemented
    toast.info("Avatar upload feature coming soon!");
  };

  return (
    <Card className="card-elegant w-full max-w-2xl mx-auto">
      <div className="p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            User Profile
          </h1>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Avatar Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative group">
            <Avatar className="w-24 h-24 mb-4">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {getInitials(user.name)}
              </AvatarFallback>
            </Avatar>
            <button
              onClick={handleAvatarChange}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Camera className="w-6 h-6 text-white" />
            </button>
          </div>
          <Badge className={getRoleColor(user.role)}>
            {user.role}
          </Badge>
        </div>

        {/* Profile Information */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Basic Information</h3>
              {!isEditing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Edit
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium">
                  Full Name
                </Label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        className={`pl-10 ${errors.name ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground font-medium">{user.name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address
                </Label>
                {isEditing ? (
                  <div>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                        className={`pl-10 ${errors.email ? 'border-destructive' : ''}`}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-foreground font-medium">{user.email}</p>
                )}
              </div>
            </div>

            {isEditing && (
              <div className="flex items-center space-x-3 pt-4">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="btn-hero"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Account Stats */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-primary/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-primary">{user.projectsCount || 0}</p>
                <p className="text-sm text-muted-foreground">Projects</p>
              </div>
              <div className="bg-success/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-success">{user.tasksCompleted || 0}</p>
                <p className="text-sm text-muted-foreground">Tasks Completed</p>
              </div>
              <div className="bg-warning/5 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-warning">
                  {user.createdAt ? Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : 0}
                </p>
                <p className="text-sm text-muted-foreground">Days Active</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Account Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Account Details</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="font-mono">{user.id}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Role</span>
                <Badge className={getRoleColor(user.role)}>
                  <Shield className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
              </div>
              {user.createdAt && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Member Since</span>
                  <span>{user.createdAt.toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};