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
import { Product, ProductAddon, PricingCalculation, Store, CartItem } from '@/types';
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
  onAddToCart: (item: CartItem) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({ product, store, onAddToCart, onClose }) => {
  // Verificação mais rigorosa - não renderizar se produto não existe ou não tem ID
  if (!product || !product.id) {
    return null;
  }

  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: ProductAddon[] }>({});
  const [productNotes, setProductNotes] = useState('');
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
        .sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
      
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
    
    // Remove duplicates based on URL and ensure display_order is set
    const uniqueImages = images
      .filter((img, index, self) => 
        index === self.findIndex(i => i.url === img.url)
      )
      .map(img => ({
        ...img,
        display_order: img.display_order || 0
      }));
    
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
      setProductNotes('');
      setValidationErrors([]);
    }
  }, [product, productAddons]);

  const handleAddonChange = (categoryId: string, addon: ProductAddon, isSelected: boolean) => {
    const category = productAddons?.find(cat => cat.id === categoryId);
    if (!category) return;

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
            [categoryId]: [...currentAddons, { ...addon, quantity: 1 }]
          };
        } else {
          // Single selection - replace
          return {
            ...prev,
            [categoryId]: [{ ...addon, quantity: 1 }]
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

  const isAddonSelected = (categoryId: string, addonId: string) => {
    return selectedAddons[categoryId]?.some(addon => addon.id === addonId) || false;
  };

  const getAddonQuantity = (categoryId: string, addonId: string) => {
    const addon = selectedAddons[categoryId]?.find(addon => addon.id === addonId);
    return addon?.quantity || 0;
  };

  const handleAddToCart = () => {
    if (!product) return;

    // Validar quantidade
    if (quantity < 1) {
      toast({
        title: "Quantidade inválida",
        description: "A quantidade deve ser maior que zero.",
        variant: "destructive"
      });
      return;
    }

    // Validar adicionais obrigatórios
    const requiredAddons = product.addons?.filter(addon => addon.required) || [];
    const selectedRequiredAddons = Object.values(selectedAddons).flat().filter(addon => 
      requiredAddons.some(req => req.id === addon.id)
    );

    if (requiredAddons.length > 0 && selectedRequiredAddons.length === 0) {
      toast({
        title: "Adicionais obrigatórios",
        description: "Selecione pelo menos um adicional obrigatório.",
        variant: "destructive"
      });
      return;
    }

    // Criar item do carrinho com observações
    const cartItem: CartItem = {
      product,
      quantity,
      addons: Object.values(selectedAddons).flat(),
      notes: productNotes?.trim() || '',
      scheduled_for: undefined
    };

    onAddToCart(cartItem);
    onClose();
  };

  // Calculate pricing
  const allSelectedAddons = Object.values(selectedAddons).flat();
  const pricing: PricingCalculation = calculatePricing(product!, quantity, allSelectedAddons);

  const productPrice = product?.sale_price || product?.price;

  // Filtrar adicionais disponíveis
  const availableAddons = useMemo(() => {
    if (!product?.addons) return [];
    return product.addons.filter(addon => addon.is_available);
  }, [product?.addons]);

  // Agrupar adicionais por categoria
  const addonsByCategory = useMemo(() => {
    if (!availableAddons) return {};
    
    return availableAddons.reduce((acc, addon) => {
      const category = addon.category || 'Sem categoria';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(addon);
      return acc;
    }, {} as Record<string, ProductAddon[]>);
  }, [availableAddons]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product?.name}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Imagem do produto */}
          <div className="relative aspect-square">
            <img
              src={product?.image_url || '/placeholder.svg'}
              alt={product?.name}
              className="object-cover w-full h-full rounded-lg"
            />
          </div>

          {/* Detalhes do produto */}
          <div className="space-y-4">
            <p className="text-gray-600">{product?.description}</p>
            <p className="text-2xl font-bold">
              R$ {product?.price.toFixed(2)}
            </p>

            {/* Adicionais */}
            {product?.addons && product.addons.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-semibold">Adicionais</h3>
                {product.addons.map((addon) => (
                  <div key={addon.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`addon-${addon.id}`}
                      checked={isAddonSelected(addon.category || 'Sem categoria', addon.id)}
                      onCheckedChange={(checked) => handleAddonChange(addon.category || 'Sem categoria', addon, checked as boolean)}
                    />
                    <Label htmlFor={`addon-${addon.id}`} className="flex-1">
                      <div className="flex justify-between">
                        <span>{addon.name}</span>
                        <span className="text-sm text-gray-500">
                          R$ {addon.price.toFixed(2)}
                        </span>
                      </div>
                    </Label>

                    {/* Controles de quantidade */}
                    {isAddonSelected(addon.category || 'Sem categoria', addon.id) && (
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateAddonQuantity(addon.category || 'Sem categoria', addon.id, Math.max(1, getAddonQuantity(addon.category || 'Sem categoria', addon.id) - 1))}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-8 text-center">{getAddonQuantity(addon.category || 'Sem categoria', addon.id)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateAddonQuantity(addon.category || 'Sem categoria', addon.id, getAddonQuantity(addon.category || 'Sem categoria', addon.id) + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Observações */}
            <div className="space-y-2">
              <Label htmlFor="notes">Observações</Label>
              <Textarea
                id="notes"
                value={productNotes}
                onChange={(e) => setProductNotes(e.target.value)}
                placeholder="Ex: Sem cebola, bem passado..."
                className="resize-none"
              />
            </div>

            {/* Quantidade */}
            <div className="flex items-center space-x-4">
              <Label>Quantidade</Label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQuantity(prev => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Botão de adicionar */}
            <Button
              onClick={handleAddToCart}
              className="w-full"
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
