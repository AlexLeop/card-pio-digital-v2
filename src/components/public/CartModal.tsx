import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Minus, Plus, Trash2, ShoppingCart, Clock } from 'lucide-react';
import { CartItem, Store } from '@/types';
import { calculateOrderTotal } from '@/utils/orderService';
import { SchedulingManager } from '@/utils/stockManager';

interface CartModalProps {
  cart: CartItem[];
  store: Store;
  onClose: () => void;
  onUpdateItem: (index: number, updates: Partial<CartItem>) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: (scheduledFor?: string) => void;
}

const CartModal: React.FC<CartModalProps> = ({
  cart,
  store,
  onClose,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onCheckout
}) => {
  const [scheduledFor, setScheduledFor] = useState<string>('');

  // Obter slots disponíveis
  const availableSlots = useMemo(() => {
    if (!store?.allow_scheduling || !Array.isArray(cart) || cart.length === 0) return [];
    return SchedulingManager.getAvailableSlots(store, 'delivery', 7, cart);
  }, [store, cart]);

  // Função para formatar data e hora
  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr + 'T' + timeStr);
    return date.toLocaleDateString('pt-BR') + ' às ' + timeStr;
  };

  // Usar a calculadora unificada
  const totals = useMemo(() => {
    if (!Array.isArray(cart) || cart.length === 0) return { subtotal: 0, total: 0 };
    return calculateOrderTotal(cart, 0);
  }, [cart]);

  const cartTotal = totals.total;

  const canProceed = () => {
    if (!Array.isArray(cart) || cart.length === 0) return false;
    const minimumOrder = store?.minimum_order || 0;
    return cartTotal >= minimumOrder;
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (!Array.isArray(cart)) return;
    
    if (newQuantity <= 0) {
      onRemoveItem(index);
    } else {
      onUpdateItem(index, { quantity: newQuantity });
    }
  };

  const handleCheckout = () => {
    if (!Array.isArray(cart)) return;
    onCheckout(scheduledFor || undefined);
  };

  if (!Array.isArray(cart) || cart.length === 0) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Carrinho</DialogTitle>
          </DialogHeader>
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Seu carrinho está vazio</p>
            <p className="text-sm text-gray-400">Adicione produtos para continuar</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de itens */}
          {cart.map((item, index) => (
            <div key={index} className="flex items-start space-x-4">
              {/* Imagem do produto */}
              <div className="w-16 h-16 flex-shrink-0">
                <img
                  src={item.product.image_url || '/placeholder.svg'}
                  alt={item.product.name}
                  className="w-full h-full object-cover rounded-lg"
                />
              </div>

              {/* Detalhes do produto */}
              <div className="flex-1">
                <h3 className="font-medium">{item.product.name}</h3>
                <p className="text-sm text-gray-500">
                  R$ {item.product.price.toFixed(2)}
                </p>
                
                {/* Adicionais */}
                {Array.isArray(item.addons) && item.addons.length > 0 && (
                  <div className="mt-1">
                    {item.addons.map((addon, addonIndex) => (
                      <p key={addonIndex} className="text-xs text-gray-500">
                        + {addon.name} (R$ {addon.price.toFixed(2)})
                        {addon.quantity && addon.quantity > 1 && ` x${addon.quantity}`}
                      </p>
                    ))}
                  </div>
                )}

                {/* Observações */}
                {item.notes && (
                  <p className="text-xs text-gray-500 mt-1">
                    Obs: {item.notes}
                  </p>
                )}
              </div>

              {/* Controles de quantidade */}
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(index, item.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="w-8 text-center">{item.quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateQuantity(index, item.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          {/* Seção de agendamento */}
          {store.allow_scheduling && cart.length > 0 && (
            <div className="space-y-2 border-t pt-4">
              <Label className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Agendar pedido para (opcional)
              </Label>
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

          {/* Total */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <span className="text-xl font-bold">Total:</span>
              <span className="text-2xl font-bold text-primary">
                R$ {cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Mostrar informação do pedido mínimo */}
            {store?.minimum_order && store.minimum_order > 0 && (
              <div className="text-xs text-gray-600 mb-3">
                {cartTotal < store.minimum_order ? (
                  <div className="text-red-600">
                    Pedido mínimo: R$ {store.minimum_order.toFixed(2)}
                    <br />
                    Faltam: R$ {(store.minimum_order - cartTotal).toFixed(2)}
                  </div>
                ) : (
                  <div className="text-green-600">
                    ✓ Pedido mínimo atingido
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClearCart}
                className="flex-1"
              >
                Limpar Carrinho
              </Button>
              <Button
                onClick={handleCheckout}
                disabled={!canProceed()}
                className={`flex-1 ${
                  !canProceed() 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {!canProceed() && store?.minimum_order && cartTotal < store.minimum_order
                  ? `Faltam R$ ${(store.minimum_order - cartTotal).toFixed(2)}`
                  : 'Finalizar Pedido'
                }
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
