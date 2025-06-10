
import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Minus, Trash2, ShoppingCart, Clock, Calendar } from 'lucide-react';
import { CartItem, Store } from '@/types';
import CheckoutModal from './CheckoutModal';
import { calculatePricing } from '@/utils/pricingCalculator';
import { SchedulingManager } from '@/utils/stockManager';
import { useToast } from '@/hooks/use-toast';

interface CartProps {
  cart: CartItem[];
  onUpdateQuantity: (index: number, newQuantity: number) => void;
  onRemoveItem: (index: number) => void;
  onCheckout: () => void;
  store: Store;
  onClose: () => void;
}

const Cart: React.FC<CartProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  store,
  onClose
}) => {
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [showCheckout, setShowCheckout] = useState(false);
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const { toast } = useToast();

  // Obter slots disponíveis considerando todos os itens do carrinho
  const availableSlots = useMemo(() => {
    if (!store.allow_scheduling || cart.length === 0) return [];
    return SchedulingManager.getAvailableSlots(store, deliveryType, 30, cart);
  }, [store, deliveryType, cart]);

  // Agrupar slots por data
  const slotsByDate = useMemo(() => {
    const grouped: { [date: string]: any[] } = {};
    availableSlots.forEach(slot => {
      if (!grouped[slot.date]) {
        grouped[slot.date] = [];
      }
      grouped[slot.date].push(slot);
    });
    return grouped;
  }, [availableSlots]);

  // Primeiros 6 slots para exibição rápida
  const quickSlots = useMemo(() => {
    return availableSlots.slice(0, 6);
  }, [availableSlots]);

  // Função para gerar dias do calendário
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();
    
    // Gerar para os próximos 2 meses
    for (let monthOffset = 0; monthOffset < 2; monthOffset++) {
      const month = (currentMonth + monthOffset) % 12;
      const year = currentYear + Math.floor((currentMonth + monthOffset) / 12);
      
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const startDate = new Date(firstDay);
      startDate.setDate(startDate.getDate() - firstDay.getDay());
      
      for (let i = 0; i < 42; i++) { // 6 semanas
        const date = new Date(startDate);
        date.setDate(startDate.getDate() + i);
        
        if (date.getMonth() === month && date >= today) {
          days.push({
            date,
            dateStr: date.toISOString().split('T')[0]
          });
        } else if (date.getMonth() === month) {
          days.push({ date: null, dateStr: '' });
        }
      }
    }
    
    return days;
  };

  // Validar agendamento selecionado
  const validateScheduling = (dateTime: string) => {
    if (!dateTime) return { valid: true };
    
    const [date, time] = dateTime.split('T');
    const validation = SchedulingManager.canScheduleOrder(
      store, cart, deliveryType, date, time
    );
    
    if (!validation.canSchedule) {
      toast({
        title: "Agendamento inválido",
        description: validation.reason,
        variant: "destructive"
      });
      setScheduledFor('');
      return { valid: false };
    }
    
    return { valid: true };
  };

  const getSubtotal = () => {
    return cart.reduce((total, item) => {
      const calculation = calculatePricing(
        item.product,
        item.quantity,
        item.addons.map(addon => ({ ...addon, quantity: addon.quantity || 1 }))
      );
      return total + calculation.total;
    }, 0);
  };

  const getDeliveryFee = () => {
    if (deliveryType === 'pickup') return 0;
    return store.delivery_fee || 0;
  };

  const getTotal = () => {
    return getSubtotal() + getDeliveryFee();
  };

  const canProceed = () => {
    if (cart.length === 0) return false;
    
    const subtotal = getSubtotal();
    const minimumOrder = store.minimum_order || 0;
    
    return subtotal >= minimumOrder;
  };

  if (cart.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <ShoppingCart className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Seu carrinho está vazio</p>
          <p className="text-sm text-gray-400">Adicione produtos para continuar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2" />
            Carrinho ({cart.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Itens do Carrinho */}
          <div className="space-y-3">
            {cart.map((item, index) => {
              const productPrice = item.product.sale_price || item.product.price;
              const addonsPrice = item.addons.reduce((sum, addon) => sum + addon.price, 0);
              const itemTotal = (productPrice + addonsPrice) * item.quantity;

              return (
                <div key={index} className="border rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.product.name}</h4>
                      {item.addons.length > 0 && (
                        <div className="text-xs text-gray-600">
                          {item.addons.map(addon => addon.name).join(', ')}
                        </div>
                      )}
                      {item.notes && (
                        <div className="text-xs text-gray-500 italic">
                          {item.notes}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemoveItem(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="h-6 w-6 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="text-sm font-medium">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onUpdateQuantity(index, item.quantity + 1)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                    <span className="font-medium text-sm">
                      R$ {itemTotal.toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Seção de Agendamento Melhorada */}
          {store.allow_scheduling && (quickSlots.length > 0 || Object.keys(slotsByDate).length > 0) && (
            <>
              <Separator />
              <div className="space-y-3">
                <h4 className="font-medium flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Agendamento (Opcional)
                </h4>
                
                {/* Opções rápidas */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={!scheduledFor ? 'default' : 'outline'}
                    onClick={() => setScheduledFor('')}
                    className="text-sm"
                  >
                    Agora
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => setShowCalendar(true)}
                    className="text-sm"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Escolher Data
                  </Button>
                </div>

                {/* Slots rápidos */}
                {quickSlots.length > 0 && (
                  <>
                    <p className="text-sm text-gray-600">Próximos horários:</p>
                    <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                      {quickSlots.map((slot) => {
                        const dateTime = `${slot.date}T${slot.time}`;
                        const isSelected = scheduledFor === dateTime;
                        const date = new Date(`${slot.date}T${slot.time}`);
                        
                        return (
                          <Button
                            key={dateTime}
                            variant={isSelected ? 'default' : 'outline'}
                            onClick={() => {
                              setScheduledFor(dateTime);
                              validateScheduling(dateTime);
                            }}
                            className="text-sm"
                            disabled={!slot.available}
                          >
                            {date.toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit'
                            })} às {slot.time}
                          </Button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </>
          )}

          <Separator />

          {/* Tipo de Entrega */}
          <div className="space-y-3">
            <h4 className="font-medium">Tipo de Entrega</h4>
            <RadioGroup value={deliveryType} onValueChange={(value: 'delivery' | 'pickup') => setDeliveryType(value)}>
              {store.delivery_available && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delivery" id="delivery" />
                  <Label htmlFor="delivery" className="flex-1">
                    <div className="flex justify-between">
                      <span>Entrega</span>
                      <span>R$ {getDeliveryFee().toFixed(2)}</span>
                    </div>
                  </Label>
                </div>
              )}
              
              {store.pickup_available && (
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="pickup" id="pickup" />
                  <Label htmlFor="pickup" className="flex-1">
                    <div className="flex justify-between">
                      <span>Retirada no local</span>
                      <span>Grátis</span>
                    </div>
                  </Label>
                </div>
              )}
            </RadioGroup>
          </div>

          <Separator />

          {/* Resumo */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal:</span>
              <span>R$ {getSubtotal().toFixed(2)}</span>
            </div>
            
            {deliveryType === 'delivery' && getDeliveryFee() > 0 && (
              <div className="flex justify-between text-sm">
                <span>Taxa de entrega:</span>
                <span>R$ {getDeliveryFee().toFixed(2)}</span>
              </div>
            )}
            
            <div className="flex justify-between font-bold">
              <span>Total:</span>
              <span>R$ {getTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Pedido Mínimo */}
          {store.minimum_order && store.minimum_order > 0 && (
            <div className="text-xs text-gray-600">
              {getSubtotal() < store.minimum_order ? (
                <div className="text-red-600">
                  Pedido mínimo: R$ {store.minimum_order.toFixed(2)}
                  <br />
                  Faltam: R$ {(store.minimum_order - getSubtotal()).toFixed(2)}
                </div>
              ) : (
                <div className="text-green-600">
                  ✓ Pedido mínimo atingido
                </div>
              )}
            </div>
          )}

          {/* Botão de Finalizar */}
          <Button
            onClick={() => setShowCheckout(true)}
            disabled={!canProceed()}
            className="w-full"
          >
            Finalizar Pedido
          </Button>
        </CardContent>
      </Card>

      {/* Modal do Calendário */}
      {showCalendar && (
        <Dialog open={showCalendar} onOpenChange={setShowCalendar}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Escolher Data e Horário</DialogTitle>
            </DialogHeader>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Calendário de datas */}
              <div>
                <h4 className="font-medium mb-3">Selecione uma data:</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  {/* Cabeçalho dos dias da semana */}
                  {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="p-2 font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  
                  {/* Dias do calendário */}
                  {generateCalendarDays().map((day, index) => {
                    const hasSlots = day.dateStr && slotsByDate[day.dateStr]?.length > 0;
                    const isSelected = selectedDate?.toDateString() === day.date?.toDateString();
                    
                    return (
                      <Button
                        key={index}
                        variant={isSelected ? 'default' : hasSlots ? 'outline' : 'ghost'}
                        onClick={() => hasSlots && day.date ? setSelectedDate(day.date) : null}
                        disabled={!hasSlots || !day.date}
                        className={`h-10 w-10 p-0 text-sm ${
                          !day.date ? 'invisible' : 
                          hasSlots ? 'border-green-200 hover:border-green-300' : 
                          'text-gray-300 cursor-not-allowed'
                        }`}
                      >
                        {day.date?.getDate()}
                      </Button>
                    );
                  })}
                </div>
              </div>
              
              {/* Horários disponíveis */}
              <div>
                <h4 className="font-medium mb-3">
                  {selectedDate ? 
                    `Horários para ${selectedDate.toLocaleDateString('pt-BR')}:` : 
                    'Selecione uma data para ver os horários'
                  }
                </h4>
                
                {selectedDate && slotsByDate[selectedDate.toISOString().split('T')[0]] && (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {slotsByDate[selectedDate.toISOString().split('T')[0]].map((slot: any) => {
                      const dateTime = `${slot.date}T${slot.time}`;
                      const isSelected = scheduledFor === dateTime;
                      
                      return (
                        <Button
                          key={dateTime}
                          variant={isSelected ? 'default' : 'outline'}
                          onClick={() => {
                            setScheduledFor(dateTime);
                            validateScheduling(dateTime);
                            setShowCalendar(false);
                          }}
                          className="text-sm"
                          disabled={!slot.available}
                        >
                          {slot.time}
                        </Button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setShowCalendar(false)}>
                Cancelar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal de Checkout */}
      {showCheckout && (
        <CheckoutModal
          cart={cart}
          store={store}
          onClose={() => setShowCheckout(false)}
          onSuccess={() => {
            setShowCheckout(false);
            onCheckout();
          }}
          initialScheduledFor={scheduledFor}
        />
      )}
    </>
  );
};

export default Cart;
