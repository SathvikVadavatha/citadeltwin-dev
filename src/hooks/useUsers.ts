
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
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          roles!inner(role_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      return data.map(profile => ({
        ...profile,
        role: profile.roles?.role_name || null,
        email: profile.email || ''
      })) as User[];
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

      const { data, error } = await supabase
        .from('profiles')
        .update({ 
          role_id: roleData.id,
          updated_at: new Date().toISOString() 
        })
        .eq('id', userId)
        .select(`
          *,
          roles!inner(role_name)
        `)
        .single();

      if (error) throw error;
      return {
        ...data,
        role: data.roles?.role_name || null
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

      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)
        .select(`
          *,
          roles!inner(role_name)
        `)
        .single();

      if (error) throw error;
      return {
        ...data,
        role: data.roles?.role_name || null
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
        .select(`
          *,
          roles!inner(role_name)
        `)
        .single();

      if (error) throw error;
      return {
        ...data,
        role: data.roles?.role_name || null
      };
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
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          created_at,
          is_active,
          roles!inner(role_name)
        `);

      if (error) throw error;

      const stats = {
        total: users.length,
        admins: users.filter(u => u.roles?.role_name === 'admin').length,
        engineers: users.filter(u => u.roles?.role_name === 'engineer').length,
        planners: users.filter(u => u.roles?.role_name === 'planner').length,
        viewers: users.filter(u => u.roles?.role_name === 'viewer').length,
        inactive: users.filter(u => !u.is_active).length,
        thisMonth: users.filter(u => {
          const created = new Date(u.created_at);
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          return created > monthAgo;
        }).length,
      };

      return stats;
    },
    enabled: !!user,
  });
};
