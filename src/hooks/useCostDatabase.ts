
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { CostDatabase } from '@/types/cost-estimation';

export const useCostDatabase = () => {
  const [costItems, setCostItems] = useState<CostDatabase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [providerFilter, setProviderFilter] = useState<string>('all');

  const fetchCostItems = async () => {
    try {
      let query = supabase
        .from('cost_databases')
        .select('*')
        .order('item_description', { ascending: true })
        .limit(100);

      if (searchQuery) {
        query = query.or(`item_description.ilike.%${searchQuery}%,item_code.ilike.%${searchQuery}%`);
      }

      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      if (providerFilter !== 'all') {
        query = query.eq('provider', providerFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setCostItems(data || []);
    } catch (error) {
      console.error('Error fetching cost database:', error);
      toast.error('Failed to load cost database');
    } finally {
      setLoading(false);
    }
  };

  const searchCostItems = async (query: string, category?: string, provider?: string) => {
    setSearchQuery(query);
    if (category) setCategoryFilter(category);
    if (provider) setProviderFilter(provider);
    await fetchCostItems();
  };

  const getCostItemById = async (itemCode: string, provider: string): Promise<CostDatabase | null> => {
    try {
      const { data, error } = await supabase
        .from('cost_databases')
        .select('*')
        .eq('item_code', itemCode)
        .eq('provider', provider)
        .order('effective_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data || null;
    } catch (error) {
      console.error('Error fetching cost item:', error);
      return null;
    }
  };

  const adjustCostForLocation = (baseCost: number, locationFactor: number = 1.0): number => {
    return baseCost * locationFactor;
  };

  useEffect(() => {
    fetchCostItems();
  }, [searchQuery, categoryFilter, providerFilter]);

  return {
    costItems,
    loading,
    searchQuery,
    setSearchQuery,
    categoryFilter,
    setCategoryFilter,
    providerFilter,
    setProviderFilter,
    searchCostItems,
    getCostItemById,
    adjustCostForLocation,
    refreshCostItems: fetchCostItems,
  };
};
