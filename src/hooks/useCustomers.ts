
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Customer } from '@/types';
import { useRateLimit } from './useRateLimit';

export const useCustomers = (storeId?: string) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const rateLimit = useRateLimit({ maxRequests: 100, windowMs: 60000 });

  const fetchCustomers = async () => {
    if (!storeId || !rateLimit.checkRateLimit()) {
      console.warn('Rate limit exceeded or no storeId provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_name, customer_phone, customer_email, street, number, neighborhood, city, state, zip, total, created_at')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders for customers:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        setCustomers([]);
        return;
      }

      // Agrupar pedidos por cliente (phone + name)
      const customerMap = new Map<string, Customer>();
      
      ordersData.forEach(order => {
        const customerId = `${order.customer_phone}-${order.customer_name}`;
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: order.customer_name || '',
            phone: order.customer_phone || '',
            email: order.customer_email || '',
            street: order.street || '',
            number: order.number || '',
            neighborhood: order.neighborhood || '',
            city: order.city || '',
            state: order.state || '',
            zip_code: order.zip || '',
            complement: '',
            address: order.street && order.number ? `${order.street}, ${order.number}` : '',
            store_id: storeId,
            created_at: order.created_at || new Date().toISOString(),
            updated_at: order.created_at || new Date().toISOString(),
            orderCount: 0,
            totalSpent: 0,
            lastOrder: order.created_at || new Date().toISOString()
          });
        }

        const customer = customerMap.get(customerId)!;
        customer.orderCount += 1;
        customer.totalSpent += Number(order.total) || 0;
        
        if (order.created_at && order.created_at > customer.lastOrder) {
          customer.lastOrder = order.created_at;
        }
      });

      const customersArray = Array.from(customerMap.values());
      setCustomers(customersArray);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar clientes';
      console.error('Error fetching customers:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, [storeId]);

  const addCustomer = async (customerData: Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'orderCount' | 'totalSpent' | 'lastOrder'>) => {
    if (!rateLimit.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    try {
      const mockCustomer: Customer = {
        id: `${customerData.phone}-${customerData.name}`,
        ...customerData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        orderCount: 0,
        totalSpent: 0,
        lastOrder: new Date().toISOString()
      };

      setCustomers(prev => [mockCustomer, ...prev]);
      return mockCustomer;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar cliente');
      throw err;
    }
  };

  const updateCustomer = async (customerId: string, customerData: Partial<Customer>) => {
    if (!rateLimit.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    try {
      setCustomers(prev => prev.map(customer => 
        customer.id === customerId ? { ...customer, ...customerData } : customer
      ));
      return customerData;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar cliente');
      throw err;
    }
  };

  const deleteCustomer = async (customerId: string) => {
    if (!rateLimit.checkRateLimit()) {
      throw new Error('Rate limit exceeded');
    }

    try {
      setCustomers(prev => prev.filter(customer => customer.id !== customerId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar cliente');
      throw err;
    }
  };

  return {
    customers,
    loading,
    error,
    addCustomer,
    updateCustomer,
    deleteCustomer,
    refetch: fetchCustomers
  };
};
