import React from 'react';
import { Header } from './Header';
import { ProjectDashboard } from '../ProjectDashboard';
import { useAuthContext } from '../providers/AuthProvider';
import { useModalState } from '@/hooks/business/useModalState';
import { UserProfile } from '../profile/UserProfile';

/**
 * Main application layout component
 * Handles the authenticated user interface layout
 */
export const AppLayout: React.FC = () => {
  const { user, logout, updateProfile } = useAuthContext();
  const profileModal = useModalState();

  if (!user) {
    return null; // Should not render if no user
  }

  const handleProfileClick = () => {
    profileModal.open();
  };

  const handleUserUpdate = async (updates: Partial<typeof user>) => {
    try {
      await updateProfile(updates);
      profileModal.close();
    } catch (error) {
      // Error is handled by the authentication service
      console.error('Failed to update profile:', error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Profile Modal */}
      {profileModal.isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <UserProfile
            user={user}
            onUserUpdate={handleUserUpdate}
            onClose={profileModal.close}
          />
        </div>
      )}
      
      {/* Header */}
      <Header
        user={user}
        onProfileClick={handleProfileClick}
        onLogout={logout}
      />
      
      {/* Main Content */}
      <main>
        <ProjectDashboard />
      </main>
    </div>
  );
};
