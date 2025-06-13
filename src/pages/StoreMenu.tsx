import React, { useEffect, useMemo } from 'react';
import { useSupabase } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';

const StoreMenu: React.FC = () => {
  const supabase = useSupabase();
  const [store, setStore] = React.useState(null);
  const [products, setProducts] = React.useState([]);
  const [categories, setCategories] = React.useState([]);
  const [selectedCategory, setSelectedCategory] = React.useState(null);

  // Carregar produtos e categorias
  useEffect(() => {
    const loadStoreData = async () => {
      if (!store?.id) return;

      try {
        // Carregar produtos
        const { data: productsData, error: productsError } = await supabase
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
          .eq('store_id', store.id)
          .order('categories(sort_order)', { ascending: true })
          .order('name', { ascending: true });

        if (productsError) throw productsError;
        setProducts(productsData || []);

        // Carregar categorias
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .eq('store_id', store.id)
          .order('sort_order', { ascending: true });

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);
      } catch (error) {
        console.error('Erro ao carregar dados da loja:', error);
        toast({
          title: "Erro",
          description: "Não foi possível carregar os produtos. Tente novamente.",
          variant: "destructive"
        });
      }
    };

    loadStoreData();
  }, [store?.id]); // Removido store do array de dependências

  // Filtrar produtos por categoria
  const filteredProducts = useMemo(() => {
    if (!selectedCategory) return products;
    return products.filter(product => product.category_id === selectedCategory);
  }, [products, selectedCategory]);

  // Agrupar produtos por categoria
  const productsByCategory = useMemo(() => {
    const grouped = products.reduce((acc, product) => {
      const categoryId = product.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    return grouped;
  }, [products]);

  return (
    <div>
      {/* Renderização do componente */}
    </div>
  );
};

export default StoreMenu; 