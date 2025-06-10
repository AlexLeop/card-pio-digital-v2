
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Order, Store } from '@/types';
import WhatsAppRedirect from '@/components/public/WhatsAppRedirect';
import { useOrderItems } from '@/hooks/useOrderItems';

const OrderSuccess: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { orderItems } = useOrderItems(order?.id);

  useEffect(() => {
    if (orderId) {
      fetchOrderData();
    }
  }, [orderId]);

  const fetchOrderData = async () => {
    try {
      setLoading(true);
      
      // Fetch order data
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      
      // Type-safe assignment ensuring delivery_type is properly typed
      const typedOrder: Order = {
        ...orderData,
        delivery_type: orderData.delivery_type as 'delivery' | 'pickup'
      };
      
      setOrder(typedOrder);

      // Fetch store data
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('id', orderData.store_id)
        .single();

      if (storeError) throw storeError;
      
      setStore(storeData);
    } catch (err) {
      console.error('Error fetching order data:', err);
      setError('Pedido não encontrado');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error || !order || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Erro</h1>
            <p className="text-gray-600 mb-4">{error || 'Pedido não encontrado'}</p>
            <Button onClick={() => navigate('/')}>
              Voltar ao Início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-6">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-3xl font-bold text-green-700 mb-2">
              Pedido Realizado com Sucesso!
            </CardTitle>
            <p className="text-gray-600 text-lg">
              Seu pedido #{order.id.slice(0, 8)} foi confirmado
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order Summary */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-3">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-medium">{order.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Telefone:</span>
                  <span className="font-medium">{order.customer_phone}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tipo:</span>
                  <span className="font-medium">
                    {order.delivery_type === 'delivery' ? 'Entrega' : 'Retirada'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pagamento:</span>
                  <span className="font-medium capitalize">{order.payment_method}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total:</span>
                  <span className="font-bold text-lg text-green-600">
                    R$ {order.total.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Status */}
            {order.payment_method !== 'cash' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">Status do Pagamento</h3>
                <p className="text-blue-700 text-sm">
                  {order.status === 'confirmed' 
                    ? 'Pagamento confirmado com sucesso!' 
                    : 'Aguardando confirmação do pagamento...'}
                </p>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 mb-2">Próximos Passos</h3>
              <div className="text-green-700 text-sm space-y-1">
                <p>✓ Seu pedido foi registrado com sucesso</p>
                <p>✓ Você será direcionado para o WhatsApp da loja</p>
                <p>✓ A loja confirmará seu pedido e informará o tempo de preparo</p>
                {order.delivery_type === 'delivery' ? (
                  <p>✓ Aguarde a entrega no endereço informado</p>
                ) : (
                  <p>✓ Retire seu pedido na loja no horário informado</p>
                )}
              </div>
            </div>

            {/* WhatsApp Redirect */}
            <div className="bg-white border-2 border-green-200 rounded-lg p-6">
              {orderItems && (
                <WhatsAppRedirect
                  order={order}
                  orderItems={orderItems}
                  store={store}
                  autoRedirect={true}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col space-y-3 pt-4">
              <Button
                onClick={() => navigate(`/loja/${store.slug}`)}
                variant="outline"
                className="w-full"
              >
                Voltar ao Cardápio
              </Button>
              <Button
                onClick={() => navigate('/')}
                variant="outline"
                className="w-full"
              >
                Página Inicial
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderSuccess;
