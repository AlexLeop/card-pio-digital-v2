
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Product, ProductImage } from '@/types';

export const useProducts = (storeId?: string, categoryId?: string) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (
            id,
            name
          )
        `)
        .order('name', { ascending: true });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Mapear produtos para incluir as imagens corretamente
      const mappedProducts: Product[] = (data || []).map(product => ({
        ...product,
        name: product.name || '',
        price: product.price || 0,
        store_id: product.store_id || (storeId || ''),
        category_id: product.category_id || '',
        is_featured: product.is_featured || false,
        is_available: product.is_available || true,
        is_active: product.is_active || true,
        has_addons: product.has_addons || false,
        created_at: product.created_at || new Date().toISOString(),
        images: product.image_url ? [{
          url: product.image_url,
          is_primary: true,
          order: 0
        }] : []
      }));

      setProducts(mappedProducts);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [storeId, categoryId]);

  const addProduct = async (productData: Omit<Product, 'id' | 'created_at'>) => {
    try {
      const dataForDB = {
        ...productData,
        image_url: productData.images && productData.images.length > 0 ? productData.images[0].url : null,
        images: undefined // Remove images property for DB insertion
      };

      const { data, error } = await supabase
        .from('products')
        .insert(dataForDB)
        .select()
        .single();

      if (error) throw error;

      const mappedProduct: Product = {
        ...data,
        name: data.name || '',
        price: data.price || 0,
        store_id: data.store_id || '',
        category_id: data.category_id || '',
        is_featured: data.is_featured || false,
        is_available: data.is_available || true,
        is_active: data.is_active || true,
        has_addons: data.has_addons || false,
        max_included_quantity: data.max_included_quantity || undefined,
        created_at: data.created_at || new Date().toISOString(),
        images: data.image_url ? [{
          url: data.image_url,
          is_primary: true,
          order: 0
        }] : []
      };

      setProducts(prev => [...prev, mappedProduct]);
      return mappedProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar produto');
      throw err;
    }
  };

  const updateProduct = async (productId: string, productData: Partial<Product>) => {
    try {
      const dataForDB = {
        ...productData,
        image_url: productData.images && productData.images.length > 0 ? productData.images[0].url : null,
        images: undefined // Remove images property for DB update
      };

      const { data, error } = await supabase
        .from('products')
        .update(dataForDB)
        .eq('id', productId)
        .select()
        .single();

      if (error) throw error;

      const mappedProduct: Product = {
        ...data,
        name: data.name || '',
        price: data.price || 0,
        store_id: data.store_id || '',
        category_id: data.category_id || '',
        is_featured: data.is_featured || false,
        is_available: data.is_available || true,
        is_active: data.is_active || true,
        has_addons: data.has_addons || false,
        max_included_quantity: data.max_included_quantity || undefined,
        created_at: data.created_at || new Date().toISOString(),
        images: data.image_url ? [{
          url: data.image_url,
          is_primary: true,
          order: 0
        }] : []
      };

      setProducts(prev => prev.map(product => 
        product.id === productId ? { ...product, ...mappedProduct } : product
      ));
      return mappedProduct;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar produto');
      throw err;
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(prev => prev.filter(product => product.id !== productId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar produto');
      throw err;
    }
  };

  return {
    products,
    loading,
    error,
    addProduct,
    updateProduct,
    deleteProduct,
    refetch: fetchProducts
  };
};
