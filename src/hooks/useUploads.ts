
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export const useUploads = () => {
  const { user } = useAuth();

  const { data: uploads, isLoading } = useQuery({
    queryKey: ['uploads', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('blueprint_uploads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  return {
    uploads: uploads || [],
    isLoading,
  };
};
