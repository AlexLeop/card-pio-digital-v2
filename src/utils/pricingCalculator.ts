
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
  
  let addonsTotal = 0;
  
  // Verifica se o produto tem configuração de quantidade máxima incluída
  if (product.max_included_quantity && addons.length > 0) {
    const totalAddonsSelected = addons.reduce((sum, addon) => sum + (addon.quantity || 1), 0);
    
    // Regra 1: Menos adicionais que o limite definido
    if (totalAddonsSelected < product.max_included_quantity) {
      // Cobra a soma dos valores individuais de cada adicional
      addonsTotal = addons.reduce((sum, addon) => {
        return sum + (addon.price * (addon.quantity || 1));
      }, 0) * quantity;
    }
    // Regra 2: Quantidade exata de adicionais permitida
    else if (totalAddonsSelected === product.max_included_quantity) {
      // Não cobra pelos adicionais (já inclusos no preço base)
      addonsTotal = 0;
    }
    // Regra 3: Mais adicionais do que o permitido
    else {
      // Cobra a soma dos valores de todos os adicionais escolhidos
      addonsTotal = addons.reduce((sum, addon) => {
        return sum + (addon.price * (addon.quantity || 1));
      }, 0) * quantity;
    }
  } else {
    // Comportamento padrão (sem regras especiais)
    addonsTotal = addons.reduce((sum, addon) => {
      return sum + (addon.price * (addon.quantity || 1));
    }, 0) * quantity;
  }
  
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
