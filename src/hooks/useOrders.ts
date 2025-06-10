
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
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const mappedOrders = (data || []).map(order => ({
        ...order,
        delivery_type: (order.delivery_type === 'pickup' ? 'pickup' : 'delivery') as 'delivery' | 'pickup'
      }));

      setOrders(mappedOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar pedidos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [storeId]);

  const updateOrderStatus = async (orderId: string, status: string) => {
    if (!rateLimit.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single();

      if (error) {
        throw error;
      }

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
      const { data, error } = await supabase
        .from('orders')
        .insert([{
          ...orderData,
          store_id: storeId
        }])
        .select()
        .single();

      if (error) {
        throw error;
      }

      const mappedOrder = {
        ...data,
        delivery_type: (data.delivery_type === 'pickup' ? 'pickup' : 'delivery') as 'delivery' | 'pickup'
      };

      setOrders(prev => [mappedOrder, ...prev]);
      return mappedOrder;
    } catch (err) {
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
