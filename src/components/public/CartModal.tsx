
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { CartItem, Store } from '@/types';
import { calculateOrderTotal } from '@/utils/orderService';
import { format } from 'date-fns';
import { Clock } from 'lucide-react';
import { SchedulingManager } from '@/utils/stockManager';

interface CartModalProps {
  cart: CartItem[];
  store: Store;
  onClose: () => void;
  onUpdateItem: (index: number, updates: Partial<CartItem>) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  onScheduleOrder: (scheduledFor: string) => void; // Nova prop
}

const CartModal: React.FC<CartModalProps> = ({
  cart,
  store,
  onClose,
  onUpdateItem,
  onRemoveItem,
  onClearCart,
  onCheckout,
  onScheduleOrder
}) => {
  const [scheduledFor, setScheduledFor] = useState<string>('');

  // Obter slots disponíveis
  const availableSlots = useMemo(() => {
    if (!store.allow_scheduling || cart.length === 0) return [];
    return SchedulingManager.getAvailableSlots(store, 'delivery', 7, cart);
  }, [store, cart]);

  // Função para formatar data e hora
  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr + 'T' + timeStr);
    return date.toLocaleDateString('pt-BR') + ' às ' + timeStr;
  };

  // Usar a calculadora unificada em vez do cálculo manual
  const totals = calculateOrderTotal(cart, 0);
  const cartTotal = totals.total;

  // Adicionar função para verificar se pode prosseguir
  const canProceed = () => {
    if (cart.length === 0) return false;
    const minimumOrder = store.minimum_order || 0;
    return cartTotal >= minimumOrder;
  };

  const updateQuantity = (index: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      onRemoveItem(index);
    } else {
      onUpdateItem(index, { quantity: newQuantity });
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5" />
            <span>Carrinho ({cart.length} {cart.length === 1 ? 'item' : 'itens'})</span>
          </DialogTitle>
        </DialogHeader>

        {cart.length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Carrinho vazio
            </h3>
            <p className="text-gray-500">
              Adicione produtos ao carrinho para continuar
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Cart Items */}
            <div className="space-y-3">
              {cart.map((item, index) => {
                const itemPrice = item.product.sale_price || item.product.price;
                const addonsPrice = item.addons.reduce((sum, addon) => 
                  sum + (addon.price * (addon.quantity || 1)), 0
                );
                const totalItemPrice = (itemPrice + addonsPrice) * item.quantity;

                return (
                  <Card key={index} className="border-l-4 border-l-primary">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-1">
                            {item.product.name}
                          </h4>
                          
                          {item.addons.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm text-gray-600 mb-1">Adicionais:</p>
                              <div className="flex flex-wrap gap-1">
                                {item.addons.map((addon, addonIndex) => (
                                  <Badge key={addonIndex} variant="secondary" className="text-xs">
                                    {addon.name} {addon.quantity && addon.quantity > 1 && `x${addon.quantity}`}
                                    {addon.price > 0 && ` (+R$ ${(addon.price * (addon.quantity || 1)).toFixed(2)})`}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}

                          {item.notes && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Observações:</strong> {item.notes}
                            </p>
                          )}

                          {item.scheduled_for && (
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Agendado para:</strong> {new Date(item.scheduled_for).toLocaleString()}
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="font-medium min-w-[2rem] text-center">
                                {item.quantity}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="h-8 w-8 p-0"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <span className="font-bold text-lg text-primary">
                                R$ {totalItemPrice.toFixed(2)}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onRemoveItem(index)}
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Cart Summary */}
            <div className="border-t pt-4 mt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xl font-bold">Total:</span>
                <span className="text-2xl font-bold text-primary">
                  R$ {cartTotal.toFixed(2)}
                </span>
              </div>

              {/* Mostrar informação do pedido mínimo */}
              {store.minimum_order && store.minimum_order > 0 && (
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
                  onClick={onCheckout}
                  disabled={!canProceed()}
                  className={`flex-1 ${
                    !canProceed() 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-primary hover:bg-primary/90'
                  }`}
                >
                  {!canProceed() && store.minimum_order && cartTotal < store.minimum_order
                    ? `Faltam R$ ${(store.minimum_order - cartTotal).toFixed(2)}`
                    : 'Finalizar Pedido'
                  }
                </Button>
              </div>
            </div>
          </div>
        )}
        {/* Adicionar seção de agendamento antes do resumo do carrinho */}
        {store.allow_scheduling && cart.length > 0 && (
          <div className="space-y-2 mb-4">
            <Label className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Agendar pedido para (opcional)
            </Label>
            <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
              <Button
                type="button"
                variant={!scheduledFor ? 'default' : 'outline'}
                onClick={() => {
                  setScheduledFor('');
                  onScheduleOrder('');
                }}
                className="text-sm"
              >
                Agora
              </Button>
              {availableSlots.map((slot, index) => (
                <Button
                  key={index}
                  type="button"
                  variant={scheduledFor === `${slot.date}T${slot.time}` ? 'default' : 'outline'}
                  onClick={() => {
                    const dateTime = `${slot.date}T${slot.time}`;
                    setScheduledFor(dateTime);
                    onScheduleOrder(dateTime);
                  }}
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
      </DialogContent>
    </Dialog>
  );
};

export default CartModal;
