
import { useState, useEffect } from 'react';
import { Product } from '@/types';

export const useStockManager = (products: Product[]) => {
  const [stockData, setStockData] = useState<Product[]>(products);

  // Reset stock daily at midnight
  useEffect(() => {
    const checkAndResetStock = () => {
      const now = new Date();
      const today = now.toDateString();

      const updatedProducts = stockData.map(product => {
        if (!product.daily_stock) return product;

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

  const reduceStock = (productId: string, quantity: number) => {
    setStockData(prev => prev.map(product => {
      if (product.id === productId && product.daily_stock) {
        return {
          ...product,
          current_stock: Math.max(0, (product.current_stock || 0) - quantity)
        };
      }
      return product;
    }));
  };

  const checkAvailability = (productId: string, requestedQuantity: number) => {
    const product = stockData.find(p => p.id === productId);
    if (!product) return false;

    // If no stock control, always available
    if (!product.daily_stock) return true;

    // Check if enough stock
    return (product.current_stock || 0) >= requestedQuantity;
  };

  const getAvailableStock = (productId: string) => {
    const product = stockData.find(p => p.id === productId);
    if (!product || !product.daily_stock) return Infinity;
    return product.current_stock || 0;
  };

  return {
    products: stockData,
    reduceStock,
    checkAvailability,
    getAvailableStock
  };
};
