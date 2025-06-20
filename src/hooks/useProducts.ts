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
      setError(null);
      
      console.log('Carregando produtos para storeId:', storeId);
      
      // Se não há storeId, não fazer a consulta
      if (!storeId) {
        console.log('StoreId vazio, não carregando produtos');
        setProducts([]);
        setLoading(false);
        return;
      }
      
      let query = supabase
        .from('products')
        .select(`
          *,
          categories(
            id,
            name,
            sort_order
          ),
          product_images(*)
        `)
        .eq('store_id', storeId)
        .order('categories(sort_order)', { ascending: true })
        .order('name', { ascending: true });
  
      if (categoryId) {
        query = query.eq('category_id', categoryId);
      }
  
      const { data, error } = await query;
  
      if (error) {
        console.error('Erro na consulta de produtos:', error);
        throw error;
      }
  
      const mappedProducts: Product[] = (data || []).map(product => ({
        id: product.id,
        name: product.name || '',
        description: product.description || '',
        price: product.price || 0,
        sale_price: product.sale_price || undefined,
        category_id: product.category_id || '',
        store_id: product.store_id || '',
        is_featured: product.is_featured || false,
        is_available: product.is_available !== false,
        is_active: product.is_active !== false,
        has_addons: product.has_addons || false,
        allow_same_day_scheduling: product.allow_same_day_scheduling || false,
        preparation_time: product.preparation_time || undefined,
        daily_stock: product.daily_stock || undefined,
        current_stock: product.current_stock || undefined,
        max_included_quantity: product.max_included_quantity || undefined,
        excess_unit_price: product.excess_unit_price || undefined,
        ingredients: product.ingredients || [],
        allergens: product.allergens || [],
        image_url: product.image_url || '',
        created_at: product.created_at || new Date().toISOString(),
        images: [
          // Incluir imagem principal se existir
          ...(product.image_url ? [{
            url: product.image_url,
            is_primary: true,
            display_order: 0
          }] : []),
          // Incluir imagens adicionais da tabela product_images
          ...(product.product_images || []).map((img: any) => ({
            url: img.url,
            is_primary: img.is_primary,
            display_order: img.display_order
          }))
        ]
      }));

      setProducts(mappedProducts);
    } catch (err) {
      console.error('Erro ao carregar produtos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [storeId, categoryId]);

  const addProduct = async (productData: Partial<Product>) => {
    try {
      console.log('Dados recebidos em addProduct:', productData);

      // Extrair selectedAddonCategories dos dados
      const { selectedAddonCategories, ...dataWithoutAddons } = productData;

      // Preparar dados para o banco
      const dataForDB = {
        ...dataWithoutAddons,
        store_id: productData.store_id,
        price: Number(productData.price),
        sale_price: productData.sale_price ? Number(productData.sale_price) : null,
        preparation_time: productData.preparation_time ? Number(productData.preparation_time) : null,
        daily_stock: productData.daily_stock ? Number(productData.daily_stock) : null,
        current_stock: productData.current_stock ? Number(productData.current_stock) : null,
        max_included_quantity: productData.max_included_quantity ? Number(productData.max_included_quantity) : null,
        excess_unit_price: productData.excess_unit_price ? Number(productData.excess_unit_price) : null,
        image_url: productData.images && productData.images.length > 0 ? productData.images[0].url : productData.image_url
      };

      // Remover a propriedade images antes de inserir no banco
      delete dataForDB.images;

      console.log('Dados preparados para inserção:', dataForDB);

      // Inserir produto
      const { data, error } = await supabase
        .from('products')
        .insert(dataForDB)
        .select()
        .single();

      if (error) {
        console.error('Erro ao inserir produto:', error);
        throw error;
      }

      console.log('Produto inserido com sucesso:', data);

      // Salvar imagens se existirem
      if (productData.images && productData.images.length > 0) {
        const productImages = productData.images.map((image, index) => ({
          product_id: data.id,
          image_url: image.url,
          is_primary: image.is_primary,
          display_order: index
        }));

        const { error: imagesError } = await supabase
          .from('product_images')
          .insert(productImages);

        if (imagesError) {
          console.error('Erro ao salvar imagens do produto:', imagesError);
          throw imagesError;
        }
      }

      return data;
    } catch (err) {
      console.error('💥 ERRO GERAL em addProduct:', err);
      throw err;
    }
  };

  const updateProduct = async (productId: string, productData: Partial<Product>) => {
    try {
      console.log('Atualizando produto:', productId, productData);
      
      // Extrair categorias de addon dos dados
      const { selectedAddonCategories, stock_quantity, min_stock, track_stock, ...dataForDB } = productData;
      
      // Preparar dados para o banco
      const finalData = {
        ...dataForDB,
        price: dataForDB.price !== undefined ? Number(dataForDB.price) : undefined,
        sale_price: dataForDB.sale_price !== undefined ? Number(dataForDB.sale_price) : null,
        preparation_time: dataForDB.preparation_time !== undefined ? Number(dataForDB.preparation_time) : undefined,
        daily_stock: dataForDB.daily_stock !== undefined ? Number(dataForDB.daily_stock) : null,
        current_stock: dataForDB.current_stock !== undefined ? Number(dataForDB.current_stock) : null,
        max_included_quantity: dataForDB.max_included_quantity !== undefined ? Number(dataForDB.max_included_quantity) : null,
        excess_unit_price: dataForDB.excess_unit_price !== undefined ? Number(dataForDB.excess_unit_price) : null,
        min_stock: dataForDB.min_stock !== undefined ? Number(dataForDB.min_stock) : null,
        track_stock: dataForDB.track_stock !== undefined ? Boolean(dataForDB.track_stock) : null,
        has_addons: selectedAddonCategories ? selectedAddonCategories.length > 0 : dataForDB.has_addons,
        // Atualizar image_url com a imagem principal do array
        image_url: dataForDB.images && dataForDB.images.length > 0 ? 
          (dataForDB.images.find(img => img.is_primary)?.url || dataForDB.images[0].url) : 
          dataForDB.image_url
      };
  
      // Remover campos undefined
      Object.keys(finalData).forEach(key => {
        if (finalData[key] === undefined) {
          delete finalData[key];
        }
      });
  
      // Remover a propriedade images antes de atualizar no banco
      delete finalData.images;
  
      console.log('Dados preparados para atualização:', finalData);
  
      // Atualizar produto
      const { data, error } = await supabase
        .from('products')
        .update(finalData)
        .eq('id', productId)
        .select()
        .single();
  
      if (error) {
        console.error('Erro ao atualizar produto:', error);
        throw error;
      }
  
      // Se houver categorias de addon selecionadas, atualizar as associações
      if (selectedAddonCategories !== undefined) {
        console.log('Atualizando associações de addon categories:', selectedAddonCategories);
        
        // Primeiro, remover todas as associações existentes
        const { error: deleteError } = await supabase
          .from('product_addon_categories')
          .delete()
          .eq('product_id', productId);
  
        if (deleteError) {
          console.error('Erro ao remover associações antigas:', deleteError);
          throw deleteError;
        }
  
        // Depois, criar novas associações
        if (selectedAddonCategories.length > 0) {
          const associations = selectedAddonCategories.map(categoryId => ({
            product_id: productId,
            addon_category_id: categoryId
          }));
  
          const { error: insertError } = await supabase
            .from('product_addon_categories')
            .insert(associations);
  
          if (insertError) {
            console.error('Erro ao criar novas associações:', insertError);
            throw insertError;
          }
        }
      }
  
      console.log('Produto atualizado com sucesso:', data);
      
      // Mapear dados retornados
      const mappedProduct: Product = {
        id: data.id,
        name: data.name || '',
        description: data.description || '',
        price: data.price || 0,
        sale_price: data.sale_price || undefined,
        category_id: data.category_id || '',
        store_id: data.store_id || '',
        is_featured: data.is_featured || false,
        is_available: data.is_available !== false,
        is_active: data.is_active !== false,
        has_addons: data.has_addons || false,
        allow_same_day_scheduling: data.allow_same_day_scheduling || false,
        preparation_time: data.preparation_time || undefined,
        daily_stock: data.daily_stock || undefined,
        current_stock: data.current_stock || undefined,
        max_included_quantity: data.max_included_quantity || undefined,
        excess_unit_price: data.excess_unit_price || undefined,
        ingredients: data.ingredients || [],
        allergens: data.allergens || [],
        image_url: data.image_url || '',
        created_at: data.created_at || new Date().toISOString(),
        images: data.image_url ? [{
          url: data.image_url,
          is_primary: true,
          display_order: 0
        }] : []
      };
  
      setProducts(prev => prev.map(product => 
        product.id === productId ? mappedProduct : product
      ));
      return mappedProduct;
    } catch (err) {
      console.error('Erro ao atualizar produto:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar produto';
      setError(errorMessage);
      throw new Error(errorMessage);
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

