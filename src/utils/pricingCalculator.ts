
import { Product, ProductAddon } from '@/types';

export interface PricingCalculation {
  productTotal: number;
  addonsTotal: number;
  total: number;
}

export const calculatePricing = (
  product: Product,
  quantity: number,
  addons: ProductAddon[]
): PricingCalculation => {
  const productPrice = product.sale_price || product.price;
  const productTotal = productPrice * quantity;
  
  const addonsTotal = addons.reduce((sum, addon) => {
    return sum + (addon.price * (addon.quantity || 1));
  }, 0) * quantity;
  
  const total = productTotal + addonsTotal;
  
  return {
    productTotal,
    addonsTotal,
    total
  };
};

// Legacy class for backward compatibility
export class PricingCalculator {
  static calculateProductPrice(
    product: Product,
    quantity: number,
    addons: ProductAddon[]
  ) {
    const calculation = calculatePricing(product, quantity, addons);
    return {
      totalPrice: calculation.total,
      productPrice: calculation.productTotal,
      addonsPrice: calculation.addonsTotal
    };
  }
}
