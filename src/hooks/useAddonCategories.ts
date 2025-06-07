
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
      
      console.log('fetchAddonCategories called with storeId:', storeId);
      
      if (!storeId) {
        console.log('No storeId provided, skipping fetch');
        setAddonCategories([]);
        setLoading(false);
        return;
      }

      console.log('Executing supabase query for addon_categories with store_id:', storeId);
      
      const { data, error, count } = await supabase
        .from('addon_categories')
        .select('*', { count: 'exact' })
        .eq('store_id', storeId)
        .order('sort_order', { ascending: true });

      console.log('Supabase response:', { data, error, count });

      if (error) {
        console.error('Supabase error fetching addon categories:', error);
        throw error;
      }

      console.log('Raw addon categories data from DB:', data);
      console.log('Total count:', count);
      
      const mappedCategories: AddonCategory[] = (data || []).map(category => {
        console.log('Mapping category:', category);
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

      console.log('Final mapped addon categories:', mappedCategories);
      setAddonCategories(mappedCategories);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar categorias de adicionais';
      console.error('Addon categories fetch error:', errorMessage);
      setError(errorMessage);
      setAddonCategories([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useAddonCategories useEffect triggered with storeId:', storeId);
    fetchAddonCategories();
  }, [storeId]);

  const addAddonCategory = async (categoryData: Omit<AddonCategory, 'id' | 'created_at'>) => {
    try {
      console.log('Adding addon category:', categoryData);
      
      const { data, error } = await supabase
        .from('addon_categories')
        .insert([categoryData])
        .select()
        .single();

      if (error) {
        console.error('Error adding addon category:', error);
        throw error;
      }

      console.log('Added addon category:', data);
      
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
      console.error('Add addon category error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const updateAddonCategory = async (categoryId: string, categoryData: Partial<AddonCategory>) => {
    try {
      console.log('Updating addon category:', categoryId, categoryData);
      
      const { data, error } = await supabase
        .from('addon_categories')
        .update(categoryData)
        .eq('id', categoryId)
        .select()
        .single();

      if (error) {
        console.error('Error updating addon category:', error);
        throw error;
      }

      console.log('Updated addon category:', data);
      
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
      console.error('Update addon category error:', errorMessage);
      setError(errorMessage);
      throw err;
    }
  };

  const deleteAddonCategory = async (categoryId: string) => {
    try {
      console.log('Deleting addon category:', categoryId);
      
      const { error } = await supabase
        .from('addon_categories')
        .delete()
        .eq('id', categoryId);

      if (error) {
        console.error('Error deleting addon category:', error);
        throw error;
      }

      console.log('Deleted addon category:', categoryId);
      setAddonCategories(prev => prev.filter(category => category.id !== categoryId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar categoria de adicional';
      console.error('Delete addon category error:', errorMessage);
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
