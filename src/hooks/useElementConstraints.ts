
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type ElementConstraint = Database['public']['Tables']['element_constraints']['Row'];

export interface CreateConstraintData {
  element_id: string;
  constraint_type: Database['public']['Enums']['constraint_type'];
  constraint_data: any;
  target_element_id?: string;
  is_active?: boolean;
}

export const useElementConstraints = (elementId?: string) => {
  const [constraints, setConstraints] = useState<ElementConstraint[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();

  const fetchConstraints = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      let query = supabase
        .from('element_constraints')
        .select(`
          *,
          bim_elements!element_id (
            id,
            name,
            element_type
          ),
          target_element:bim_elements!target_element_id (
            id,
            name,
            element_type
          )
        `)
        .order('created_at', { ascending: false });

      if (elementId) {
        query = query.eq('element_id', elementId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching constraints:', error);
        toast.error('Failed to load constraints');
        return;
      }

      setConstraints(data || []);
    } catch (error) {
      console.error('Error fetching constraints:', error);
      toast.error('Failed to load constraints');
    } finally {
      setLoading(false);
    }
  };

  const createConstraint = async (constraintData: CreateConstraintData): Promise<ElementConstraint | null> => {
    if (!user) return null;

    try {
      setCreating(true);
      const { data, error } = await supabase
        .from('element_constraints')
        .insert(constraintData)
        .select(`
          *,
          bim_elements!element_id (
            id,
            name,
            element_type
          ),
          target_element:bim_elements!target_element_id (
            id,
            name,
            element_type
          )
        `)
        .single();

      if (error) {
        console.error('Error creating constraint:', error);
        toast.error('Failed to create constraint');
        return null;
      }

      toast.success('Constraint created successfully');
      await fetchConstraints();
      return data;
    } catch (error) {
      console.error('Error creating constraint:', error);
      toast.error('Failed to create constraint');
      return null;
    } finally {
      setCreating(false);
    }
  };

  const updateConstraint = async (id: string, updates: Partial<CreateConstraintData>): Promise<ElementConstraint | null> => {
    try {
      setUpdating(true);
      const { data, error } = await supabase
        .from('element_constraints')
        .update(updates)
        .eq('id', id)
        .select(`
          *,
          bim_elements!element_id (
            id,
            name,
            element_type
          ),
          target_element:bim_elements!target_element_id (
            id,
            name,
            element_type
          )
        `)
        .single();

      if (error) {
        console.error('Error updating constraint:', error);
        toast.error('Failed to update constraint');
        return null;
      }

      toast.success('Constraint updated successfully');
      await fetchConstraints();
      return data;
    } catch (error) {
      console.error('Error updating constraint:', error);
      toast.error('Failed to update constraint');
      return null;
    } finally {
      setUpdating(false);
    }
  };

  const deleteConstraint = async (id: string): Promise<boolean> => {
    try {
      setDeleting(true);
      const { error } = await supabase
        .from('element_constraints')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting constraint:', error);
        toast.error('Failed to delete constraint');
        return false;
      }

      toast.success('Constraint deleted successfully');
      await fetchConstraints();
      return true;
    } catch (error) {
      console.error('Error deleting constraint:', error);
      toast.error('Failed to delete constraint');
      return false;
    } finally {
      setDeleting(false);
    }
  };

  const toggleConstraint = async (id: string): Promise<boolean> => {
    const constraint = constraints.find(c => c.id === id);
    if (!constraint) return false;

    return !!(await updateConstraint(id, { is_active: !constraint.is_active }));
  };

  useEffect(() => {
    if (user) {
      fetchConstraints();
    }
  }, [user, elementId]);

  return {
    constraints,
    loading,
    creating,
    updating,
    deleting,
    createConstraint,
    updateConstraint,
    deleteConstraint,
    toggleConstraint,
    refreshConstraints: fetchConstraints,
  };
};
