import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthPage } from './components/auth/AuthPage';
import { UserProfile } from './components/profile/UserProfile';
import { Header } from './components/layout/Header';
import { ProjectDashboard } from './components/ProjectDashboard';
import { toast } from 'sonner';

const queryClient = new QueryClient();

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

const App = () => {
  const [user, setUser] = useState<User | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Check for existing session on app load
  useEffect(() => {
    const savedUser = localStorage.getItem('taskflow_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('taskflow_user');
      }
    }
  }, []);

  const handleAuthSuccess = (userData: User) => {
    const userWithDefaults = {
      ...userData,
      createdAt: userData.createdAt || new Date(),
      projectsCount: userData.projectsCount || 3,
      tasksCompleted: userData.tasksCompleted || 15,
    };
    setUser(userWithDefaults);
    localStorage.setItem('taskflow_user', JSON.stringify(userWithDefaults));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('taskflow_user');
    toast.success('Signed out successfully');
  };

  const handleUserUpdate = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('taskflow_user', JSON.stringify(updatedUser));
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        
        {/* Show auth page if user is not logged in */}
        {!user ? (
          <div className="min-h-screen bg-background">
            <AuthPage onAuthSuccess={handleAuthSuccess} />
          </div>
        ) : (
          <div className="min-h-screen bg-background">
            {/* Profile Modal */}
            {showProfile && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
                <UserProfile
                  user={user}
                  onUserUpdate={handleUserUpdate}
                  onClose={() => setShowProfile(false)}
                />
              </div>
            )}
            
            {/* Main Application */}
            <Header
              user={user}
              onProfileClick={() => setShowProfile(true)}
              onLogout={handleLogout}
            />
            <main>
              <ProjectDashboard />
            </main>
          </div>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;