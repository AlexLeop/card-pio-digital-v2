import { z } from 'zod';

// Schema para Store
export const storeSchema = z.object({
  name: z.string().min(1, 'Nome da loja é obrigatório').max(100, 'Nome muito longo'),
  slug: z.string().min(1, 'Slug é obrigatório').regex(/^[a-z0-9-]+$/, 'Slug deve conter apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  whatsapp: z.string().min(10, 'WhatsApp deve ter pelo menos 10 dígitos').regex(/^\d+$/, 'WhatsApp deve conter apenas números'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zip_code: z.string().optional(), // Corrigido de 'zip' para 'zip_code'
  primary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  secondary_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  accent_color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Cor deve estar no formato hexadecimal').optional(),
  delivery_fee: z.number().min(0, 'Taxa de entrega não pode ser negativa').optional(),
  minimum_order: z.number().min(0, 'Pedido mínimo não pode ser negativo').optional(),
  opening_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM').optional(),
  closing_time: z.string().regex(/^\d{2}:\d{2}$/, 'Horário deve estar no formato HH:MM').optional(),
  is_active: z.boolean(),
  delivery_available: z.boolean(),
  pickup_available: z.boolean(),
  accept_credit_card: z.boolean().optional(),
  accept_pix: z.boolean().optional(),
  accept_cash: z.boolean().optional(),
});

// Schema para Category
export const categorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(50, 'Nome muito longo'),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  sort_order: z.number().int().min(0, 'Ordem deve ser um número positivo'),
  is_active: z.boolean(),
  store_id: z.string().uuid('ID da loja inválido'),
  parent_id: z.string().uuid('ID do pai inválido').optional(),
});

// Schema para Product
export const productSchema = z.object({
  name: z.string().min(1, 'Nome do produto é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().max(500, 'Descrição muito longa').optional(),
  price: z.number().min(0.01, 'Preço deve ser maior que zero'),
  sale_price: z.number().min(0, 'Preço promocional não pode ser negativo').optional(),
  is_featured: z.boolean(),
  is_available: z.boolean(),
  is_active: z.boolean(),
  store_id: z.string().uuid('ID da loja inválido'),
  category_id: z.string().uuid('ID da categoria inválido'),
  preparation_time: z.number().int().min(0, 'Tempo de preparo não pode ser negativo').optional(),
  allow_same_day_scheduling: z.boolean().optional(),
  has_addons: z.boolean().optional(),
  daily_stock: z.number().int().min(0, 'Estoque não pode ser negativo').optional(),
  current_stock: z.number().int().min(0, 'Estoque atual não pode ser negativo').optional(),
  max_included_quantity: z.number().int().min(1, 'Quantidade máxima deve ser pelo menos 1').optional(),
  excess_unit_price: z.number().min(0, 'Preço excedente não pode ser negativo').optional(),
}).refine((data) => {
  // Se tem sale_price, deve ser menor que o price
  if (data.sale_price && data.sale_price >= data.price) {
    return false;
  }
  // Se tem max_included_quantity, deve ter excess_unit_price
  if (data.max_included_quantity && !data.excess_unit_price) {
    return false;
  }
  return true;
}, {
  message: 'Configuração de preços inválida',
  path: ['price']
});

// Schema para ProductAddon
export const productAddonSchema = z.object({
  name: z.string().min(1, 'Nome do adicional é obrigatório').max(50, 'Nome muito longo'),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  is_available: z.boolean(),
  sort_order: z.number().int().min(0, 'Ordem deve ser um número positivo'),
  addon_category_id: z.string().uuid('ID da categoria inválido').optional(),
  max_quantity: z.number().int().min(1, 'Quantidade máxima deve ser pelo menos 1').optional(),
  fixed_price_for_max: z.number().min(0, 'Preço fixo não pode ser negativo').optional(),
  excess_unit_price: z.number().min(0, 'Preço excedente não pode ser negativo').optional(),
  quantity: z.number().int().min(1, 'Quantidade deve ser pelo menos 1').optional(),
});

// Schema para AddonCategory
export const addonCategorySchema = z.object({
  name: z.string().min(1, 'Nome da categoria é obrigatório').max(50, 'Nome muito longo'),
  description: z.string().max(200, 'Descrição muito longa').optional(),
  is_required: z.boolean(),
  is_multiple: z.boolean(),
  min_select: z.number().int().min(0, 'Seleção mínima não pode ser negativa'),
  max_select: z.number().int().min(1, 'Seleção máxima deve ser pelo menos 1'),
  is_order_bump: z.boolean(),
  sort_order: z.number().int().min(0, 'Ordem deve ser um número positivo'),
  store_id: z.string().uuid('ID da loja inválido'),
  product_id: z.string().uuid('ID do produto inválido').optional(),
  is_active: z.boolean(),
  order_bump_description: z.string().max(200, 'Descrição muito longa').optional(),
}).refine((data) => {
  // min_select não pode ser maior que max_select
  return data.min_select <= data.max_select;
}, {
  message: 'Seleção mínima não pode ser maior que a máxima',
  path: ['min_select']
});

// Schema para Customer
export const customerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').regex(/^\d+$/, 'Telefone deve conter apenas números'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().max(200, 'Endereço muito longo').optional(),
  street: z.string().max(100, 'Rua muito longa').optional(),
  number: z.string().max(10, 'Número muito longo').optional(),
  neighborhood: z.string().max(50, 'Bairro muito longo').optional(),
  city: z.string().max(50, 'Cidade muito longa').optional(),
  state: z.string().max(2, 'Estado deve ter 2 caracteres').optional(),
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
  complement: z.string().max(100, 'Complemento muito longo').optional(),
  store_id: z.string().uuid('ID da loja inválido'),
});

// Schema para Order
export const orderSchema = z.object({
  customer_name: z.string().min(1, 'Nome do cliente é obrigatório').max(100, 'Nome muito longo'),
  customer_phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').regex(/^\d+$/, 'Telefone deve conter apenas números'),
  customer_email: z.string().email('Email inválido').optional().or(z.literal('')),
  address: z.string().max(200, 'Endereço muito longo').optional(),
  street: z.string().max(100, 'Rua muito longa').optional(),
  number: z.string().max(10, 'Número muito longo').optional(),
  neighborhood: z.string().max(50, 'Bairro muito longo').optional(),
  city: z.string().max(50, 'Cidade muito longa').optional(),
  state: z.string().max(2, 'Estado deve ter 2 caracteres').optional(),
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').optional(),
  complement: z.string().max(100, 'Complemento muito longo').optional(),
  reference_point: z.string().max(100, 'Ponto de referência muito longo').optional(),
  notes: z.string().max(500, 'Observações muito longas').optional(),
  subtotal: z.number().min(0, 'Subtotal não pode ser negativo'),
  delivery_fee: z.number().min(0, 'Taxa de entrega não pode ser negativa').optional(),
  total: z.number().min(0.01, 'Total deve ser maior que zero'),
  payment_method: z.enum(['pix', 'credit_card', 'cash'], {
    errorMap: () => ({ message: 'Método de pagamento inválido' })
  }),
  delivery_type: z.enum(['delivery', 'pickup'], {
    errorMap: () => ({ message: 'Tipo de entrega inválido' })
  }),
  scheduled_for: z.string().datetime('Data de agendamento inválida').optional(),
  store_id: z.string().uuid('ID da loja inválido'),
}).refine((data) => {
  // Se é delivery, deve ter endereço
  if (data.delivery_type === 'delivery' && !data.address && !data.street) {
    return false;
  }
  // Total deve ser igual a subtotal + delivery_fee
  const expectedTotal = data.subtotal + (data.delivery_fee || 0);
  return Math.abs(data.total - expectedTotal) < 0.01;
}, {
  message: 'Dados do pedido inconsistentes',
  path: ['total']
});

// Schema para OrderItem
export const orderItemSchema = z.object({
  order_id: z.string().uuid('ID do pedido inválido'),
  product_id: z.string().uuid('ID do produto inválido'),
  quantity: z.number().int().min(1, 'Quantidade deve ser pelo menos 1'),
  price: z.number().min(0, 'Preço não pode ser negativo'),
  notes: z.string().max(200, 'Observações muito longas').optional(),
});

// Schemas específicos para CheckoutModal
export const checkoutCustomerSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').regex(/^\(?\d{2}\)?[\s-]?\d{4,5}[\s-]?\d{4}$/, 'Formato de telefone inválido'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

export const checkoutAddressSchema = z.object({
  zip_code: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
  street: z.string().min(1, 'Rua é obrigatória').max(100, 'Rua muito longa'),
  number: z.string().min(1, 'Número é obrigatório').max(10, 'Número muito longo'),
  complement: z.string().max(100, 'Complemento muito longo').optional(),
  neighborhood: z.string().min(1, 'Bairro é obrigatório').max(50, 'Bairro muito longo'),
  city: z.string().min(1, 'Cidade é obrigatória').max(50, 'Cidade muito longa'),
  state: z.string().length(2, 'Estado deve ter 2 caracteres'),
});

export const checkoutOrderSchema = z.object({
  delivery_type: z.enum(['delivery', 'pickup'], {
    errorMap: () => ({ message: 'Tipo de entrega inválido' })
  }),
  notes: z.string().max(500, 'Observações muito longas').optional(),
  scheduled_for: z.string().optional(),
});

// Schema completo para validação do checkout
export const checkoutFormSchema = z.object({
  customerData: checkoutCustomerSchema,
  addressData: checkoutAddressSchema.optional(),
  orderData: checkoutOrderSchema,
}).refine((data) => {
  // Se é delivery, endereço é obrigatório
  if (data.orderData.delivery_type === 'delivery' && !data.addressData) {
    return false;
  }
  return true;
}, {
  message: 'Endereço é obrigatório para entrega',
  path: ['addressData']
});

// Schemas para formulários específicos
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
  name: z.string().min(1, 'Nome é obrigatório'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Senhas não coincidem',
  path: ['confirmPassword'],
});

// Tipos inferidos dos schemas
export type StoreFormData = z.infer<typeof storeSchema>;
export type CategoryFormData = z.infer<typeof categorySchema>;
export type ProductFormData = z.infer<typeof productSchema>;
export type ProductAddonFormData = z.infer<typeof productAddonSchema>;
export type AddonCategoryFormData = z.infer<typeof addonCategorySchema>;
export type CustomerFormData = z.infer<typeof customerSchema>;
export type OrderFormData = z.infer<typeof orderSchema>;
export type OrderItemFormData = z.infer<typeof orderItemSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;

// Tipos inferidos
export type CheckoutCustomerData = z.infer<typeof checkoutCustomerSchema>;
export type CheckoutAddressData = z.infer<typeof checkoutAddressSchema>;
export type CheckoutOrderData = z.infer<typeof checkoutOrderSchema>;
export type CheckoutFormData = z.infer<typeof checkoutFormSchema>;