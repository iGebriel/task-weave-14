import { useState } from "react";
import { User, LogOut, Settings, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface User {
  id: number;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface HeaderProps {
  user: User;
  onProfileClick: () => void;
  onLogout: () => void;
}

export const Header = ({ user, onProfileClick, onLogout }: HeaderProps) => {
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

  return (
    <header 
      className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      role="banner"
    >
      <nav id="main-navigation" className="container flex h-16 items-center justify-between px-6" role="navigation" aria-label="Main navigation" tabIndex={-1}>
        {/* Logo */}
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            TaskFlow
          </h1>
        </div>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-10 w-auto px-3 py-2 bg-card/50 backdrop-blur-sm border border-border/50 hover:bg-card/80"
              data-testid="user-menu"
            >
              <div className="flex items-center space-x-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{user.name}</span>
                  <Badge className={`text-xs ${getRoleColor(user.role)} h-4`}>
                    {user.role}
                  </Badge>
                </div>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </div>
            </Button>
          </DropdownMenuTrigger>
          
          <DropdownMenuContent 
            className="w-64 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 border border-border/40"
            align="end"
            forceMount
          >
            {/* User Info */}
            <div className="flex items-center space-x-3 p-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user.avatar} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <DropdownMenuSeparator />
            
            {/* Menu Items */}
            <DropdownMenuItem 
              onClick={onProfileClick}
              className="cursor-pointer hover:bg-secondary/50"
            >
              <User className="mr-3 h-4 w-4" />
              <span>Profile Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem className="cursor-pointer hover:bg-secondary/50">
              <Settings className="mr-3 h-4 w-4" />
              <span>Account Settings</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-testid="sign-out-button"
            >
              <LogOut className="mr-3 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </nav>
    </header>
  );
};