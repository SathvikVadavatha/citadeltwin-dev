
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: 'admin' | 'engineer' | 'planner' | 'viewer' | 'inactive' | null;
  department: string | null;
  phone: string | null;
  organization: string | null;
  avatar_url: string | null;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select(`
            *,
            roles!inner(role_name)
          `)
          .eq('id', user.id)
          .single();

        if (error) throw error;

        if (data) {
          setProfile({
            ...data,
            role: data.roles?.role_name || null,
            email: user.email || null
          });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
};
