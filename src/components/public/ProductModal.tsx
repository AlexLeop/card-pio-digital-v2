import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Clock, Star, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays } from 'date-fns';
import { Product, ProductAddon, PricingCalculation, Store } from '@/types';
import { useProductAddonsQuery } from '@/hooks/useProductAddonsQuery';
import { calculatePricing } from '@/utils/pricingCalculator';
import { SchedulingManager } from '@/utils/stockManager';
import { useStockManager } from '@/hooks/useStockManager';
import { useProducts } from '@/hooks/useProducts';
import { toast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

// Remover estas props e estados
interface ProductModalProps {
  product: Product | null;
  store: Store;
  onClose: () => void;
  onAddToCart: (
    product: Product, 
    quantity: number, 
    addons: ProductAddon[], 
    notes?: string
  ) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, store, onAddToCart, onClose }) => {
  // Verificação mais rigorosa - não renderizar se produto não existe ou não tem ID
  if (!product || !product.id) {
    return null;
  }

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: ProductAddon[] }>({});
  const [notes, setNotes] = useState('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Remover estas linhas duplicadas:
  // // Image gallery state
  // const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // Adicionar a função formatDateTime
  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr + 'T' + timeStr);
    return date.toLocaleDateString('pt-BR') + ' às ' + timeStr;
  };
  
  // Process product images with validation
  const getValidImageUrl = (url: string): string => {
    if (!url || url.trim() === '') return '/placeholder.svg';
    
    try {
      // Handle blob URLs that might be invalid
      if (url.startsWith('blob:')) {
        // Check if blob URL is still valid
        fetch(url, { method: 'HEAD' })
          .catch(() => '/placeholder.svg');
        return url;
      }
      
      // Validate other URLs
      new URL(url);
      return url;
    } catch {
      return '/placeholder.svg';
    }
  };
  
  // Create productImages array from product data
  const productImages = useMemo(() => {
    if (!product) return [];
    
    const images: ProductImage[] = [];
    
    // Add additional images if they exist
    if (product.images && Array.isArray(product.images)) {
      const additionalImages = product.images
        .map(img => ({
          ...img,
          url: getValidImageUrl(img.url)
        }))
        .sort((a, b) => a.display_order - b.display_order);
      
      images.push(...additionalImages);
    }
    
    // Add main image if exists and not already in the array
    if (product.image_url && !images.some(img => img.url === product.image_url)) {
      images.push({
        url: getValidImageUrl(product.image_url),
        is_primary: true,
        display_order: 0
      });
    }
    
    // Remove duplicates based on URL
    const uniqueImages = images.filter((img, index, self) => 
      index === self.findIndex(i => i.url === img.url)
    );
    
    return uniqueImages;
  }, [product]);
  
  // Image navigation functions
  const nextImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev + 1) % productImages.length);
    }
  };
  
  const prevImage = () => {
    if (productImages.length > 1) {
      setCurrentImageIndex((prev) => (prev - 1 + productImages.length) % productImages.length);
    }
  };
  
  // Reset image index when product changes
  useEffect(() => {
    setCurrentImageIndex(0);
  }, [product?.id]);

  // Integração com sistema de estoque
  const { products } = useProducts(store.id);
  const { getAvailableStock, checkAvailability } = useStockManager(products);
  
  // Só chamar o hook se product.id existir
  const { productAddons, loading, error } = useProductAddonsQuery(product.id, store.id);
  
  // Remover ou condicionar logs para desenvolvimento apenas
  if (process.env.NODE_ENV === 'development') {
    console.log('ProductModal Debug:', {
      productId: product.id,
      storeId: store.id,
      productAddons,
      loading,
      error,
      addonsLength: productAddons?.length
    });
  }
  
  // Calcular estoque disponível com verificação tripla
  const availableStock = useMemo(() => {
    if (!product || !product.id || !getAvailableStock) {
      return 0;
    }
    try {
      return getAvailableStock(product.id);
    } catch (error) {
      console.error('Erro ao obter estoque:', error);
      return 0;
    }
  }, [product, getAvailableStock]);
  
  const maxQuantity = product?.daily_stock ? Math.min(availableStock, 10) : 10;
  const isLowStock = product?.daily_stock && availableStock <= (product.daily_stock * 0.2);
  const isOutOfStock = product?.daily_stock && availableStock <= 0;

  // Validação de quantidade baseada no estoque
  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;
    
    if (product.daily_stock) {
      if (newQuantity > availableStock) {
        toast({
          title: "Quantidade indisponível",
          description: `Apenas ${availableStock} unidades disponíveis.`,
          variant: "destructive"
        });
        setQuantity(availableStock);
        return;
      }
    }
    
    setQuantity(Math.max(1, Math.min(newQuantity, maxQuantity)));
  };

  
  // Mover este código para aqui (dentro do componente)
  const isSchedulingAllowed = store?.allow_scheduling && product?.allow_same_day_scheduling;
  
  // Fix the availableSlots useMemo to pass the correct parameter
  const availableSlots = useMemo(() => {
    if (!store?.allow_scheduling || !product?.allow_same_day_scheduling) return [];
    
    // Create a CartItem array from the current product for scheduling validation
    const cartItems = product ? [{
      id: `temp-${product.id}`,
      product: product,
      quantity: quantity,
      addons: [],
      notes: '',
      price: product.price
    }] : [];
    
    // Pass cartItems array instead of single product
    return SchedulingManager.getAvailableSlots(store, 'delivery', 7, cartItems);
  }, [store, product, quantity]);
  
  // Make sure the useEffect doesn't reference initialScheduledFor
  useEffect(() => {
    if (product && productAddons) {
      // Reset selected addons when product changes
      setSelectedAddons({});
      setQuantity(1);
      setNotes('');
      setValidationErrors([]);
    }
  }, [product, productAddons]);

  const handleAddonChange = (categoryId: string, addon: any, isSelected: boolean) => {
    const category = productAddons?.find(cat => cat.id === categoryId);
    if (!category) return;

    // Convert AddonItem to ProductAddon with all required properties
    const productAddon: ProductAddon = {
      id: addon.id,
      name: addon.name,
      description: addon.description,
      price: addon.price,
      is_available: addon.is_active,
      sort_order: 0,
      created_at: new Date().toISOString(),
      quantity: addon.quantity || 1
    };

    setSelectedAddons(prev => {
      const currentAddons = prev[categoryId] || [];
      
      if (isSelected) {
        if (category.is_multiple) {
          // Multiple selection - add if not at max limit
          if (category.max_select && currentAddons.length >= category.max_select) {
            return prev;
          }
          return {
            ...prev,
            [categoryId]: [...currentAddons, productAddon]
          };
        } else {
          // Single selection - replace
          return {
            ...prev,
            [categoryId]: [productAddon]
          };
        }
      } else {
        // Remove addon
        return {
          ...prev,
          [categoryId]: currentAddons.filter(a => a.id !== addon.id)
        };
      }
    });
  };

  const updateAddonQuantity = (categoryId: string, addonId: string, newQuantity: number) => {
    if (newQuantity < 1) return;

    setSelectedAddons(prev => ({
      ...prev,
      [categoryId]: (prev[categoryId] || []).map(addon =>
        addon.id === addonId ? { ...addon, quantity: newQuantity } : addon
      )
    }));
  };

  const validateSelection = (): boolean => {
    const errors: string[] = [];

    productAddons?.forEach(category => {
      const selectedInCategory = selectedAddons[category.id] || [];
      
      if (category.is_required && selectedInCategory.length === 0) {
        errors.push(`${category.name} é obrigatório`);
      }
      
      if (category.min_select && selectedInCategory.length < category.min_select) {
        errors.push(`${category.name} requer pelo menos ${category.min_select} seleção(ões)`);
      }
      
      if (category.max_select && selectedInCategory.length > category.max_select) {
        errors.push(`${category.name} permite no máximo ${category.max_select} seleção(ões)`);
      }
    });

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleAddToCart = () => {
    // Verificar se o produto existe
    if (!product) {
      toast({
        title: "Erro",
        description: "Produto não encontrado. Tente novamente.",
        variant: "destructive"
      });
      return;
    }

    if (!validateSelection()) {
      return;
    }

    const allSelectedAddons = Object.values(selectedAddons).flat();
    onAddToCart(product, quantity, allSelectedAddons, notes || undefined);
    onClose();
  };

  const isAddonSelected = (categoryId: string, addonId: string) => {
    return selectedAddons[categoryId]?.some(addon => addon.id === addonId) || false;
  };

  const getAddonQuantity = (categoryId: string, addonId: string) => {
    const addon = selectedAddons[categoryId]?.find(addon => addon.id === addonId);
    return addon?.quantity || 0;
  };

  // Calculate pricing
  const allSelectedAddons = Object.values(selectedAddons).flat();
  const pricing: PricingCalculation = calculatePricing(product!, quantity, allSelectedAddons);

  const productPrice = product?.sale_price || product?.price;

  return (
    <Dialog open={!!product} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{product?.name}</span>
            {product?.is_featured && (
              <Badge className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                Destaque
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Images Gallery */}
          {productImages.length > 0 && (
            <div className="relative">
              <div className="aspect-video w-full overflow-hidden rounded-lg">
                <img
                  src={productImages[currentImageIndex]?.url}
                  alt={`${product?.name} - Imagem ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/placeholder.svg';
                  }}
                />
              </div>
              
              {/* Navigation arrows - only show if more than 1 image */}
              {productImages.length > 1 && (
                <>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/80 hover:bg-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </>
              )}
              
              {/* Image indicators - only show if more than 1 image */}
              {productImages.length > 1 && (
                <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {productImages.map((_, index) => (
                    <button
                      key={index}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex 
                          ? 'bg-white' 
                          : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              )}
              
              {/* Image counter */}
              {productImages.length > 1 && (
                <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  {currentImageIndex + 1} / {productImages.length}
                </div>
              )}
            </div>
          )}

          {/* Thumbnail strip - only show if more than 1 image */}
          {productImages.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-2">
              {productImages.map((image, index) => (
                <button
                  key={index}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                    index === currentImageIndex 
                      ? 'border-blue-500' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img
                    src={image.url}
                    alt={`${product?.name} - Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Product Info */}
          <div className="space-y-4">
            {product?.description && (
              <p className="text-gray-600">{product?.description}</p>
            )}

            {/* Price Display */}
            <div className="flex items-center space-x-2">
              {product?.sale_price ? (
                <>
                  <span className="text-2xl font-bold text-green-600">
                    R$ {product?.sale_price.toFixed(2)}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    R$ {product?.price.toFixed(2)}
                  </span>
                  <Badge variant="destructive">Promoção</Badge>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900">
                  R$ {product?.price.toFixed(2)}
                </span>
              )}
            </div>

            {/* Preparation Time */}
            {product?.preparation_time && (
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                <span>Tempo de preparo: {product?.preparation_time} min</span>
              </div>
            )}

            {/* Ingredients */}
            {product?.ingredients && product?.ingredients.length > 0 && (
              <div>
                <Label className="text-sm font-medium">Ingredientes:</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {product?.ingredients.join(', ')}
                </p>
              </div>
            )}

            {/* Allergens */}
            {product?.allergens && product?.allergens.length > 0 && (
              <div>
                <Label className="text-sm font-medium text-red-600">Alergênicos:</Label>
                <p className="text-sm text-red-600 mt-1">
                  {product?.allergens.join(', ')}
                </p>
              </div>
            )}
          </div>

          {/* Quantity Selector */}
          <div className="space-y-2">
            <Label>Quantidade</Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 1;
                  handleQuantityChange(value);
                }}
                className="w-16 text-center"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuantityChange(quantity + 1)}
                disabled={quantity >= maxQuantity}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Addons */}
          {loading ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-sm text-gray-600">Carregando adicionais...</span>
              </div>
            </div>
          ) : error ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mr-2" />
                  <p className="text-sm text-yellow-800">
                    Não foi possível carregar os adicionais. Você ainda pode fazer o pedido sem adicionais.
                  </p>
                </div>
                <button 
                  onClick={() => window.location.reload()} 
                  className="mt-2 text-sm text-yellow-600 underline hover:text-yellow-800"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          ) : productAddons && productAddons.length > 0 ? (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Personalize seu pedido</h3>
              
              {productAddons.map((category) => (
                <div key={category.id} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium">{category.name}</h4>
                      {category.description && (
                        <p className="text-sm text-gray-600">{category.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      {category.is_required && (
                        <Badge variant="destructive" className="text-xs">
                          Obrigatório
                        </Badge>
                      )}
                      {category.is_multiple && (
                        <Badge variant="secondary" className="text-xs">
                          Múltipla escolha
                        </Badge>
                      )}
                    </div>
                  </div>

                  {(category.min_select || category.max_select) && (
                    <p className="text-xs text-gray-500">
                      {category.min_select && category.max_select ? (
                        `Selecione ${category.min_select} a ${category.max_select} opções`
                      ) : category.min_select ? (
                        `Mínimo ${category.min_select} opções`
                      ) : (
                        `Máximo ${category.max_select} opções`
                      )}
                    </p>
                  )}

                  <div className="space-y-3">
                    {category.addon_items?.map((addon) => (
                      <div key={addon.id} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1">
                          {category.is_multiple ? (
                            <Checkbox
                              checked={isAddonSelected(category.id, addon.id)}
                              onCheckedChange={(checked) =>
                                handleAddonChange(category.id, addon, checked as boolean)
                              }
                            />
                          ) : (
                            <RadioGroup
                              value={selectedAddons[category.id]?.[0]?.id || ''}
                              onValueChange={(value) => {
                                // Clear current selection and add new one
                                if (value) {
                                  const productAddon: ProductAddon = {
                                    id: addon.id,
                                    name: addon.name,
                                    description: addon.description,
                                    price: addon.price,
                                    is_available: addon.is_active,
                                    sort_order: 0,
                                    created_at: new Date().toISOString(),
                                    quantity: 1
                                  };
                                  setSelectedAddons(prev => ({
                                    ...prev,
                                    [category.id]: [productAddon]
                                  }));
                                } else {
                                  setSelectedAddons(prev => ({
                                    ...prev,
                                    [category.id]: []
                                  }));
                                }
                              }}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value={addon.id} id={addon.id} />
                              </div>
                            </RadioGroup>
                          )}
                          
                          <div className="flex-1">
                            <Label htmlFor={addon.id} className="font-medium cursor-pointer">
                              {addon.name}
                            </Label>
                            {addon.description && (
                              <p className="text-sm text-gray-600">{addon.description}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          {isAddonSelected(category.id, addon.id) && category.is_multiple && (
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateAddonQuantity(category.id, addon.id, Math.max(0, getAddonQuantity(category.id, addon.id) - 1))}
                              >
                                -
                              </Button>
                              
                              {editingAddonId === addon.id ? (
                                <Input
                                  type="number"
                                  min="0"
                                  value={getAddonQuantity(category.id, addon.id)}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    updateAddonQuantity(category.id, addon.id, Math.max(0, value));
                                  }}
                                  onBlur={() => setEditingAddonId(null)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      setEditingAddonId(null);
                                    }
                                  }}
                                  className="w-16 text-center"
                                  autoFocus
                                />
                              ) : (
                                <div 
                                  className="w-16 h-9 flex items-center justify-center border border-gray-300 rounded cursor-pointer hover:bg-gray-50 transition-colors"
                                  onClick={() => setEditingAddonId(addon.id)}
                                >
                                  <span className="text-sm font-medium">
                                    {getAddonQuantity(category.id, addon.id)}
                                  </span>
                                </div>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateAddonQuantity(category.id, addon.id, getAddonQuantity(category.id, addon.id) + 1)}
                              >
                                +
                              </Button>
                            </div>
                          )}
                          
                          <div className="flex items-center space-x-3">
                            <span className="font-medium text-green-600">
                              {addon.price > 0 ? `+R$ ${addon.price.toFixed(2)}` : ''}
                            </span>
                            {addon.max_quantity && (
                              <span className="text-xs text-gray-500">
                                Máx: {addon.max_quantity}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-medium text-red-800 mb-2">Atenção:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea
              id="notes"
              placeholder="Alguma observação especial para este item?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[80px]"
            />
          </div>

          {/* Price Summary */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Produto ({quantity}x)</span>
              <span>R$ {pricing.productTotal.toFixed(2)}</span>
            </div>
            
            {pricing.addonsTotal > 0 && (
              <div className="flex justify-between text-sm">
                <span>Adicionais</span>
                <span>R$ {pricing.addonsTotal.toFixed(2)}</span>
              </div>
            )}
            
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-green-600">R$ {pricing.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button 
              onClick={handleAddToCart} 
              className="flex-1"
              disabled={validationErrors.length > 0}
            >
              Adicionar ao Carrinho
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductModal;
