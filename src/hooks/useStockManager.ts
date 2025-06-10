
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Product } from '@/types';

export const useStockManager = (products: Product[]) => {
  const [stockData, setStockData] = useState<Product[]>([]);

  // Sincronizar com produtos recebidos
  useEffect(() => {
    if (products && Array.isArray(products) && products.length > 0) {
      // Filtrar produtos válidos
      const validProducts = products.filter(p => p && p.id);
      setStockData(validProducts);
    } else {
      setStockData([]);
    }
  }, [products]);

  // Reset stock daily at midnight
  useEffect(() => {
    const checkAndResetStock = () => {
      if (!stockData || stockData.length === 0) return;
      
      const now = new Date();
      const today = now.toDateString();

      const updatedProducts = stockData.map(product => {
        if (!product || !product.daily_stock) return product;

        const lastReset = product.stock_last_reset ? 
          new Date(product.stock_last_reset).toDateString() : '';

        // If it's a new day, reset the stock
        if (lastReset !== today) {
          return {
            ...product,
            current_stock: product.daily_stock,
            stock_last_reset: now.toISOString()
          };
        }

        return product;
      });

      setStockData(updatedProducts);
    };

    // Check immediately
    checkAndResetStock();

    // Set up interval to check every hour
    const interval = setInterval(checkAndResetStock, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [stockData]);

  const checkAvailability = useCallback((productId: string, requestedQuantity: number) => {
    if (!productId || !stockData || !Array.isArray(stockData)) return false;
    
    const product = stockData.find(p => p && p.id === productId);
    if (!product) return false;

    // If no stock control, always available
    if (!product.daily_stock) return true;

    // Check if enough stock
    return (product.current_stock || 0) >= requestedQuantity;
  }, [stockData]);

  const getAvailableStock = useCallback((productId: string) => {
    if (!productId || !stockData || !Array.isArray(stockData)) return Infinity;
    
    const product = stockData.find(p => p && p.id === productId);
    if (!product || !product.daily_stock) return Infinity;
    return product.current_stock || 0;
  }, [stockData]);

  const reduceStock = useCallback((productId: string, quantity: number) => {
    if (!productId) return;
    
    setStockData(prev => prev.map(product => {
      if (product && product.id === productId && product.daily_stock) {
        return {
          ...product,
          current_stock: Math.max(0, (product.current_stock || 0) - quantity)
        };
      }
      return product;
    }));
  }, []);

  // Retorno estável usando useMemo
  return useMemo(() => ({
    products: stockData,
    reduceStock,
    checkAvailability,
    getAvailableStock
  }), [stockData, reduceStock, checkAvailability, getAvailableStock]);
};
