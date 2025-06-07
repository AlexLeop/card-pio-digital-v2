
import { useState, useCallback } from 'react';
import { ProductAddon } from '@/types';

export const useAddonManager = (availableAddons: ProductAddon[]) => {
  const [selectedAddons, setSelectedAddons] = useState<ProductAddon[]>([]);

  const addAddon = useCallback((addon: ProductAddon, quantity: number = 1) => {
    setSelectedAddons(prev => {
      const existingIndex = prev.findIndex(a => a.id === addon.id);
      
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 0) + quantity
        };
        return updated;
      } else {
        return [...prev, { ...addon, quantity }];
      }
    });
  }, []);

  const removeAddon = useCallback((addonId: string) => {
    setSelectedAddons(prev => prev.filter(a => a.id !== addonId));
  }, []);

  const updateAddonQuantity = useCallback((addonId: string, quantity: number) => {
    if (quantity <= 0) {
      removeAddon(addonId);
      return;
    }
    
    setSelectedAddons(prev => 
      prev.map(addon => 
        addon.id === addonId 
          ? { ...addon, quantity }
          : addon
      )
    );
  }, [removeAddon]);

  const clearAddons = useCallback(() => {
    setSelectedAddons([]);
  }, []);

  const getTotalAddonsPrice = useCallback(() => {
    return selectedAddons.reduce((total, addon) => 
      total + (addon.price * (addon.quantity || 1)), 0
    );
  }, [selectedAddons]);

  const getTotalAddonsQuantity = useCallback(() => {
    return selectedAddons.reduce((total, addon) => 
      total + (addon.quantity || 1), 0
    );
  }, [selectedAddons]);

  return {
    selectedAddons,
    addAddon,
    removeAddon,
    updateAddonQuantity,
    clearAddons,
    getTotalAddonsPrice,
    getTotalAddonsQuantity,
    setSelectedAddons
  };
};
