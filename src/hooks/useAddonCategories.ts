
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AddonCategory } from '@/types';

export const useAddonCategories = (storeId?: string) => {
  const [addonCategories, setAddonCategories] = useState<AddonCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAddonCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!storeId) {
        setAddonCategories([]);
        setLoading(false);
        return;
      }
      
      const { data, error, count } = await supabase
        .from('addon_categories')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }
      
      const mappedCategories: AddonCategory[] = (data || []).map(category => {
        return {
          id: category.id,
          name: category.name || '',
          description: category.description || '',
          store_id: category.store_id || '',
          is_required: category.is_required || false,
          is_multiple: category.is_multiple || false,
          is_order_bump: category.is_order_bump || false,
          min_select: category.min_select || 1,
          max_select: category.max_select || 1,
          sort_order: category.sort_order || 0,
          is_active: category.is_active !== false,
          created_at: category.created_at || new Date().toISOString(),
          order_bump_description: category.order_bump_description || '',
          order_bump_image_url: category.order_bump_image_url || ''
        };
      });

      setAddonCategories(mappedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias de adicionais';
      setError(errorMessage);
      setAddonCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddonCategories();
  }, [storeId]);

  const addAddonCategory = async (categoryData: Omit<AddonCategory, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('addon_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      const mappedCategory: AddonCategory = {
        id: data.id,
        name: data.name || '',
        description: data.description || '',
        store_id: data.store_id || '',
        is_required: data.is_required || false,
        is_multiple: data.is_multiple || false,
        is_order_bump: data.is_order_bump || false,
        min_select: data.min_select || 1,
        max_select: data.max_select || 1,
        sort_order: data.sort_order || 0,
        is_active: data.is_active !== false,
        created_at: data.created_at || new Date().toISOString(),
        order_bump_description: data.order_bump_description || '',
        order_bump_image_url: data.order_bump_image_url || ''
      };

      setAddonCategories(prev => [...prev, mappedCategory]);
      return mappedCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar categoria de adicional';
      setError(errorMessage);
      throw err;
    }
  };

  const updateAddonCategory = async (categoryId: string, categoryData: Partial<AddonCategory>) => {
    try {
      const { data, error } = await supabase
        .from('addon_categories')
        .update(categoryData)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        throw error;
      }
      
      const mappedCategory: AddonCategory = {
        id: data.id,
        name: data.name || '',
        description: data.description || '',
        store_id: data.store_id || '',
        is_required: data.is_required || false,
        is_multiple: data.is_multiple || false,
        is_order_bump: data.is_order_bump || false,
        min_select: data.min_select || 1,
        max_select: data.max_select || 1,
        sort_order: data.sort_order || 0,
        is_active: data.is_active !== false,
        created_at: data.created_at || new Date().toISOString(),
        order_bump_description: data.order_bump_description || '',
        order_bump_image_url: data.order_bump_image_url || ''
      };

      setAddonCategories(prev => prev.map(category => 
        category.id === categoryId ? { ...category, ...mappedCategory } : category
      ));
      return mappedCategory;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar categoria de adicional';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteAddonCategory = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from('addon_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        throw error;
      }

      setAddonCategories(prev => prev.filter(category => category.id !== categoryId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar categoria de adicional';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    addonCategories,
    loading,
    error,
    addAddonCategory,
    updateAddonCategory,
    deleteAddonCategory,
    refetch: fetchAddonCategories
  };
};
