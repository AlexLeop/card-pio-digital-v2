import { supabase } from '@/integrations/supabase/client';
import { 
  CartItem, 
  Product, 
  ProductAddon, 
  Order, 
  OrderItem,
  AddressData,
  CustomerData,
  OrderData,
  CreateOrderParams,
  CreateOrderResult
} from '@/types';
import { calculatePricing } from './pricingCalculator';

/**
 * Valida os dados necessários para criar um pedido
 */
export const validateOrderData = (params: CreateOrderParams): string[] => {
  const errors: string[] = [];

  // Validar dados do cliente
  if (!params.customerData.name?.trim()) {
    errors.push('Nome do cliente é obrigatório');
  }

  if (!params.customerData.phone?.trim()) {
    errors.push('Telefone do cliente é obrigatório');
  }

  // Validar itens do pedido
  if (!params.items || params.items.length === 0) {
    errors.push('Pelo menos um item deve ser adicionado ao pedido');
  }

  // Validar endereço se for delivery
  if (params.orderData.delivery_type === 'delivery') {
    if (!params.addressData) {
      errors.push('Endereço é obrigatório para entrega');
    } else {
      if (!params.addressData.street?.trim()) {
        errors.push('Rua é obrigatória');
      }
      if (!params.addressData.number?.trim()) {
        errors.push('Número é obrigatório');
      }
      if (!params.addressData.neighborhood?.trim()) {
        errors.push('Bairro é obrigatório');
      }
      if (!params.addressData.city?.trim()) {
        errors.push('Cidade é obrigatória');
      }
    }
  }

  // Validar método de pagamento
  if (!params.orderData.payment_method?.trim()) {
    errors.push('Método de pagamento é obrigatório');
  }

  return errors;
};

/**
 * Calcula o total do pedido usando a calculadora de preços unificada
 */
export const calculateOrderTotal = (items: CartItem[], deliveryFee: number = 0) => {
  const subtotal = items.reduce((sum, item) => {
    const calculation = calculatePricing(
      item.product,
      item.quantity,
      item.addons.map(addon => ({ ...addon, quantity: addon.quantity || 1 }))
    );
    return sum + calculation.total;
  }, 0);

  const total = subtotal + deliveryFee;

  return {
    subtotal: Number(subtotal.toFixed(2)),
    deliveryFee: Number(deliveryFee.toFixed(2)),
    total: Number(total.toFixed(2))
  };
};

/**
 * Cria um pedido completo com todos os itens e addons
 */
export const createOrder = async (params: CreateOrderParams): Promise<CreateOrderResult> => {
  // Validar dados
  const validationErrors = validateOrderData(params);
  if (validationErrors.length > 0) {
    throw new Error(`Dados inválidos: ${validationErrors.join(', ')}`);
  }

  // Calcular totais
  const totals = calculateOrderTotal(params.items, params.deliveryFee || 0);

  try {
    // Criar o pedido principal
    const orderToCreate = {
      customer_name: params.customerData.name,
      customer_phone: params.customerData.phone,
      customer_email: params.customerData.email || null,
      delivery_type: params.orderData.delivery_type,
      payment_method: params.orderData.payment_method,
      status: 'pending',
      subtotal: totals.subtotal,
      delivery_fee: totals.deliveryFee,
      total: totals.total,
      notes: params.orderData.notes || null,
      scheduled_for: params.orderData.scheduled_for || null,
      store_id: params.orderData.store_id,
      // Campos de endereço (apenas para delivery)
      street: params.orderData.delivery_type === 'delivery' ? params.addressData?.street : null,
      number: params.orderData.delivery_type === 'delivery' ? params.addressData?.number : null,
      complement: params.orderData.delivery_type === 'delivery' ? params.addressData?.complement : null,
      neighborhood: params.orderData.delivery_type === 'delivery' ? params.addressData?.neighborhood : null,
      city: params.orderData.delivery_type === 'delivery' ? params.addressData?.city : null,
      state: params.orderData.delivery_type === 'delivery' ? params.addressData?.state : null,
      zip: params.orderData.delivery_type === 'delivery' ? params.addressData?.zip_code : null,
      // Campo de endereço legado para compatibilidade
      address: params.orderData.delivery_type === 'delivery' && params.addressData ? 
        `${params.addressData.street}, ${params.addressData.number}${params.addressData.complement ? `, ${params.addressData.complement}` : ''} - ${params.addressData.neighborhood}` : 
        null
    };

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderToCreate])
      .select()
      .single();

    if (orderError) {
      throw orderError;
    }

    // Criar itens do pedido
    const createdOrderItems: OrderItem[] = [];
    const orderItemAddons: any[] = [];

    for (const cartItem of params.items) {
      const calculation = calculatePricing(
        cartItem.product,
        cartItem.quantity,
        cartItem.addons.map(addon => ({ ...addon, quantity: addon.quantity || 1 }))
      );

      const orderItem = {
        order_id: order.id,
        product_id: cartItem.product.id,
        quantity: cartItem.quantity,
        price: Number(calculation.total.toFixed(2)),
        notes: cartItem.notes?.trim() || null
      };

      const { data: createdItem, error: itemError } = await supabase
        .from('order_items')
        .insert([orderItem])
        .select()
        .single();

      if (itemError) {
        throw itemError;
      }

      createdOrderItems.push(createdItem);

      // Preparar addons do item
      for (const addon of cartItem.addons) {
        if (addon.quantity && addon.quantity > 0) {
          orderItemAddons.push({
            order_item_id: createdItem.id,
            addon_item_id: addon.id,
            price: Number((addon.price * addon.quantity).toFixed(2))
          });
        }
      }
    }

    // Inserir todos os addons dos itens
    if (orderItemAddons.length > 0) {
      const { error: addonsError } = await supabase
        .from('order_item_addons')
        .insert(orderItemAddons);

      if (addonsError) {
        throw addonsError;
      }
    }

    return {
      order,
      orderItems: createdOrderItems
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Função auxiliar para criar pedido simples (compatibilidade com CreateOrderModal)
 */
export const createSimpleOrder = async ({
  customerName,
  customerPhone,
  items,
  deliveryType = 'delivery',
  paymentMethod,
  storeId,
  notes
}: {
  customerName: string;
  customerPhone: string;
  items: { product: Product; quantity: number; addons: ProductAddon[]; notes?: string }[];
  deliveryType?: 'delivery' | 'pickup';
  paymentMethod: string;
  storeId: string;
  notes?: string;
}) => {
  return createOrder({
    customerData: {
      name: customerName,
      phone: customerPhone
    },
    orderData: {
      delivery_type: deliveryType,
      payment_method: paymentMethod,
      notes,
      store_id: storeId
    },
    items: items.map(item => ({
      product: item.product,
      quantity: item.quantity,
      addons: item.addons,
      notes: item.notes
    }))
  });
};