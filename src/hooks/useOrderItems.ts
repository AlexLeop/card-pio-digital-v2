
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { OrderItem, OrderItemAddon } from '@/types'; // Usar tipos centralizados

// Remover todas as interfaces duplicadas

export const useOrderItems = (orderId?: string) => {
  const [orderItems, setOrderItems] = useState<TypedOrderItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderId) {
      setOrderItems(null);
      setLoading(false);
      return;
    }

    fetchOrderItems();
  }, [orderId]);

  const fetchOrderItems = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch order items with products and addons
      const { data: items, error: itemsError } = await supabase
        .from('order_items')
        .select(`
          *,
          products!inner(*),
          order_item_addons(
            *,
            addon_items(*)
          )
        `)
        .eq('order_id', orderId)
        .order('created_at', { ascending: true });

      if (itemsError) {
        console.error('Error fetching order items:', itemsError);
        throw itemsError;
      }
      
      // Convert to proper TypedOrderItem format
      const typedItems: TypedOrderItem[] = (items || []).map(item => ({
        ...item,
        created_at: item.created_at || new Date().toISOString(),
        order_item_addons: (item.order_item_addons || []).map((addon: any) => ({
          id: addon.id,
          order_item_id: addon.order_item_id || item.id,
          addon_item_id: addon.addon_item_id,
          price: addon.price,
          created_at: addon.created_at || new Date().toISOString(),
          addon_items: addon.addon_items ? {
            id: addon.addon_items.id,
            name: addon.addon_items.name,
            description: undefined,
            price: addon.addon_items.price,
            is_available: true,
            sort_order: 0,
            created_at: new Date().toISOString()
          } : undefined
        }))
      }));
      
      setOrderItems(typedItems);
    } catch (err) {
      console.error('Error in fetchOrderItems:', err);
      setError(err instanceof Error ? err.message : 'Erro ao carregar itens do pedido');
    } finally {
      setLoading(false);
    }
  };

  return {
    orderItems,
    loading,
    error,
    refetch: fetchOrderItems
  };
};
