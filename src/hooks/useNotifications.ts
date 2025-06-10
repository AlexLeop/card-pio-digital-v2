import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface NotificationSettings {
  lowStockThreshold: number;
  enableEmailAlerts: boolean;
  enablePushNotifications: boolean;
  checkInterval: number; // em minutos
}

export const useNotifications = (storeId: string) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    lowStockThreshold: 5,
    enableEmailAlerts: true,
    enablePushNotifications: true,
    checkInterval: 30
  });
  const { toast } = useToast();

  useEffect(() => {
    if (settings.enablePushNotifications) {
      const interval = setInterval(() => {
        checkStockLevels();
      }, settings.checkInterval * 60 * 1000);

      return () => clearInterval(interval);
    }
  }, [storeId, settings]);

  const checkStockLevels = async () => {
    try {
      const { data: products } = await supabase
        .from('products')
        .select('id, name, current_stock, daily_stock')
        .eq('store_id', storeId)
        .not('daily_stock', 'is', null)
        .lte('current_stock', settings.lowStockThreshold);

      if (products && products.length > 0) {
        const outOfStock = products.filter(p => p.current_stock === 0);
        const lowStock = products.filter(p => p.current_stock > 0 && p.current_stock <= settings.lowStockThreshold);

        if (outOfStock.length > 0) {
          toast({
            title: "⚠️ Produtos Esgotados",
            description: `${outOfStock.length} produto(s) estão esgotados`,
            variant: "destructive"
          });
        }

        if (lowStock.length > 0) {
          toast({
            title: "📦 Estoque Baixo",
            description: `${lowStock.length} produto(s) com estoque baixo`,
            variant: "default"
          });
        }
      }
    } catch (error) {
      console.error('Erro ao verificar níveis de estoque:', error);
    }
  };

  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  return {
    settings,
    updateSettings,
    checkStockLevels
  };
};