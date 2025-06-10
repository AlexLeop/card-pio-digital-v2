
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AddonItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
}

interface AddonCategory {
  id: string;
  name: string;
  description?: string;
  is_required: boolean;
  is_multiple: boolean;
  min_select?: number;
  max_select?: number;
  is_active: boolean;
  addon_items?: AddonItem[];
}

export const useProductAddonsQuery = (productId: string) => {
  const [productAddons, setProductAddons] = useState<AddonCategory[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!productId) {
      setProductAddons(null);
      setLoading(false);
      return;
    }

    fetchProductAddons();
  }, [productId]);

  const fetchProductAddons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Get addon categories associated with this product
      const { data: associations, error: associationsError } = await supabase
        .from('product_addon_categories')
        .select('addon_category_id')
        .eq('product_id', productId);

      if (associationsError) {
        console.error('Error fetching addon associations:', associationsError);
        throw associationsError;
      }

      if (!associations || associations.length === 0) {
        setProductAddons([]);
        setLoading(false);
        return;
      }

      const categoryIds = associations.map(a => a.addon_category_id);

      // Get addon categories with their items
      const { data: categories, error: categoriesError } = await supabase
        .from('addon_categories')
        .select(`
          *,
          addon_items (
            id,
            name,
            description,
            price,
            is_active
          )
        `)
        .in('id', categoryIds)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (categoriesError) {
        console.error('Error fetching addon categories:', categoriesError);
        throw categoriesError;
      }
      
      // Filter out inactive addon items
      const filteredCategories = (categories || []).map(category => ({
        ...category,
        addon_items: (category.addon_items || []).filter(item => item.is_active)
      })).filter(category => (category.addon_items || []).length > 0);

      setProductAddons(filteredCategories);
    } catch (err) {
      console.error('Error in fetchProductAddons:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar adicionais do produto');
    } finally {
      setLoading(false);
    }
  };

  return {
    productAddons,
    loading,
    error,
    refetch: fetchProductAddons
  };
};
