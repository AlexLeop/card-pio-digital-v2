import React, { useEffect, useMemo } from 'react';
import { useSupabase } from '@supabase/auth-helpers-react';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';

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
  }, [store?.id]);

  // Filtrar produtos por categoria
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    if (!selectedCategory) return products;
    return products.filter(product => product.category_id === selectedCategory);
  }, [products, selectedCategory]);

  // Agrupar produtos por categoria
  const productsByCategory = useMemo(() => {
    if (!Array.isArray(products)) return {};
    
    const grouped = products.reduce((acc, product) => {
      if (!product || !product.category_id) return acc;
      
      const categoryId = product.category_id;
      if (!acc[categoryId]) {
        acc[categoryId] = [];
      }
      acc[categoryId].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    return grouped;
  }, [products]);

  // Ordenar categorias
  const sortedCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    return [...categories].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  }, [categories]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Categorias */}
      <div className="mb-8">
        <div className="flex space-x-2 overflow-x-auto pb-2">
          <Button
            variant={!selectedCategory ? 'default' : 'outline'}
            onClick={() => setSelectedCategory(null)}
            className="whitespace-nowrap"
          >
            Todos
          </Button>
          {sortedCategories.map(category => (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              onClick={() => setSelectedCategory(category.id)}
              className="whitespace-nowrap"
            >
              {category.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Produtos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </div>
    </div>
  );
};

export default StoreMenu; 