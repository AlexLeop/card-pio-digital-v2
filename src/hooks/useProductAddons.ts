import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProductAddon } from '@/types';

export const useProductAddons = (addonCategoryId?: string) => {
  const [productAddons, setProductAddons] = useState<ProductAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProductAddons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('addon_items')
        .select('*')
        .eq('is_active', true);

      if (addonCategoryId) {
        query = query.eq('addon_category_id', addonCategoryId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }
      
      const mappedAddons: ProductAddon[] = (data || []).map(item => ({
        id: item.id,
        name: item.name,
        description: item.description || '',
        price: item.price || 0,
        is_available: item.is_active,
        sort_order: 0,
        addon_category_id: item.addon_category_id,
        created_at: item.created_at
      }));

      setProductAddons(mappedAddons);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar adicionais';
      setError(errorMessage);
      setProductAddons([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProductAddons();
  }, [addonCategoryId]);

  const addProductAddon = async (addonData: Omit<ProductAddon, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('addon_items')
        .insert([{
          name: addonData.name,
          description: addonData.description,
          price: addonData.price,
          addon_category_id: addonData.addon_category_id,
          is_active: addonData.is_available
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const mappedAddon: ProductAddon = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        price: data.price || 0,
        is_available: data.is_active,
        sort_order: 0,
        addon_category_id: data.addon_category_id,
        created_at: data.created_at
      };

      setProductAddons(prev => [...prev, mappedAddon]);
      return mappedAddon;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar adicional';
      setError(errorMessage);
      throw err;
    }
  };

  const updateProductAddon = async (addonId: string, addonData: Partial<ProductAddon>) => {
    try {
      const { data, error } = await supabase
        .from('addon_items')
        .update({
          name: addonData.name,
          description: addonData.description,
          price: addonData.price,
          addon_category_id: addonData.addon_category_id,
          is_active: addonData.is_available
        })
        .eq('id', addonId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      const mappedAddon: ProductAddon = {
        id: data.id,
        name: data.name,
        description: data.description || '',
        price: data.price || 0,
        is_available: data.is_active,
        sort_order: 0,
        addon_category_id: data.addon_category_id,
        created_at: data.created_at
      };

      setProductAddons(prev => prev.map(addon => 
        addon.id === addonId ? mappedAddon : addon
      ));
      return mappedAddon;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar adicional';
      setError(errorMessage);
      throw err;
    }
  };

  const deleteProductAddon = async (addonId: string) => {
    try {
      const { error } = await supabase
        .from('addon_items')
        .delete()
        .eq('id', addonId);

      if (error) {
        throw error;
      }

      setProductAddons(prev => prev.filter(addon => addon.id !== addonId));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar adicional';
      setError(errorMessage);
      throw err;
    }
  };

  return {
    productAddons,
    loading,
    error,
    addProductAddon,
    updateProductAddon,
    deleteProductAddon,
    refetch: fetchProductAddons
  };
};
