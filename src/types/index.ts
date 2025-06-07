export interface Store {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
  cover_image_url?: string;
  whatsapp: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  primary_color?: string;
  secondary_color?: string;
  accent_color?: string;
  delivery_fee?: number;
  minimum_order?: number;
  opening_time?: string;
  closing_time?: string;
  is_active: boolean;
  delivery_available: boolean;
  pickup_available: boolean;
  pickup_address?: string;
  pickup_instructions?: string;
  scheduling_deadline?: string;
  order_limit_time?: string;
  owner_id: string;
  created_at: string;
  accept_credit_card?: boolean;
  accept_pix?: boolean;
  accept_cash?: boolean;
  mercado_pago_access_token?: string;
  mercado_pago_public_key?: string;
  business_hours?: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
  weekly_schedule?: any;
  special_dates?: any;
  allow_scheduling?: boolean;
  same_day_cutoff_time?: string;
  delivery_schedule?: any;
  pickup_schedule?: any;
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  store_id: string;
  parent_id?: string;
  created_at: string;
}

export interface ProductImage {
  url: string;
  is_primary: boolean;
  order: number;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  images?: ProductImage[];
  price: number;
  sale_price?: number;
  is_featured: boolean;
  is_available: boolean;
  is_active: boolean;
  store_id: string;
  category_id: string;
  preparation_time?: number;
  allow_same_day_scheduling?: boolean;
  has_addons?: boolean;
  created_at: string;
  ingredients?: string[];
  allergens?: string[];
  nutritional_info?: any;
  daily_stock?: number;
  current_stock?: number;
  max_included_quantity?: number;
  excess_unit_price?: number;
  stock_last_reset?: string;
}

export interface AddonItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
  quantity?: number;
}

export interface AddonCategory {
  id: string;
  name: string;
  description?: string;
  is_required: boolean;
  is_multiple: boolean;
  min_select: number;
  max_select: number;
  is_order_bump: boolean;
  sort_order: number;
  store_id: string;
  product_id?: string;
  is_active: boolean;
  created_at: string;
  order_bump_description?: string;
  order_bump_image_url?: string;
  addon_items?: AddonItem[];
}

export interface ProductAddon {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  sort_order: number;
  addon_category_id?: string;
  max_quantity?: number;
  fixed_price_for_max?: number;
  excess_unit_price?: number;
  created_at: string;
  quantity?: number;
}

export interface Order {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  address?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip?: string;
  complement?: string;
  reference_point?: string;
  notes?: string;
  subtotal: number;
  delivery_fee?: number;
  total: number;
  payment_method: string;
  status: string;
  delivery_type: 'delivery' | 'pickup';
  scheduled_for?: string;
  store_id: string;
  created_at: string;
  mercado_pago_payment_id?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  notes?: string;
  created_at: string;
  products?: { name: string; price: number; } | Product;
  order_item_addons?: OrderItemAddon[];
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_item_id: string;
  price: number;
  created_at: string;
  addon_items?: ProductAddon;
}

export interface CartItem {
  product: Product;
  quantity: number;
  addons: ProductAddon[];
  notes?: string;
  scheduled_for?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  complement?: string;
  store_id: string;
  created_at: string;
  updated_at: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string;
}

export interface StoreSettings {
  basic_info: {
    name: string;
    description?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    phone: string;
    email?: string;
  };
  delivery: {
    delivery_available: boolean;
    pickup_available: boolean;
    delivery_fee: number;
    minimum_order: number;
    delivery_radius?: number;
    opening_time?: string;
    closing_time?: string;
  };
  appearance: {
    logo_url?: string;
    cover_image_url?: string;
    primary_color?: string;
    secondary_color?: string;
    accent_color?: string;
  };
  payment: {
    accept_cash: boolean;
    accept_credit_card: boolean;
    accept_pix: boolean;
  };
}

export interface ImportData {
  products?: Array<{
    name: string;
    description?: string;
    price: number;
    category: string;
    ingredients?: string[];
    allergens?: string[];
  }>;
  categories?: Array<{
    name: string;
    description?: string;
  }>;
  addons?: Array<{
    name: string;
    description?: string;
    price: number;
    category: string;
  }>;
}

export interface UpsellProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

export interface SchedulingOption {
  date: string;
  time: string;
  available: boolean;
  reason?: string;
}

export interface StockItem {
  product_id: string;
  date: string;
  initial_stock: number;
  current_stock: number;
  reserved_stock: number;
}

export interface PricingCalculation {
  productTotal: number;
  addonsTotal: number;
  total: number;
}
