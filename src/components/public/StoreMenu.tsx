import React, { useState } from 'react';
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

  // Get featured products
  const featuredProducts = products.filter(product => 
    product.is_featured && product.is_available && product.is_active
  ).slice(0, 3);

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
    <div className="min-h-screen bg-gray-50">
      {/* Modern Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {store.logo_url && (
                <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-500 flex items-center justify-center">
                  <img 
                    src={store.logo_url} 
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center space-x-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Aberto</span>
                  </span>
                  <span>• Pedido mín. R$15,00</span>
                </div>
              </div>
            </div>
            
            {/* Cart Icon */}
            {cart.length > 0 && (
              <Button
                onClick={() => setShowCart(true)}
                variant="outline"
                size="sm"
                className="relative"
              >
                <ShoppingCart className="h-4 w-4" />
                <Badge className="absolute -top-2 -right-2 bg-orange-500 text-white min-w-[20px] h-5 rounded-full flex items-center justify-center text-xs">
                  {cartItemsCount}
                </Badge>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Categories Navigation */}
        <div className="mb-6">
          <div className="flex space-x-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap ${
                selectedCategory === 'all' 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Burgers
            </Button>
            {activeCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap ${
                  selectedCategory === category.id 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Products Section */}
        {featuredProducts.length > 0 && selectedCategory === 'all' && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Destaques</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {featuredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-all duration-200 cursor-pointer bg-white border border-gray-200"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative">
                    {product.image_url ? (
                      <div className="h-32 overflow-hidden rounded-t-lg">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                      </div>
                    ) : (
                      <div className="h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-t-lg flex items-center justify-center">
                        <div className="text-gray-400 text-center">
                          <div className="w-8 h-8 bg-gray-300 rounded-full mx-auto mb-1"></div>
                          <span className="text-xs">Sem imagem</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-3">
                    <h3 className="font-semibold text-gray-900 text-sm mb-1">{product.name}</h3>
                    <p className="text-xs text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-orange-500 font-bold text-sm">
                        R$ {(product.sale_price || product.price).toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products Section */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {selectedCategory === 'all' ? 'Burgers' : activeCategories.find(c => c.id === selectedCategory)?.name}
          </h2>
          
          {/* Products List */}
          <div className="space-y-4">
            {filteredProducts.map((product) => (
              <Card 
                key={product.id} 
                className="group hover:shadow-md transition-all duration-200 cursor-pointer bg-white border border-gray-200"
                onClick={() => setSelectedProduct(product)}
              >
                <CardContent className="p-4">
                  <div className="flex space-x-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {product.image_url ? (
                        <div className="w-20 h-20 overflow-hidden rounded-lg">
                          <img 
                            src={product.image_url} 
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                          <div className="text-gray-400 text-center">
                            <div className="w-6 h-6 bg-gray-300 rounded-full mx-auto"></div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 mb-1">{product.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{product.description}</p>
                      <div className="flex items-center justify-between">
                        <div>
                          {product.sale_price && product.sale_price < product.price ? (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500 line-through">
                                R$ {product.price.toFixed(2)}
                              </span>
                              <span className="text-orange-500 font-bold">
                                R$ {product.sale_price.toFixed(2)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-orange-500 font-bold">
                              R$ {product.price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
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
        </div>
      </div>

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
