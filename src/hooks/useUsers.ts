
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  department: string | null;
  phone: string | null;
  organization: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  invited_by: string;
  organization: string | null;
  status: 'pending' | 'accepted' | 'expired';
  expires_at: string;
  created_at: string;
}

export const useUsers = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch all users with their roles
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      // Get all profiles with their role information using a join
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          *,
          roles!profiles_role_id_fkey(role_name)
        `)
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Map profiles to users with role names
      return profiles?.map(profile => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email || '',
        role: profile.roles?.role_name || null,
        department: profile.department,
        phone: profile.phone,
        organization: profile.organization,
        avatar_url: profile.avatar_url,
        is_active: profile.is_active ?? true,
        last_login: profile.last_login,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      })) as User[] || [];
    },
    enabled: !!user,
  });

  // Update user role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      // First get the role_id for the role name
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('role_name', role)
        .single();

      if (roleError) throw roleError;

      // Update the profile with the new role_id
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          role_id: roleData.id,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      
      return {
        ...data,
        role: role
      };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success(`User role updated to ${data.role}`);
    },
    onError: (error) => {
      toast.error(`Failed to update user role: ${error.message}`);
    },
  });

  // Update user profile
  const updateUserProfile = useMutation({
    mutationFn: async ({ userId, updates }: { userId: string; updates: Partial<User> }) => {
      const updateData: any = { 
        ...updates, 
        updated_at: new Date().toISOString() 
      };

      // If role is being updated, get the role_id
      if (updates.role) {
        const { data: roleData, error: roleError } = await supabase
          .from('roles')
          .select('id')
          .eq('role_name', updates.role)
          .single();

        if (roleError) throw roleError;
        updateData.role_id = roleData.id;
        delete updateData.role; // Remove role from update data as it's not a column
      }

      // Remove email from updates as it's not stored in profiles
      delete updateData.email;

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      
      return {
        ...data,
        role: updates.role || null
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User profile updated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to update user profile: ${error.message}`);
    },
  });

  // Deactivate user (soft delete)
  const deactivateUser = useMutation({
    mutationFn: async (userId: string) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          is_active: false, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select('*')
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deactivated successfully');
    },
    onError: (error) => {
      toast.error(`Failed to deactivate user: ${error.message}`);
    },
  });

  return {
    users: users || [],
    usersLoading,
    usersError,
    updateUserRole,
    updateUserProfile,
    deactivateUser,
  };
};

export const useUserStats = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['user-stats'],
    queryFn: async () => {
      // Get all profiles with role information
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          created_at, 
          is_active, 
          roles!profiles_role_id_fkey(role_name)
        `);

      if (profilesError) throw profilesError;

      const stats = {
        total: profiles?.length || 0,
        admins: profiles?.filter(p => p.roles?.role_name === 'admin').length || 0,
        engineers: profiles?.filter(p => p.roles?.role_name === 'engineer').length || 0,
        planners: profiles?.filter(p => p.roles?.role_name === 'planner').length || 0,
        viewers: profiles?.filter(p => p.roles?.role_name === 'viewer').length || 0,
        inactive: profiles?.filter(p => !p.is_active).length || 0,
        thisMonth: profiles?.filter(p => {
          const created = new Date(p.created_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created > monthAgo;
        }).length || 0,
      };

      return stats;
    },
    enabled: !!user,
  });
};
