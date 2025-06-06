
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

interface Profile {
  id: string;
  full_name: string | null;
  company: string | null;
  role: 'engineer' | 'planner' | 'industrial' | null;
  avatar_url: string | null;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      try {
        setLoading(true);
        
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, company, role, avatar_url')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        // Type cast the role field to ensure it matches our expected type
        const typedProfile: Profile = {
          id: data.id,
          full_name: data.full_name,
          company: data.company,
          role: data.role as Profile['role'],
          avatar_url: data.avatar_url
        };
        
        setProfile(typedProfile);
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError(error as Error);
      } finally {
        setLoading(false);
      }
    }

    fetchProfile();
  }, [user]);

  return { profile, loading, error };
}
