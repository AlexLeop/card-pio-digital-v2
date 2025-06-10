// ...existing code...

// ===== BUSINESS HOURS & SCHEDULING =====
export interface BusinessHours {
  [key: string]: { open: string; close: string; closed: boolean };
}

export interface WeeklySchedule {
  [key: string]: {
    open: string;
    close: string;
    closed: boolean;
    delivery_slots?: string[];
    pickup_slots?: string[];
  };
}

export interface SpecialDate {
  date: string;
  closed: boolean;
  special_hours?: { open: string; close: string };
  reason?: string;
}

export interface DeliverySchedule {
  enabled: boolean;
  slots: SchedulingSlot[];
  advance_days: number;
  cutoff_time: string;
}

export interface PickupSchedule {
  enabled: boolean;
  slots: SchedulingSlot[];
  advance_days: number;
  cutoff_time: string;
}

export interface SchedulingSlot {
  time: string;
  available: boolean;
  max_orders?: number;
  current_orders?: number;
}

export interface SchedulingOption {
  date: string;
  time: string;
  available: boolean;
  reason?: string;
}

// ===== ADDRESS & LOCATION =====
export interface AddressData {
  zip_code: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  reference_point?: string;
}

// ===== CUSTOMER DATA =====
export interface CustomerData {
  name: string;
  phone: string;
  email?: string;
}

export interface Customer extends CustomerData {
  id: string;
  address?: AddressData;
  store_id: string;
  created_at: string;
  updated_at: string;
  order_count: number;
  total_spent: number;
  last_order?: string;
}

// ===== PRODUCT & CATALOG =====
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
  nutritional_info?: NutritionalInfo;
  daily_stock?: number;
  current_stock?: number;
  max_included_quantity?: number;
  excess_unit_price?: number;
  stock_last_reset?: string;
  track_stock?: boolean;
}

export interface NutritionalInfo {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sodium?: number;
}

export interface StockConfig {
  daily_stock?: number;
  current_stock?: number;
  max_included_quantity?: number;
  excess_unit_price?: number;
  stock_last_reset?: string;
  track_stock: boolean;
}

// ===== ADDONS =====
export interface AddonItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  is_active: boolean;
  quantity?: number;
  max_quantity?: number;
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

// ===== ORDERS =====
export interface OrderData {
  delivery_type: 'delivery' | 'pickup';
  payment_method: 'cash' | 'credit_card' | 'pix';
  notes?: string;
  scheduled_for?: string;
  store_id: string;
}

export interface Order extends OrderData {
  id: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  address?: AddressData;
  subtotal: number;
  delivery_fee?: number;
  total: number;
  status: OrderStatus;
  created_at: string;
  mercado_pago_payment_id?: string;
}

export type OrderStatus = 
  | 'pending' 
  | 'confirmed' 
  | 'preparing' 
  | 'ready' 
  | 'out_for_delivery' 
  | 'delivered' 
  | 'cancelled';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  price: number;
  notes?: string;
  created_at: string;
  product?: Pick<Product, 'id' | 'name' | 'price' | 'description'>;
  addons?: OrderItemAddon[];
}

export interface OrderItemAddon {
  id: string;
  order_item_id: string;
  addon_item_id: string;
  price: number;
  quantity: number;
  created_at: string;
  addon_item?: Pick<AddonItem, 'id' | 'name' | 'price'>;
}

// ===== CART =====
export interface CartItem {
  product: Product;
  quantity: number;
  addons: AddonItem[];
  notes?: string;
  scheduled_for?: string;
}

// ===== PRICING =====
export interface PricingCalculation {
  product_total: number;
  addons_total: number;
  subtotal: number;
  delivery_fee?: number;
  total: number;
}

// ===== FORMS & VALIDATION =====
// ===== ORDER CREATION =====
export interface CreateOrderParams {
  customerData: CustomerData;
  addressData?: AddressData;
  orderData: OrderData;
  items: CartItem[];
  deliveryFee?: number;
}

export interface CreateOrderResult {
  order: Order;
  orderItems: OrderItem[];
}

export interface OrderData {
  delivery_type: 'delivery' | 'pickup';
  payment_method: string;
  notes?: string;
  scheduled_for?: string;
  store_id: string;
}

// ===== SETTINGS =====
export interface StoreSettings {
  basic_info: {
    name: string;
    description?: string;
    address?: AddressData;
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
    mercado_pago_access_token?: string;
    mercado_pago_public_key?: string;
  };
  scheduling: {
    allow_scheduling: boolean;
    advance_days: number;
    same_day_cutoff_time?: string;
    delivery_schedule?: DeliverySchedule;
    pickup_schedule?: PickupSchedule;
  };
}

// ===== IMPORT/EXPORT =====
export interface ImportData {
  products?: ImportProduct[];
  categories?: ImportCategory[];
  addons?: ImportAddon[];
}

export interface ImportProduct {
  name: string;
  description?: string;
  price: number;
  category: string;
  ingredients?: string[];
  allergens?: string[];
}

export interface ImportCategory {
  name: string;
  description?: string;
}

export interface ImportAddon {
  name: string;
  description?: string;
  price: number;
  category: string;
}

// ===== UTILITY TYPES =====
export interface UpsellProduct {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  description?: string;
}

export interface StockItem {
  product_id: string;
  date: string;
  initial_stock: number;
  current_stock: number;
  reserved_stock: number;
}

// ===== API RESPONSES =====
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// ===== COMPONENT PROPS =====
export interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface BaseFormProps<T> {
  data?: T;
  onSubmit: (data: T) => void | Promise<void>;
  onCancel?: () => void;
  isLoading?: boolean;
}

// ===== LEGACY COMPATIBILITY =====
// Manter temporariamente para compatibilidade
/** @deprecated Use AddressData instead */
export interface Address extends AddressData {}

/** @deprecated Use CustomerData instead */
export interface CustomerInfo extends CustomerData {}

/** @deprecated Use OrderData instead */
export interface OrderInfo extends OrderData {}
