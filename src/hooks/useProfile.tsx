
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
        
        // Get profile with role information using a join
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select(`
            *,
            roles!profiles_role_id_fkey(role_name)
          `)
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (profileData) {
          setProfile({
            id: profileData.id,
            full_name: profileData.full_name,
            email: user.email || profileData.email || null,
            role: profileData.roles?.role_name as 'admin' | 'engineer' | 'planner' | 'viewer' | 'inactive' | null,
            department: profileData.department,
            phone: profileData.phone,
            organization: profileData.organization,
            avatar_url: profileData.avatar_url,
            is_active: profileData.is_active ?? true,
            last_login: profileData.last_login,
            created_at: profileData.created_at,
            updated_at: profileData.updated_at
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
