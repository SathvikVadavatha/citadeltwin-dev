
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
      let whereClause = '1=1';
      
      if (searchQuery) {
        whereClause += ` AND (item_description ILIKE '%${searchQuery}%' OR item_code ILIKE '%${searchQuery}%')`;
      }

      if (categoryFilter !== 'all') {
        whereClause += ` AND category = '${categoryFilter}'`;
      }

      if (providerFilter !== 'all') {
        whereClause += ` AND provider = '${providerFilter}'`;
      }

      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            SELECT * FROM cost_databases 
            WHERE ${whereClause}
            ORDER BY item_description ASC 
            LIMIT 100
          `
        }
      });

      if (error) throw error;
      setCostItems(data.data || []);
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
      const { data, error } = await supabase.functions.invoke('exec-sql', {
        body: {
          sql: `
            SELECT * FROM cost_databases 
            WHERE item_code = '${itemCode}' AND provider = '${provider}'
            ORDER BY effective_date DESC 
            LIMIT 1
          `
        }
      });

      if (error) throw error;
      return data.data?.[0] || null;
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
