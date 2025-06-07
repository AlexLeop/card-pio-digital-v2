
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Minus, Plus, Clock, Star } from 'lucide-react';
import { Product, ProductAddon, PricingCalculation, Store } from '@/types';
import { useProductAddonsQuery } from '@/hooks/useProductAddonsQuery';
import { calculatePricing } from '@/utils/pricingCalculator';
import { SchedulingManager } from '@/utils/stockManager';

interface ProductModalProps {
  product: Product | null;
  store: Store;
  onClose: () => void;
  onAddToCart: (
    product: Product, 
    quantity: number, 
    addons: ProductAddon[], 
    notes?: string,
    scheduledFor?: string
  ) => void;
}

const ProductModal: React.FC<ProductModalProps> = ({
  product,
  store,
  onClose,
  onAddToCart
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<{ [key: string]: ProductAddon[] }>({});
  const [notes, setNotes] = useState('');
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [editingAddonId, setEditingAddonId] = useState<string | null>(null);

  const { productAddons, loading } = useProductAddonsQuery(product?.id || '');

  // Mover este código para aqui (dentro do componente)
  const isSchedulingAllowed = store?.allow_scheduling && product?.allow_same_day_scheduling;
  const cutoffTime = store?.same_day_cutoff_time || '14:00';

  const availableSlots = useMemo(() => {
    if (!isSchedulingAllowed) return [];
    
    const now = new Date();
    const today = format(now, 'yyyy-MM-dd');
    const currentTime = format(now, 'HH:mm');
    
    const canScheduleToday = currentTime < cutoffTime;
    
    const slots = [];
    const startDate = canScheduleToday ? now : addDays(now, 1);
    
    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      const dayName = format(date, 'EEEE').toLowerCase();
      const schedule = store?.weekly_schedule?.[dayName];
      
      if (schedule && !schedule.closed) {
        // Lógica para gerar slots
      }
    }
    
    return slots;
  }, [store, product, isSchedulingAllowed, cutoffTime]);

  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(`${dateStr}T${timeStr}`);
    return date.toLocaleString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  useEffect(() => {
    if (product && productAddons) {
      // Reset selected addons when product changes
      setSelectedAddons({});
      setQuantity(1);
      setNotes('');
      setScheduledFor('');
      setValidationErrors([]);
    }
  }, [product, productAddons]);

  if (!product) return null;

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
    if (!validateSelection()) {
      return;
    }

    const allSelectedAddons = Object.values(selectedAddons).flat();
    onAddToCart(product!, quantity, allSelectedAddons, notes || undefined, scheduledFor || undefined);
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
    <Dialog open={true} onOpenChange={onClose}>
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
          {/* Product Image */}
          {product?.image_url && (
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <img
                src={product?.image_url}
                alt={product?.name}
                className="w-full h-full object-cover"
              />
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
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="font-medium text-lg min-w-[3rem] text-center">
                {quantity}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Addons */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
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
                                onClick={() => updateAddonQuantity(addon.id, Math.max(0, (selectedAddons.find(a => a.id === addon.id)?.quantity || 0) - 1))}
                              >
                                -
                              </Button>
                              
                              {editingAddonId === addon.id ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max="10"
                                  value={selectedAddons.find(a => a.id === addon.id)?.quantity || 0}
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value) || 0;
                                    updateAddonQuantity(addon.id, Math.max(0, Math.min(10, value)));
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
                                    {selectedAddons.find(a => a.id === addon.id)?.quantity || 0}
                                  </span>
                                </div>
                              )}
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateAddonQuantity(addon.id, Math.min(10, (selectedAddons.find(a => a.id === addon.id)?.quantity || 0) + 1))}
                              >
                                +
                              </Button>
                            </div>
                          )}
                          
                          <span className="font-medium text-green-600">
                            {addon.price > 0 ? `+R$ ${addon.price.toFixed(2)}` : 'Grátis'}
                          </span>
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

          {product?.allow_same_day_scheduling && (
            <div className="space-y-2">
              <Label>Agendar para (opcional)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                <Button
                  type="button"
                  variant={!scheduledFor ? 'default' : 'outline'}
                  onClick={() => setScheduledFor('')}
                  className="text-sm"
                >
                  Agora
                </Button>
                {availableSlots.map((slot, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant={scheduledFor === `${slot.date}T${slot.time}` ? 'default' : 'outline'}
                    onClick={() => setScheduledFor(`${slot.date}T${slot.time}`)}
                    className="text-sm"
                  >
                    {formatDateTime(slot.date, slot.time)}
                  </Button>
                ))}
              </div>
              {availableSlots.length === 0 && (
                <p className="text-sm text-gray-500">
                  Nenhum horário disponível para agendamento
                </p>
              )}
            </div>
          )}

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
