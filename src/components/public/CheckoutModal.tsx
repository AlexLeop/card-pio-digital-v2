import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, CreditCard, Banknote } from 'lucide-react';
import { CartItem, Store, Order, OrderItem } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { calculatePricing } from '@/utils/pricingCalculator';
import { calculateOrderTotal, createOrder } from '@/utils/orderService';
import { SchedulingManager } from '@/utils/stockManager';
import MercadoPagoPayment from './MercadoPagoPayment';
import AddressForm, { AddressData } from '@/components/common/AddressForm';
import ValidationErrors from '@/components/common/ValidationErrors';
import { useValidation } from '@/hooks/useValidation';
import { 
  checkoutFormSchema, 
  checkoutCustomerSchema, 
  checkoutAddressSchema,
  CheckoutCustomerData,
  CheckoutAddressData,
  CheckoutOrderData
} from '@/lib/validations';
import { useStockManager } from '@/hooks/useStockManager';
import { useProducts } from '@/hooks/useProducts';

interface CheckoutModalProps {
  cart: CartItem[];
  store: Store;
  onClose: () => void;
  onSuccess: () => void;
  scheduledFor?: string; // Apenas recebe a informação
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  store,
  onClose,
  onSuccess,
  scheduledFor // Recebe do carrinho
}) => {
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'pix'>('cash');
  const [showMercadoPago, setShowMercadoPago] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Validação
  const { validate, errors, clearErrors } = useValidation();

  // Customer data
  const [customerData, setCustomerData] = useState<CheckoutCustomerData>({
    name: '',
    phone: '',
    email: ''
  });

  // Address data
  const [addressData, setAddressData] = useState<CheckoutAddressData>({
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Order data - apenas usa o scheduledFor recebido
  const [orderData, setOrderData] = useState<CheckoutOrderData>({
    delivery_type: 'delivery' as 'delivery' | 'pickup',
    notes: '',
    scheduled_for: scheduledFor || ''
  });

  // Calculate totals using the unified service
  const deliveryFee = orderData.delivery_type === 'delivery' ? (store.delivery_fee || 0) : 0;
  const totals = calculateOrderTotal(cart, deliveryFee);
  const subtotal = totals.subtotal;
  const total = totals.total;

  // Get available scheduling slots
  // Filtrar slots baseado nos produtos do carrinho
  const availableSlots = useMemo(() => {
    if (!store || !cart.length) return [];
    
    // Verificar se todos os produtos permitem agendamento no mesmo dia
    const allProductsAllowScheduling = cart.every(item =>
      (item.product as any).allow_same_day_scheduling !== false
    );
    
    // Verificar se algum produto tem limitação de estoque diário
    const hasStockLimitations = cart.some(item => 
      (item.product as any).daily_stock
    );
    
    // Se há limitações de estoque, precisamos considerar todos os produtos
    if (hasStockLimitations) {
      // Para múltiplos produtos com estoque limitado, usar validação mais restritiva
      const allSlots = SchedulingManager.getAvailableSlots(store, orderData.delivery_type, 7);
      
      return allSlots.filter(slot => {
        // Verificar se todos os produtos têm estoque para este slot
        return cart.every(item => {
          if (!(item.product as any).daily_stock) return true;
          return checkAvailability(item.product.id, item.quantity);
        });
      });
    }
    
    if (!allProductsAllowScheduling) {
      // Retornar apenas slots de dias futuros
      return SchedulingManager.getAvailableSlots(store, orderData.delivery_type, 7)
        .filter(slot => slot.date !== new Date().toISOString().split('T')[0]);
    }
    
    return SchedulingManager.getAvailableSlots(store, orderData.delivery_type, 7);
  }, [store, cart, orderData.delivery_type]);

  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr + 'T' + timeStr);
    return date.toLocaleDateString('pt-BR') + ' às ' + timeStr;
  };

  // Obter produtos para validação de estoque
  const { products } = useProducts(store.id);
  const {
    checkAvailability,
    getAvailableStock,
    reduceStock
  } = useStockManager(products);

  // Adicionar validação de estoque na função validateStep
  const validateStep = async (): Promise<boolean> => {
    clearErrors();
    
    if (step === 'info') {
      // Validar dados do cliente
      const customerValidation = await validate(checkoutCustomerSchema, customerData);
      if (!customerValidation.success) {
        return false;
      }

      // Validar endereço se for delivery
      if (orderData.delivery_type === 'delivery') {
        const addressValidation = await validate(checkoutAddressSchema, addressData);
        if (!addressValidation.success) {
          return false;
        }
      }

      // Validar se o carrinho não está vazio
      if (!cart || cart.length === 0) {
        toast({
          title: "Carrinho vazio",
          description: "Adicione itens ao carrinho antes de finalizar o pedido.",
          variant: "destructive"
        });
        return false;
      }

      // Validar estoque disponível para cada item do carrinho
      const stockValidations = await Promise.all(
        cart.map(async (item) => {
          if (item.product.daily_stock) {
            const availableStock = await getAvailableStock(item.product.id);
            return { item, availableStock };
          }
          return { item, availableStock: Infinity };
        })
      );

      const invalidStock = stockValidations.find(
        ({ item, availableStock }) => availableStock < item.quantity
      );

      if (invalidStock) {
        toast({
          title: "Estoque insuficiente",
          description: `${invalidStock.item.product.name}: apenas ${invalidStock.availableStock} unidades disponíveis.`,
          variant: "destructive"
        });
        return false;
      }

      // Validar valor mínimo do pedido
      if (store.minimum_order && subtotal < store.minimum_order) {
        toast({
          title: "Valor mínimo não atingido",
          description: `O valor mínimo do pedido é R$ ${store.minimum_order.toFixed(2)}.`,
          variant: "destructive"
        });
        return false;
      }
    }
    
    return true;
  };

  const handleNextStep = async () => {
    const isValid = await validateStep();
    if (isValid) {
      setStep('payment');
    }
  };

  const handleSubmit = async () => {
    try {
      const isValid = await validateStep();
      if (!isValid) return;

      setLoading(true);

      // Use the unified order service
      const result = await createOrder({
        customerData,
        addressData: orderData.delivery_type === 'delivery' ? addressData : undefined,
        orderData: {
          delivery_type: orderData.delivery_type,
          payment_method: paymentMethod,
          notes: orderData.notes?.trim() || null,
          scheduled_for: orderData.scheduled_for,
          store_id: store.id
        },
        items: cart.map(item => ({
          ...item,
          notes: item.notes?.trim() || null
        })),
        deliveryFee
      });

      setCurrentOrderId(result.order.id);

      if (paymentMethod === 'cash') {
        // Para pagamento em dinheiro, reduzir estoque imediatamente
        cart.forEach(item => {
          if (item.product.daily_stock) {
            reduceStock(item.product.id, item.quantity);
          }
        });

        toast({
          title: "Pedido realizado com sucesso!",
          description: "Redirecionando para finalização..."
        });
        
        setTimeout(() => {
          window.location.href = `/pedido/${result.order.id}`;
        }, 1500);
        
        onSuccess();
      } else {
        // Para cartão ou PIX, mostrar Mercado Pago
        setShowMercadoPago(true);
      }
    } catch (error: any) {
      toast({
        title: "Erro ao processar pedido",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async (paymentId: string) => {
    try {
      if (currentOrderId) {
        // Update order with Mercado Pago payment ID
        const { error } = await supabase
          .from('orders')
          .update({ 
            mercado_pago_payment_id: paymentId,
            status: 'confirmed'
          })
          .eq('id', currentOrderId);

        if (error) {
          console.error('Error updating order with payment ID:', error);
        }

        // Reduzir estoque após pagamento confirmado
        cart.forEach(item => {
          if (item.product.daily_stock) {
            reduceStock(item.product.id, item.quantity);
          }
        });
      }

      toast({
        title: "Pagamento aprovado!",
        description: "Redirecionando para finalização..."
      });

      setTimeout(() => {
        if (currentOrderId) {
          window.location.href = `/pedido/${currentOrderId}`;
        }
      }, 1500);
      
    } catch (error) {
      console.error('Error updating payment:', error);
    }
  };

  if (showMercadoPago && currentOrderId) {
    return (
      <MercadoPagoPayment
        amount={total}
        description={`Pedido ${store.name}`}
        customerData={customerData}
        onSuccess={handlePaymentSuccess}
        onError={(error) => {
          console.error('Payment error:', error);
          toast({
            title: "Erro no pagamento",
            description: error,
            variant: "destructive"
          });
          setShowMercadoPago(false);
          setStep('payment');
        }}
        onCancel={() => setShowMercadoPago(false)}
        storeId={store.id}
        paymentMethod={paymentMethod as 'credit_card' | 'pix'}
        orderId={currentOrderId}
      />
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'info' ? 'Dados do Pedido' : 'Finalizar Pagamento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Exibir erros de validação */}
          <ValidationErrors errors={errors} />
          
          {step === 'info' && (
            <>
              {/* Customer Data */}
              <Card>
                <CardHeader>
                  <CardTitle>Dados do Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input
                        id="name"
                        value={customerData.name}
                        onChange={(e) => {
                          setCustomerData(prev => ({ ...prev, name: e.target.value }));
                          clearErrors();
                        }}
                        placeholder="Seu nome completo"
                        required
                        className={errors.some(e => e.field === 'name') ? 'border-red-500' : ''}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => {
                          setCustomerData(prev => ({ ...prev, phone: e.target.value }));
                          clearErrors();
                        }}
                        placeholder="(11) 99999-9999"
                        required
                        className={errors.some(e => e.field === 'phone') ? 'border-red-500' : ''}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => {
                        setCustomerData(prev => ({ ...prev, email: e.target.value }));
                        clearErrors();
                      }}
                      placeholder="email@exemplo.com"
                      className={errors.some(e => e.field === 'email') ? 'border-red-500' : ''}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Delivery Type */}
              <Card>
                <CardHeader>
                  <CardTitle>Tipo de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {store.delivery_available && (
                      <Button
                        variant={orderData.delivery_type === 'delivery' ? 'default' : 'outline'}
                        onClick={() => setOrderData(prev => ({ ...prev, delivery_type: 'delivery' }))}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <div className="font-semibold">Entrega</div>
                        <div className="text-xs text-gray-500">
                          Taxa: R$ {(store.delivery_fee || 0).toFixed(2)}
                        </div>
                      </Button>
                    )}

                    {store.pickup_available && (
                      <Button
                        variant={orderData.delivery_type === 'pickup' ? 'default' : 'outline'}
                        onClick={() => setOrderData(prev => ({ ...prev, delivery_type: 'pickup' }))}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <div className="font-semibold">Retirada</div>
                        <div className="text-xs text-gray-500">Sem taxa</div>
                      </Button>
                    )}
                  </div>

                  {orderData.delivery_type === 'delivery' && (
                    <div className="space-y-4">
                      <h4 className="font-medium">Endereço de Entrega</h4>
                      <AddressForm
                        value={addressData}
                        onChange={setAddressData}
                      />
                    </div>
                  )}

                  {orderData.delivery_type === 'pickup' && store.pickup_address && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium mb-2">Endereço para Retirada:</h4>
                      <p className="text-sm text-gray-600">{store.pickup_address}</p>
                      {store.pickup_instructions && (
                        <p className="text-sm text-gray-500 mt-2">{store.pickup_instructions}</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Scheduling - versão melhorada */}
              {store.allow_scheduling && availableSlots.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Agendamento (Opcional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        <Button
                          variant={!orderData.scheduled_for ? 'default' : 'outline'}
                          onClick={() => setOrderData(prev => ({ ...prev, scheduled_for: '' }))}
                          size="sm"
                        >
                          O mais rápido possível
                        </Button>
                        
                        {/* Mostrar mais slots (primeiros 20) */}
                        {availableSlots.slice(0, 20).map((slot, index) => (
                          <Button
                            key={`${slot.date}-${slot.time}`}
                            variant={orderData.scheduled_for === `${slot.date}T${slot.time}` ? 'default' : 'outline'}
                            onClick={() => setOrderData(prev => ({ ...prev, scheduled_for: `${slot.date}T${slot.time}` }))}
                            size="sm"
                            className="text-xs"
                          >
                            {formatDateTime(slot.date, slot.time)}
                          </Button>
                        ))}
                      </div>
                      
                      {availableSlots.length > 20 && (
                        <p className="text-sm text-gray-500 text-center">
                          Mostrando os primeiros 20 horários. Total de {availableSlots.length} horários disponíveis.
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Notes */}
              <Card>
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={orderData.notes}
                    onChange={(e) => setOrderData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Alguma observação especial para seu pedido?"
                    rows={3}
                  />
                </CardContent>
              </Card>

              {/* Order Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Resumo do Pedido</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cart.map((item, index) => {
                    const calculation = calculatePricing(
                      item.product,
                      item.quantity,
                      item.addons.map(addon => ({ ...addon, quantity: addon.quantity || 1 }))
                    );

                    return (
                      <div key={index} className="border-b pb-3 last:border-b-0">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium">{item.product.name}</h4>
                            <p className="text-sm text-gray-600">Qtd: {item.quantity}</p>
                            
                            {item.addons.length > 0 && (
                              <div className="mt-1">
                                <p className="text-xs text-gray-500">Adicionais:</p>
                                {item.addons.map((addon, addonIndex) => (
                                  <p key={addonIndex} className="text-xs text-gray-600">
                                    • {addon.name} ({addon.quantity || 1}x) - R$ {(addon.price * (addon.quantity || 1)).toFixed(2)}
                                  </p>
                                ))}
                              </div>
                            )}

                            {item.notes && (
                              <p className="text-xs text-gray-500 mt-1">Obs: {item.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium">R$ {calculation.total.toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>R$ {subtotal.toFixed(2)}</span>
                    </div>
                    
                    {deliveryFee > 0 && (
                      <div className="flex justify-between">
                        <span>Taxa de entrega:</span>
                        <span>R$ {deliveryFee.toFixed(2)}</span>
                      </div>
                    )}
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total:</span>
                      <span>R$ {total.toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button variant="outline" onClick={onClose} className="flex-1">
                  Cancelar
                </Button>
                <Button 
                  onClick={() => setStep('payment')} 
                  className="flex-1"
                  disabled={!customerData.name || !customerData.phone || (orderData.delivery_type === 'delivery' && (!addressData.street || !addressData.number))}
                >
                  Continuar para Pagamento
                </Button>
              </div>
            </>
          )}

          {step === 'payment' && (
            <>
              {/* Payment Method */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Forma de Pagamento
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {store.accept_cash && (
                      <Button
                        variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('cash')}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <Banknote className="h-6 w-6 mb-2" />
                        <span className="font-semibold">Dinheiro</span>
                        <span className="text-xs text-gray-500">Na entrega/retirada</span>
                      </Button>
                    )}

                    {store.accept_credit_card && store.mercado_pago_public_key && (
                      <Button
                        variant={paymentMethod === 'credit_card' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('credit_card')}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <CreditCard className="h-6 w-6 mb-2" />
                        <span className="font-semibold">Cartão</span>
                        <span className="text-xs text-gray-500">Mercado Pago</span>
                      </Button>
                    )}

                    {store.accept_pix && store.mercado_pago_public_key && (
                      <Button
                        variant={paymentMethod === 'pix' ? 'default' : 'outline'}
                        onClick={() => setPaymentMethod('pix')}
                        className="h-20 flex flex-col items-center justify-center"
                      >
                        <div className="w-6 h-6 mb-2 bg-current rounded"></div>
                        <span className="font-semibold">PIX</span>
                        <span className="text-xs text-gray-500">Instantâneo</span>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Order Total */}
              <Card>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span>Total a pagar:</span>
                    <span className="text-green-600">R$ {total.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex space-x-3">
                <Button variant="outline" onClick={() => setStep('info')} className="flex-1">
                  Voltar
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="flex-1"
                  disabled={loading}
                >
                  {loading ? 'Processando...' : 'Finalizar Pedido'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckoutModal;
