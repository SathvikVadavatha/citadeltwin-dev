
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export interface User {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  company: string | null;
  avatar_url: string | null;
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

  // Fetch all users
  const { data: users, isLoading: usersLoading, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as User[];
    },
    enabled: !!user,
  });

  // Update user role
  const updateUserRole = useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data, error } = await supabase
        .from('profiles')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
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
      const { data, error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return data;
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
        .update({ role: 'inactive', updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
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
      const { data: users, error } = await supabase
        .from('profiles')
        .select('role, created_at');

      if (error) throw error;

      const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'admin').length,
        engineers: users.filter(u => u.role === 'engineer').length,
        planners: users.filter(u => u.role === 'planner').length,
        viewers: users.filter(u => u.role === 'viewer').length,
        inactive: users.filter(u => u.role === 'inactive').length,
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
