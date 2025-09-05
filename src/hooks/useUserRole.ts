import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type ViewMode = 'admin' | 'client';

interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  tenant_id: string;
  project_id: string | null;
}

interface UserRoleState {
  profile: UserProfile | null;
  viewMode: ViewMode;
  canSwitchRoles: boolean;
  assignedProjectId: string | null;
  isOwner: boolean;
  isAdmin: boolean;
  loading: boolean;
}

export const useUserRole = () => {
  const { user } = useAuth();
  const [state, setState] = useState<UserRoleState>({
    profile: null,
    viewMode: 'client',
    canSwitchRoles: false,
    assignedProjectId: null,
    isOwner: false,
    isAdmin: false,
    loading: true
  });

  // Load view mode from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('viewMode') as ViewMode;
    if (savedViewMode && (savedViewMode === 'admin' || savedViewMode === 'client')) {
      setState(prev => ({ ...prev, viewMode: savedViewMode }));
    }
  }, []);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user) {
        setState(prev => ({ ...prev, loading: false }));
        return;
      }

      try {
        setState(prev => ({ ...prev, loading: true }));
        
        console.log('🔍 Fetching profile for user:', user.id);

        // Get user profile
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, email, full_name, role, tenant_id, project_id')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('❌ Profile error:', profileError);
          throw profileError;
        }

        console.log('✅ Profile found:', profile);

        // Also check user_profile table for owner/admin status
        const { data: userProfile, error: userError } = await supabase
          .from('user_profile')
          .select('role')
          .eq('user_id', user.id)
          .single();

        console.log('🏢 User profile:', userProfile, userError);

        // CRITICAL: Only use profiles table role for permissions, ignore user_profile table
        const isOwner = profile?.role === 'owner';
        const isAdmin = profile?.role === 'admin';
        const canSwitchRoles = isOwner || isAdmin;

        console.log('🔐 Permissions (Fixed):', {
          profileRole: profile?.role,
          isOwner,
          isAdmin,
          canSwitchRoles,
          note: 'Using only profiles table role - FIXED ADMIN CHECK'
        });

        // Default to admin view if user can switch roles and no saved preference
        const defaultViewMode = canSwitchRoles && !localStorage.getItem('viewMode') ? 'admin' : 'client';

        setState({
          profile,
          viewMode: localStorage.getItem('viewMode') as ViewMode || defaultViewMode,
          canSwitchRoles,
          assignedProjectId: profile?.project_id || null,
          isOwner,
          isAdmin: isAdmin,
          loading: false
        });

        console.log('🎯 Final state:', {
          profile: profile?.email,
          role: profile?.role,
          userRole: userProfile?.role,
          canSwitchRoles,
          isAdmin,
          isOwner,
          viewMode: localStorage.getItem('viewMode') || defaultViewMode,
          assignedProject: profile?.project_id
        });

      } catch (error) {
        console.error('💥 Error fetching user profile:', error);
        setState(prev => ({ ...prev, loading: false }));
      }
    };

    fetchUserProfile();
  }, [user]);

  const switchViewMode = (mode: ViewMode) => {
    if (!state.canSwitchRoles && mode === 'admin') {
      console.warn('User cannot switch to admin mode');
      return;
    }

    setState(prev => ({ ...prev, viewMode: mode }));
    localStorage.setItem('viewMode', mode);
    console.log('Switched to view mode:', mode);
  };

  const getCurrentAccessLevel = () => {
    if (state.viewMode === 'admin' && state.canSwitchRoles) {
      return 'admin';
    }
    return 'client';
  };

  const shouldShowAdminFeatures = () => {
    return state.viewMode === 'admin' && state.canSwitchRoles;
  };

  const getAccessibleProjects = async () => {
    if (!user) return [];

    try {
      let query = supabase.from('project').select('id, name, account_id');

      // If in client mode or user can't switch roles, filter by assigned project
      if (state.viewMode === 'client' || !state.canSwitchRoles) {
        if (state.assignedProjectId) {
          query = query.eq('id', state.assignedProjectId);
        } else {
          return []; // No assigned project
        }
      } else {
        // Admin mode - get all projects in user's account
        const { data: userProfile } = await supabase
          .from('user_profile')
          .select('account_id')
          .eq('user_id', user.id)
          .single();

        if (userProfile?.account_id) {
          query = query.eq('account_id', userProfile.account_id);
        }
      }

      const { data: projects, error } = await query.order('name', { ascending: true });
      if (error) throw error;

      return projects || [];
    } catch (error) {
      console.error('Error fetching accessible projects:', error);
      return [];
    }
  };

  return {
    ...state,
    switchViewMode,
    getCurrentAccessLevel,
    shouldShowAdminFeatures,
    getAccessibleProjects,
    refreshProfile: () => {
      if (user) {
        // Trigger re-fetch by updating a dependency
        setState(prev => ({ ...prev, loading: true }));
      }
    }
  };
};