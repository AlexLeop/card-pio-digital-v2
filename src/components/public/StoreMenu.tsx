import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, MapPin, Phone, ShoppingCart, Star, Search, Plus, AlertTriangle, Menu, Share2 } from 'lucide-react';
import { Store, Product, Category, CartItem, ProductAddon } from '@/types';
import { useProducts } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { supabase } from '@/integrations/supabase/client';
import ProductModal from './ProductModal';
import CartModal from './CartModal';
import CheckoutModal from './CheckoutModal';
import { toast } from '@/hooks/use-toast';
import { StockManager } from '@/utils/stockManager';
import { calculateOrderTotal } from '@/utils/orderService';
import { useStockManager } from '@/hooks/useStockManager';
import { isStoreOpen } from '@/utils/businessHours';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface StoreMenuProps {
  store: Store;
}

const StoreMenu: React.FC<StoreMenuProps> = ({ store }) => {
  console.log('StoreMenu - store.id:', store.id);
  
  const { products, loading: productsLoading } = useProducts(store.id);
  const { categories, loading: categoriesLoading } = useCategories(store.id);
  
  // Adicionar esta linha aqui, junto com os outros estados
  const storeIsOpen = isStoreOpen(store);
  
  // Estados necessários
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>('');
  
  // Adicionar estado para controlar o modal de busca
  const [showSearchModal, setShowSearchModal] = useState(false);
  
  // Função para compartilhar
  const handleShare = async () => {
    // Verificar se as APIs estão disponíveis
    if (navigator.share && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: store.name,
          text: `Confira o cardápio de ${store.name}`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
        // Fallback para clipboard
        fallbackCopyToClipboard();
      }
    } else {
      fallbackCopyToClipboard();
    }
  };

  const fallbackCopyToClipboard = () => {
    // Método compatível com Edge mais antigo
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      navigator.clipboard.writeText(window.location.href).then(() => {
        toast({
          title: "Link copiado!",
          description: "O link foi copiado para a área de transferência.",
        });
      }).catch(() => {
        // Fallback manual
        copyToClipboardFallback(window.location.href);
      });
    } else {
      // Fallback para navegadores mais antigos
      copyToClipboardFallback(window.location.href);
    }
  };

  const copyToClipboardFallback = (text: string) => {
    // Método compatível com Edge legado
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      toast({
        title: "Link copiado!",
        description: "O link foi copiado para a área de transferência.",
      });
    } catch (err) {
      toast({
        title: "Erro ao copiar",
        description: "Tente selecionar e copiar manualmente",
        variant: "destructive"
      });
    } finally {
      document.body.removeChild(textArea);
    }
  };
  
  console.log('StoreMenu - produtos carregados:', products?.length || 0);
  console.log('StoreMenu - categorias carregadas:', categories?.length || 0);
  
  const {
    products: stockManagedProducts,
    reduceStock,
    checkAvailability,
    getAvailableStock
  } = useStockManager(products || []);

  // Filter products by category and search com verificações de segurança
  const filteredProducts = useMemo(() => {
    if (!stockManagedProducts || !Array.isArray(stockManagedProducts)) {
      return [];
    }
    
    return stockManagedProducts.filter(product => {
      // Verificação de segurança para product
      if (!product || !product.id) {
        return false;
      }
      
      const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const hasStock = !product.daily_stock || checkAvailability(product.id, 1);
      const isBasicAvailable = product.is_available && product.is_active;
      
      return matchesCategory && matchesSearch && isBasicAvailable && hasStock;
    });
  }, [stockManagedProducts, selectedCategory, searchTerm, checkAvailability]);

  // Get featured products com verificações de segurança
  const featuredProducts = useMemo(() => {
    if (!stockManagedProducts || !Array.isArray(stockManagedProducts)) {
      return [];
    }
    
    return stockManagedProducts.filter(product => {
      if (!product || !product.id) {
        return false;
      }
      
      return product.is_featured && 
             product.is_available && 
             product.is_active &&
             (!product.daily_stock || checkAvailability(product.id, 1));
    }).slice(0, 10);
  }, [stockManagedProducts, checkAvailability]);

  // Get active categories that have products com verificações de segurança
  const activeCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories) || !stockManagedProducts || !Array.isArray(stockManagedProducts)) {
      return [];
    }
    
    return categories.filter(cat => {
      if (!cat || !cat.id) {
        return false;
      }
      
      return cat.is_active && stockManagedProducts.some(p => {
        if (!p || !p.id) {
          return false;
        }
        
        return p.category_id === cat.id && 
               p.is_available && 
               p.is_active &&
               (!p.daily_stock || checkAvailability(p.id, 1));
      });
    });
  }, [categories, stockManagedProducts, checkAvailability]);

  // Função para adicionar ao carrinho com validações
  const handleAddToCart = (item: CartItem) => {
    if (!item || !item.product) return;

    setCart(prevCart => {
      // Verificar se o carrinho é um array
      if (!Array.isArray(prevCart)) {
        return [item];
      }

      // Verificar se o produto já existe no carrinho
      const existingItemIndex = prevCart.findIndex(
        cartItem => cartItem.product.id === item.product.id
      );

      if (existingItemIndex >= 0) {
        // Atualizar item existente
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + item.quantity
        };
        return updatedCart;
      } else {
        // Adicionar novo item
        return [...prevCart, item];
      }
    });
  };

  // Função para atualizar item do carrinho com validações
  const handleUpdateCartItem = (index: number, updates: Partial<CartItem>) => {
    setCart(prevCart => {
      if (!Array.isArray(prevCart)) return prevCart;

      const updatedCart = [...prevCart];
      updatedCart[index] = {
        ...updatedCart[index],
        ...updates
      };
      return updatedCart;
    });
  };

  // Função para remover item do carrinho com validações
  const handleRemoveCartItem = (index: number) => {
    setCart(prevCart => {
      if (!Array.isArray(prevCart)) return prevCart;

      return prevCart.filter((_, i) => i !== index);
    });
  };

  // Função para limpar carrinho com validações
  const handleClearCart = () => {
    setCart([]);
  };

  // Calcular totais com validações
  const cartItemsCount = useMemo(() => {
    if (!Array.isArray(cart)) return 0;
    return cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }, [cart]);

  const totals = useMemo(() => {
    if (!Array.isArray(cart)) return { subtotal: 0, total: 0 };
    return calculateOrderTotal(cart, 0);
  }, [cart]);

  const cartTotal = totals.total;

  // Função para finalizar pedido com validações
  const handleSuccessfulOrder = () => {
    handleClearCart();
    setShowCheckout(false);
    toast({
      title: "Pedido realizado!",
      description: "Seu pedido foi processado com sucesso."
    });
  };

  // Função para lidar com a busca
  const handleSearch = (term: string) => {
    setSearchTerm(term);
    setShowSearchModal(true);
  };

  // Função para fechar o modal de busca
  const handleCloseSearch = () => {
    setShowSearchModal(false);
    setSearchTerm('');
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
      {/* Header exatamente igual à imagem */}
      <div className="bg-orange-500 text-white sticky top-0 z-40 shadow-lg">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {/* Logo da loja em círculo preto como na imagem */}
              <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center overflow-hidden">
                {store.logo_url ? (
                  <img 
                    src={store.logo_url} 
                    alt={store.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-orange-300 rounded-full"></div>
                )}
              </div>
              
              <div>
                <h1 className="text-lg font-bold">{store.name}</h1>
              </div>
            </div>
            
            {/* Ícones de busca, compartilhamento e carrinho */}
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={() => setShowSearchModal(true)}
              >
                <Search className="h-5 w-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                className="text-white hover:bg-white/20 p-2"
                onClick={handleShare}
              >
                <Share2 className="h-5 w-5" />
              </Button>
              
              {cart.length > 0 && (
                <Button
                  onClick={() => setShowCart(true)}
                  variant="ghost"
                  size="sm"
                  className="relative text-white hover:bg-white/20 p-2"
                >
                  <ShoppingCart className="h-5 w-5" />
                  <div className="absolute -top-1 -right-1 bg-white text-orange-500 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold">
                    {cartItemsCount}
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Informações da loja abaixo do header */}
      <div className="bg-white px-4 py-3 border-b">
        <div className="flex items-center space-x-4 text-sm">
          <span className="flex items-center space-x-1">
            <div className={`w-2 h-2 rounded-full ${
              storeIsOpen ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
            <span className="text-gray-700">
              {storeIsOpen ? 'Aberto' : 'Fechado'}
            </span>
          </span>
          {store.minimum_order && store.minimum_order > 0 && (
            <span className="text-gray-600">• Pedido mín. R$ {store.minimum_order.toFixed(2)}</span>
          )}
        </div>
      </div>

      <div className="px-4 py-4">
        {/* Categories Navigation com categorias do sistema */}
        <div className="mb-6">
          <div className="flex space-x-1 overflow-x-auto pb-2 scrollbar-hide">
            <Button
              variant={selectedCategory === 'all' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedCategory('all')}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                selectedCategory === 'all' 
                  ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                  : 'text-gray-600 hover:text-orange-500'
              }`}
            >
              Todos
            </Button>
            {activeCategories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium ${
                  selectedCategory === category.id 
                    ? 'bg-orange-500 hover:bg-orange-600 text-white' 
                    : 'text-gray-600 hover:text-orange-500'
                }`}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Products Section com formato horizontal */}
        {featuredProducts.length > 0 && selectedCategory === 'all' && (
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Destaques</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
              {featuredProducts.map((product) => (
                <Card 
                  key={product.id} 
                  className="group hover:shadow-lg transition-all duration-300 cursor-pointer bg-white border-0 shadow-sm overflow-hidden rounded-lg flex-shrink-0 w-48"
                  onClick={() => setSelectedProduct(product)}
                >
                  <div className="relative">
                    {product.image_url ? (
                      <div className="aspect-square overflow-hidden">
                        <img 
                          src={product.image_url} 
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.src = '/placeholder.svg';
                          }}
                        />
                      </div>
                    ) : (
                      <div className="aspect-square bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                        <div className="text-orange-400 text-center">
                          <div className="w-12 h-12 bg-orange-300 rounded-full mx-auto"></div>
                        </div>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-base text-gray-900 mb-2 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="text-orange-500 font-bold text-lg">
                      R$ {(product.sale_price || product.price).toFixed(2)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Products Section com layout igual à imagem */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            {selectedCategory === 'all' ? 'Todos os produtos' : activeCategories.find(c => c.id === selectedCategory)?.name || 'Produtos'}
          </h2>
          
          {filteredProducts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg font-medium">Nenhum produto encontrado</p>
                <p className="text-sm">Tente selecionar outra categoria ou aguarde o carregamento.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredProducts.map((product) => {
                const availableStock = getAvailableStock(product.id);
                const isLowStock = product.daily_stock && availableStock <= (product.daily_stock * 0.2);
                const isOutOfStock = product.daily_stock && availableStock <= 0;
                
                return (
                  <Card 
                    key={product.id} 
                    className={`group hover:shadow-md transition-all duration-200 cursor-pointer bg-white border-0 shadow-sm rounded-lg ${
                      isOutOfStock ? 'opacity-60' : ''
                    }`}
                    onClick={() => !isOutOfStock && setSelectedProduct(product)}
                  >
                    <CardContent className="p-4">
                      <div className="flex space-x-4">
                        {/* Product Image */}
                        <div className="flex-shrink-0 relative">
                          {product.image_url ? (
                            <div className="w-16 h-16 overflow-hidden rounded-lg">
                              <img 
                                src={product.image_url} 
                                alt={product.name}
                                className={`w-full h-full object-cover ${
                                  isOutOfStock ? 'grayscale' : ''
                                }`}
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
                              <div className="text-gray-400 text-center">
                                <div className="w-6 h-6 bg-gray-300 rounded-full mx-auto"></div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className={`font-semibold text-base mb-1 ${
                                isOutOfStock ? 'text-gray-500' : 'text-gray-900'
                              }`}>
                                {product.name}
                              </h3>
                              
                              <p className={`text-sm mb-2 line-clamp-2 ${
                                isOutOfStock ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {product.description}
                              </p>
                              
                              <div className="flex items-center justify-between">
                                <div>
                                  {product.sale_price && product.sale_price < product.price ? (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm text-gray-500 line-through">
                                        R$ {product.price.toFixed(2)}
                                      </span>
                                      <span className={`font-bold text-base ${
                                        isOutOfStock ? 'text-gray-400' : 'text-orange-500'
                                      }`}>
                                        R$ {product.sale_price.toFixed(2)}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className={`font-bold text-base ${
                                      isOutOfStock ? 'text-gray-400' : 'text-orange-500'
                                    }`}>
                                      R$ {product.price.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            {!isOutOfStock && (
                              <Button
                                size="sm"
                                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-8 h-8 p-0 ml-2"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedProduct(product);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          store={store}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
        />
      )}

      {showCart && (
        <CartModal
          cart={cart}
          store={store}
          onClose={() => setShowCart(false)}
          onUpdateItem={handleUpdateCartItem}
          onRemoveItem={handleRemoveCartItem}
          onClearCart={handleClearCart}
          onCheckout={(scheduledTime) => {
            setScheduledFor(scheduledTime || '');
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
          scheduledFor={scheduledFor}
        />
      )}

      {/* Modal de Busca */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Buscar Produtos</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Digite para buscar..."
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>
          <div className="mt-4 max-h-[300px] overflow-y-auto">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                Nenhum produto encontrado
              </div>
            ) : (
              <div className="space-y-2">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                    onClick={() => {
                      handleCloseSearch();
                      // Aqui você pode adicionar a lógica para mostrar os detalhes do produto
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden">
                        <img
                          src={product.image_url || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <h3 className="font-medium">{product.name}</h3>
                        <p className="text-sm text-gray-500">
                          R$ {product.price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Move these functions and components BEFORE the StoreMenu component definition
// Função para verificar se a URL da imagem é válida
const getValidImageUrl = (imageUrl: string | null): string | null => {
  if (!imageUrl) return null;
  
  // Verificar se é uma URL blob inválida
  if (imageUrl.startsWith('blob:') && !imageUrl.includes('supabase')) {
    console.warn('URL blob inválida detectada:', imageUrl);
    return null;
  }
  
  return imageUrl;
};

// Componente de imagem com fallback
const ProductImage = ({ src, alt, className, isOutOfStock = false }: {
  src: string | null;
  alt: string;
  className: string;
  isOutOfStock?: boolean;
}) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImageSrc(src);
    setHasError(false);
  }, [src]);

  const handleError = () => {
    if (!hasError) {
      console.error('Erro ao carregar imagem:', src);
      setImageSrc('/placeholder.svg');
      setHasError(true);
    }
  };

  return (
    <img 
      src={getValidImageUrl(imageSrc) || '/placeholder.svg'}
      alt={alt}
      className={`${className} ${isOutOfStock ? 'grayscale' : ''}`}
      onError={handleError}
    />
  );
};

export default StoreMenu;