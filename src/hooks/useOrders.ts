
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Order } from '@/types';
import { useRateLimit } from './useRateLimit';

export const useOrders = (storeId?: string) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const rateLimit = useRateLimit({ maxRequests: 100, windowMs: 60000 });

  const fetchOrders = async () => {
    if (!rateLimit.checkRateLimit()) {
      console.warn('Rate limit exceeded for orders fetch');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching orders for store:', storeId);

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders data fetched:', data?.length || 0, data);

      const mappedOrders = (data || []).map(order => ({
        ...order,
        delivery_type: (order.delivery_type === 'pickup' ? 'pickup' : 'delivery') as 'delivery' | 'pickup'
      }));

      console.log('Final mapped orders:', mappedOrders.length);
      setOrders(mappedOrders);
    } catch (err) {
      console.error('Erro ao carregar pedidos:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('useOrders useEffect triggered with storeId:', storeId);
    fetchOrders();
  }, [storeId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!rateLimit.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    try {
      console.log('Updating order status:', orderId, status);
      
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        console.error('Error updating order status:', error);
        throw error;
      }

      console.log('Order status updated:', data);

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status } : order
      ));
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar status do pedido');
      throw err;
    }
  };

  const createOrder = async (orderData: Omit<Order, 'id' | 'created_at'>) => {
    if (!rateLimit.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    try {
      console.log('Creating order with data:', orderData);
      
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...orderData,
          store_id: storeId
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating order:', error);
        throw error;
      }

      console.log('Order created:', data);

      const mappedOrder = {
        ...data,
        delivery_type: (data.delivery_type === 'pickup' ? 'pickup' : 'delivery') as 'delivery' | 'pickup'
      };

      setOrders(prev => [mappedOrder, ...prev]);
      return mappedOrder;
    } catch (err) {
      console.error('Erro ao criar pedido:', err);
      setError(err instanceof Error ? err.message : 'Erro ao criar pedido');
      throw err;
    }
  };

  return {
    orders,
    loading,
    error,
    updateOrderStatus,
    createOrder,
    refetch: fetchOrders
  };
};
