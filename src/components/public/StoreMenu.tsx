import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Phone, ShoppingCart, Star, Search, Plus } from 'lucide-react';
import { Store, Product, Category, CartItem, ProductAddon } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import ProductModal from './ProductModal';
import CartModal from './CartModal';
import CheckoutModal from './CheckoutModal';
import { toast } from '@/hooks/use-toast';

interface StoreMenuProps {
  store: Store;
}

const StoreMenu: React.FC<StoreMenuProps> = ({ store }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);

  const { products, loading: productsLoading } = useProducts(store.id);
  const { categories, loading: categoriesLoading } = useCategories();

  // Filter products by category and search
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch && product.is_available && product.is_active;
  });

  // Get active categories that have products
  const activeCategories = categories.filter(cat => 
    cat.is_active && products.some(p => p.category_id === cat.id && p.is_available && p.is_active)
  );

  const handleAddToCart = (product: Product, quantity: number, addons: ProductAddon[], notes?: string, scheduledFor?: string) => {
    console.log('Adding to cart:', { product, quantity, addons, notes, scheduledFor });
    
    const cartItem: CartItem = {
      product,
      quantity,
      addons: addons.map(addon => ({
        ...addon,
        quantity: addon.quantity || 1
      })),
      notes,
      scheduled_for: scheduledFor
    };

    setCart(prev => {
      const existingIndex = prev.findIndex(item => 
        item.product.id === product.id && 
        JSON.stringify(item.addons) === JSON.stringify(cartItem.addons) &&
        item.notes === notes &&
        item.scheduled_for === scheduledFor
      );

      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [...prev, cartItem];
      }
    });

    toast({
      title: "Produto adicionado!",
      description: `${product.name} foi adicionado ao carrinho.`
    });
  };

  const updateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCart(prev => prev.map((item, i) => i === index ? { ...item, ...updates } : item));
  };

  const removeCartItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => {
    const itemPrice = item.product.sale_price || item.product.price;
    const addonsPrice = item.addons.reduce((addonSum, addon) => addonSum + (addon.price * (addon.quantity || 1)), 0);
    return sum + ((itemPrice + addonsPrice) * item.quantity);
  }, 0);

  const handleSuccessfulOrder = () => {
    clearCart();
    setShowCheckout(false);
    toast({
      title: "Pedido realizado!",
      description: "Seu pedido foi processado com sucesso."
    });
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white shadow-lg border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              {store.logo_url && (
                <img 
                  src={store.logo_url} 
                  alt={store.name}
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{store.name}</h1>
                {store.description && (
                  <p className="text-gray-600 mt-1">{store.description}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col space-y-2 text-sm text-gray-600">
              {store.address && (
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4" />
                  <span>{store.address}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4" />
                <span>{store.whatsapp}</span>
              </div>
              {store.opening_time && store.closing_time && (
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>{store.opening_time} às {store.closing_time}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Search and Categories */}
      <div className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-auto gap-2 h-auto p-2 bg-white/80 backdrop-blur-sm">
              <TabsTrigger 
                value="all" 
                className="data-[state=active]:bg-primary data-[state=active]:text-white"
              >
                Todos
              </TabsTrigger>
              {activeCategories.map((category) => (
                <TabsTrigger 
                  key={category.id} 
                  value={category.id}
                  className="data-[state=active]:bg-primary data-[state=active]:text-white whitespace-nowrap"
                >
                  {category.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={selectedCategory} className="mt-6">
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <Card 
                    key={product.id} 
                    className="group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer bg-white/80 backdrop-blur-sm border-0 shadow-lg"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div className="relative">
                      {product.image_url ? (
                        <div className="h-48 overflow-hidden rounded-t-lg">
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                          <div className="text-gray-400 text-center">
                            <div className="w-16 h-16 bg-gray-300 rounded-full mx-auto mb-2"></div>
                            <span className="text-sm">Sem imagem</span>
                          </div>
                        </div>
                      )}
                      
                      {product.is_featured && (
                        <Badge className="absolute top-2 right-2 bg-yellow-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Destaque
                        </Badge>
                      )}

                      {product.sale_price && product.sale_price < product.price && (
                        <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                          Promoção
                        </Badge>
                      )}
                    </div>

                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                        {product.name}
                      </CardTitle>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {product.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {product.description}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex flex-col">
                          {product.sale_price && product.sale_price < product.price ? (
                            <>
                              <span className="text-sm text-gray-500 line-through">
                                R$ {product.price.toFixed(2)}
                              </span>
                              <span className="text-xl font-bold text-green-600">
                                R$ {product.sale_price.toFixed(2)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-gray-900">
                              R$ {product.price.toFixed(2)}
                            </span>
                          )}
                        </div>

                        <Button 
                          size="sm" 
                          className="bg-primary hover:bg-primary/90 text-white shadow-lg"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedProduct(product);
                          }}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Adicionar
                        </Button>
                      </div>

                      {product.preparation_time && product.preparation_time > 0 && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>{product.preparation_time} min</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>

              {filteredProducts.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 mb-4">
                    <ShoppingCart className="h-16 w-16 mx-auto" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Nenhum produto encontrado
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm ? 'Tente buscar por outro termo.' : 'Não há produtos disponíveis nesta categoria.'}
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Floating Cart Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 right-6 z-50">
          <Button
            onClick={() => setShowCart(true)}
            className="bg-primary hover:bg-primary/90 text-white shadow-2xl rounded-full w-16 h-16 flex items-center justify-center relative"
          >
            <ShoppingCart className="h-6 w-6" />
            <Badge className="absolute -top-2 -right-2 bg-red-500 text-white min-w-[24px] h-6 rounded-full flex items-center justify-center text-xs">
              {cartItemsCount}
            </Badge>
          </Button>
        </div>
      )}

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showCart && (
        <CartModal
          cart={cart}
          onClose={() => setShowCart(false)}
          onUpdateItem={updateCartItem}
          onRemoveItem={removeCartItem}
          onClearCart={clearCart}
          onCheckout={() => {
            setShowCart(false);
            setShowCheckout(true);
          }}
        />
      )}

      {showCheckout && (
        <CheckoutModal
          cart={cart}
          store={store}
          onClose={() => setShowCheckout(false)}
          onSuccess={handleSuccessfulOrder}
        />
      )}
    </div>
  );
};

export default StoreMenu;
