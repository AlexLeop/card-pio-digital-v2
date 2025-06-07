
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
  
  let productTotal = 0;
  let addonsTotal = 0;
  
  // DEBUG: Adicionar logs temporários
  console.log('=== DEBUG PRICING ===');
  console.log('Product:', product.name);
  console.log('Product price:', productPrice);
  console.log('Max included quantity:', product.max_included_quantity);
  console.log('Addons:', addons);
  console.log('Quantity:', quantity);
  
  // Verifica se o produto tem configuração de quantidade máxima incluída
  if (product.max_included_quantity && addons.length > 0) {
    const totalAddonsSelected = addons.reduce((sum, addon) => sum + (addon.quantity || 1), 0);
    
    console.log('Total addons selected:', totalAddonsSelected);
    
    // Regra 1: Menos adicionais que o limite definido
    if (totalAddonsSelected < product.max_included_quantity) {
      console.log('APLICANDO REGRA 1: Menos adicionais que o limite');
      // CORREÇÃO: Ignora o preço do produto e cobra apenas pelos adicionais
      productTotal = 0;
      // Cobra a soma dos valores individuais de cada adicional × quantidade do produto
      addonsTotal = addons.reduce((sum, addon) => {
        return sum + (addon.price * (addon.quantity || 1));
      }, 0) * quantity;
      console.log('Product total (should be 0):', productTotal);
      console.log('Addons total:', addonsTotal);
    }
    // Regra 2: Quantidade exata de adicionais permitida
    else if (totalAddonsSelected === product.max_included_quantity) {
      // Cobra o preço fixo do produto (adicionais inclusos)
      productTotal = productPrice * quantity;
      addonsTotal = 0;
    }
    // Regra 3: Mais adicionais do que o permitido
    else {
      // Cobra o preço fixo + todos os adicionais
      productTotal = productPrice * quantity;
      addonsTotal = addons.reduce((sum, addon) => {
        return sum + (addon.price * (addon.quantity || 1));
      }, 0) * quantity;
    }
  } else {
    // Comportamento padrão (sem regras especiais)
    productTotal = productPrice * quantity;
    addonsTotal = addons.reduce((sum, addon) => {
      return sum + (addon.price * (addon.quantity || 1));
    }, 0) * quantity;
  }
  
  const total = productTotal + addonsTotal;
  
  console.log('FINAL RESULT:');
  console.log('Product Total:', productTotal);
  console.log('Addons Total:', addonsTotal);
  console.log('Final Total:', total);
  console.log('=== END DEBUG ===');
  
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
