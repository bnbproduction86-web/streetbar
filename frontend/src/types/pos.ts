export interface Outlet {
  id: number;
  name: string;
  legal_name?: string;
  phone: string;
  email: string;
  address: string;
  tax_percentage: number;
  service_percentage: number;
  receipt_header?: string;
  receipt_footer?: string;
  currency_symbol: string;
}

export interface UserStaff {
  id: number;
  name: string;
  email: string;
  phone?: string;
  pin_code: string;
  role: 'super_admin' | 'manager' | 'cashier' | 'bartender';
  avatar_url?: string;
  is_active: boolean;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string;
  sort_order: number;
  is_active: boolean;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  sku?: string;
  additional_price: number;
  cost_price: number;
  stock: number;
  is_active: boolean;
}

export interface ModifierItem {
  id: number;
  group_id: number;
  name: string;
  price: number;
  cost_price: number;
  is_active: boolean;
}

export interface ModifierGroup {
  id: number;
  name: string;
  selection_type: 'single' | 'multiple';
  is_required: boolean;
  min_select: number;
  max_select: number;
  items: ModifierItem[];
}

export interface Product {
  id: number;
  category_id: number;
  sku: string;
  barcode?: string;
  name: string;
  description?: string;
  image_url?: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  track_stock: boolean;
  current_stock: number;
  min_stock_alert: number;
  is_favorite: boolean;
  is_active: boolean;
  variants?: ProductVariant[];
  modifier_groups?: ModifierGroup[];
  category?: Category;
}

export interface PosTable {
  id: number;
  table_number: string;
  section: string;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved' | 'open_tab';
  current_guest_name?: string;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  tier: 'regular' | 'silver' | 'gold' | 'platinum_vip';
  loyalty_points: number;
  total_spend: number;
}

export interface Promotion {
  id: number;
  name: string;
  code?: string;
  type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'happy_hour';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount?: number;
  buy_quantity?: number;
  get_quantity?: number;
  start_time?: string;
  end_time?: string;
  days_active?: string;
  is_active: boolean;
}

export interface CartItem {
  id: string; // unique cart row id
  product: Product;
  variant?: ProductVariant;
  selectedModifiers: ModifierItem[];
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
}

export interface OrderPayment {
  id?: number;
  payment_method: 'cash' | 'qris' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'split';
  amount: number;
  reference_number?: string;
}

export interface Order {
  id: number;
  invoice_number: string;
  outlet_id: number;
  cashier_id: number;
  cashier_name?: string;
  shift_id: number;
  customer_id?: number;
  customer?: Customer;
  table_id?: number;
  table?: PosTable;
  order_type: 'dine_in' | 'takeaway' | 'bar_tab' | 'delivery';
  status: 'pending' | 'completed' | 'voided' | 'refunded';
  subtotal: number;
  discount_amount: number;
  promotion_id?: number;
  promotion_name?: string;
  tax_amount: number;
  service_charge: number;
  grand_total: number;
  total_cost_price: number;
  paid_amount: number;
  change_amount: number;
  payment_method: 'cash' | 'qris' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'split';
  payment_reference?: string;
  notes?: string;
  items: {
    id?: number;
    product_id: number;
    product_name: string;
    variant_name?: string;
    unit_price: number;
    quantity: number;
    subtotal_price: number;
    notes?: string;
    modifiers?: { modifier_name: string; additional_price: number }[];
  }[];
  payments?: OrderPayment[];
  created_at: string;
}

export interface WorkShift {
  id: number;
  outlet_id: number;
  cashier_id: number;
  cashier?: UserStaff;
  shift_number: string;
  opening_cash: number;
  closing_cash_actual?: number;
  closing_cash_expected?: number;
  cash_difference?: number;
  total_cash_in: number;
  total_cash_out: number;
  total_sales_cash: number;
  total_sales_non_cash: number;
  total_orders_count: number;
  status: 'open' | 'closed';
  opened_at: string;
  closed_at?: string;
  notes?: string;
}

export interface CashMovement {
  id: number;
  shift_id: number;
  user_id: number;
  userName?: string;
  type: 'cash_in' | 'cash_out';
  amount: number;
  category: string;
  notes?: string;
  created_at: string;
}
