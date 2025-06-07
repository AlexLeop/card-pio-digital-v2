
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Store } from '@/types';

export const useStores = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setStores((data || []) as Store[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar lojas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStores();
  }, []);

  const addStore = async (storeData: Omit<Store, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .insert([storeData])
        .select()
        .single();

      if (error) throw error;

      setStores(prev => [data as Store, ...prev]);
      return data as Store;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar loja');
      throw err;
    }
  };

  const updateStore = async (storeId: string, storeData: Partial<Store>) => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .update(storeData)
        .eq('id', storeId)
        .select()
        .single();

      if (error) throw error;

      setStores(prev => prev.map(store => 
        store.id === storeId ? { ...store, ...data } as Store : store
      ));
      return data as Store;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar loja');
      throw err;
    }
  };

  const deleteStore = async (storeId: string) => {
    try {
      const { error } = await supabase
        .from('stores')
        .delete()
        .eq('id', storeId);

      if (error) throw error;

      setStores(prev => prev.filter(store => store.id !== storeId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar loja');
      throw err;
    }
  };

  return {
    stores,
    loading,
    error,
    addStore,
    updateStore,
    deleteStore,
    refetch: fetchStores
  };
};
