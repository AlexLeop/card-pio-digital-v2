
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

export const useProductAddonsQuery = (productId: string, storeId?: string) => {
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
  }, [productId, storeId]); // Adicionar storeId como dependência

  const fetchProductAddons = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Adicionar timeout para evitar travamentos em mobile
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout ao carregar adicionais')), 10000)
      );
      
      const fetchPromise = (async () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('Fetching addons for product:', productId, 'store:', storeId);
        }
        
        // Get addon categories associated with this product
        const { data: associations, error: associationsError } = await supabase
          .from('product_addon_categories')
          .select('addon_category_id')
          .eq('product_id', productId);
    
        if (associationsError) {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching addon associations:', associationsError);
          }
          throw associationsError;
        }
    
        if (process.env.NODE_ENV === 'development') {
          console.log('Associations found:', associations);
        }
    
        if (!associations || associations.length === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.log('No addon associations found for product:', productId);
          }
          setProductAddons([]);
          setLoading(false);
          return;
        }

        const categoryIds = associations.map(a => a.addon_category_id);

        // Get addon categories with their items, filtering by store if provided
        let query = supabase
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
    
        // Adicionar filtro por loja se fornecido
        if (storeId) {
          query = query.eq('store_id', storeId);
        }
    
        const { data: categories, error: categoriesError } = await query;
    
        if (categoriesError) {
          console.error('Error fetching addon categories:', categoriesError);
          throw categoriesError;
        }
        
        console.log('Categories found:', categories);
        
        // Filter out inactive addon items
        const filteredCategories = (categories || []).map(category => ({
          ...category,
          addon_items: (category.addon_items || []).filter(item => item.is_active)
        })).filter(category => (category.addon_items || []).length > 0);
    
        console.log('Filtered categories:', filteredCategories);
        setProductAddons(filteredCategories);
      })();
      
      await Promise.race([fetchPromise, timeoutPromise]);
      
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error in fetchProductAddons:', err);
      }
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
