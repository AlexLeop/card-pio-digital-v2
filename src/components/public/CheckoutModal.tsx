import React, { useState } from 'react';
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
import { SchedulingManager } from '@/utils/stockManager';
import MercadoPagoPayment from './MercadoPagoPayment';
import AddressForm, { AddressData } from '@/components/common/AddressForm';

interface CheckoutModalProps {
  cart: CartItem[];
  store: Store;
  onClose: () => void;
  onSuccess: () => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({
  cart,
  store,
  onClose,
  onSuccess
}) => {
  const [step, setStep] = useState<'info' | 'payment'>('info');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit_card' | 'pix'>('cash');
  const [showMercadoPago, setShowMercadoPago] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  // Customer data
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: ''
  });

  // Address data
  const [addressData, setAddressData] = useState<AddressData>({
    zip_code: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  // Order data
  const [orderData, setOrderData] = useState({
    delivery_type: 'delivery' as 'delivery' | 'pickup',
    notes: '',
    scheduled_for: ''
  });

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => {
    const calculation = calculatePricing(
      item.product,
      item.quantity,
      item.addons.map(addon => ({ ...addon, quantity: addon.quantity || 1 }))
    );
    return sum + calculation.total;
  }, 0);

  const deliveryFee = orderData.delivery_type === 'delivery' ? (store.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;

  // Get available scheduling slots
  const availableSlots = SchedulingManager.getAvailableSlots(store, orderData.delivery_type, 7);

  const formatDateTime = (dateStr: string, timeStr: string) => {
    const date = new Date(dateStr + 'T' + timeStr);
    return date.toLocaleDateString('pt-BR') + ' às ' + timeStr;
  };

  const createOrder = async () => {
    try {
      console.log('Creating order with data:', {
        customerData,
        addressData,
        orderData,
        cart,
        subtotal,
        deliveryFee,
        total
      });

      // Create the order
      const orderToCreate = {
        customer_name: customerData.name,
        customer_phone: customerData.phone,
        customer_email: customerData.email || null,
        delivery_type: orderData.delivery_type,
        payment_method: paymentMethod,
        status: 'pending',
        subtotal: Number(subtotal.toFixed(2)),
        delivery_fee: Number(deliveryFee.toFixed(2)),
        total: Number(total.toFixed(2)),
        notes: orderData.notes || null,
        scheduled_for: orderData.scheduled_for || null,
        store_id: store.id,
        // Address fields
        street: orderData.delivery_type === 'delivery' ? addressData.street : null,
        number: orderData.delivery_type === 'delivery' ? addressData.number : null,
        complement: orderData.delivery_type === 'delivery' ? addressData.complement : null,
        neighborhood: orderData.delivery_type === 'delivery' ? addressData.neighborhood : null,
        city: orderData.delivery_type === 'delivery' ? addressData.city : null,
        state: orderData.delivery_type === 'delivery' ? addressData.state : null,
        zip: orderData.delivery_type === 'delivery' ? addressData.zip_code : null,
        // Keep old address field for compatibility
        address: orderData.delivery_type === 'delivery' ? 
          `${addressData.street}, ${addressData.number}${addressData.complement ? `, ${addressData.complement}` : ''} - ${addressData.neighborhood}` : 
          null
      };

      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert([orderToCreate])
        .select()
        .single();

      if (orderError) {
        console.error('Error creating order:', orderError);
        throw orderError;
      }

      console.log('Order created:', order);
      setCurrentOrderId(order.id);

      // Create order items
      const orderItems: Omit<OrderItem, 'id' | 'created_at'>[] = [];
      const orderItemAddons: any[] = [];

      for (const cartItem of cart) {
        const calculation = calculatePricing(
          cartItem.product,
          cartItem.quantity,
          cartItem.addons.map(addon => ({ ...addon, quantity: addon.quantity || 1 }))
        );

        const orderItem = {
          order_id: order.id,
          product_id: cartItem.product.id,
          quantity: cartItem.quantity,
          price: Number(calculation.total.toFixed(2)),
          notes: cartItem.notes || null
        };

        const { data: createdItem, error: itemError } = await supabase
          .from('order_items')
          .insert([orderItem])
          .select()
          .single();

        if (itemError) {
          console.error('Error creating order item:', itemError);
          throw itemError;
        }

        console.log('Order item created:', createdItem);

        // Create order item addons
        for (const addon of cartItem.addons) {
          if (addon.quantity && addon.quantity > 0) {
            orderItemAddons.push({
              order_item_id: createdItem.id,
              addon_item_id: addon.id,
              price: Number((addon.price * addon.quantity).toFixed(2))
            });
          }
        }
      }

      // Insert all order item addons
      if (orderItemAddons.length > 0) {
        const { error: addonsError } = await supabase
          .from('order_item_addons')
          .insert(orderItemAddons);

        if (addonsError) {
          console.error('Error creating order item addons:', addonsError);
          throw addonsError;
        }

        console.log('Order item addons created:', orderItemAddons.length);
      }

      return order;
    } catch (error) {
      console.error('Erro ao criar pedido:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const order = await createOrder();

      if (paymentMethod === 'cash') {
        toast({
          title: "Pedido realizado com sucesso!",
          description: "Redirecionando para finalização..."
        });
        
        // Redirect to order success page for cash payments
        setTimeout(() => {
          window.location.href = `/pedido/${order.id}`;
        }, 1500);
        
      } else {
        // For card or PIX, show Mercado Pago
        setShowMercadoPago(true);
      }
    } catch (error: any) {
      console.error('Erro ao processar pedido:', error);
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
      }

      toast({
        title: "Pagamento aprovado!",
        description: "Redirecionando para finalização..."
      });
      
      // Redirect to order success page for successful payments
      setTimeout(() => {
        window.location.href = `/pedido/${currentOrderId}`;
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
          // Não fechar o modal automaticamente
          // setShowMercadoPago(false); - Remova esta linha
          
          // Exibir toast com a mensagem de erro específica
          toast({
            title: "Erro no pagamento",
            description: error, // Usar a mensagem de erro específica
            variant: "destructive"
          });
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
                        onChange={(e) => setCustomerData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Seu nome completo"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email (opcional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@exemplo.com"
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

              {/* Scheduling */}
              {store.allow_scheduling && availableSlots.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2" />
                      Agendamento (Opcional)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                      <Button
                        variant={!orderData.scheduled_for ? 'default' : 'outline'}
                        onClick={() => setOrderData(prev => ({ ...prev, scheduled_for: '' }))}
                        size="sm"
                      >
                        O mais rápido possível
                      </Button>
                      {availableSlots.slice(0, 15).map((slot, index) => (
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
