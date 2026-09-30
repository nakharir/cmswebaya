/**
 * KREZOEMA Ecommerce Types
 * Matches Laravel Ecommerce API contracts
 */

export interface EcommerceCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  is_active: boolean;
  sort_order: number;
  products_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface EcommerceVariant {
  id?: number;
  sku: string | null;
  name: string;
  options: Record<string, any> | string[];
  price: number | null;
  effective_price?: number;
  stock: number;
  is_active: boolean;
}

export interface EcommerceProductImage {
  id: number;
  variant_id: number | null;
  image_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface EcommerceProduct {
  id: number;
  category_id?: number;
  name: string;
  slug: string;
  description: string | null;
  material: string | null;
  base_price: number;
  stock?: number;
  is_active: boolean;
  image: string | null;
  category?: EcommerceCategory;
  variants?: EcommerceVariant[];
  images?: EcommerceProductImage[];
  created_at?: string;
  updated_at?: string;
}

export interface ProductListParams {
  category?: string | number;
  search?: string;
  sort?: 'latest' | 'oldest' | 'price_asc' | 'price_desc' | 'name_asc' | 'name_desc' | string;
  page?: number;
  per_page?: number;
}

export interface CategoryCreatePayload {
  name: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface CategoryUpdatePayload {
  name?: string;
  slug?: string;
  description?: string | null;
  is_active?: boolean;
  sort_order?: number;
}

export interface ProductCreatePayload {
  category_id: number;
  name: string;
  slug?: string;
  description?: string | null;
  material?: string | null;
  base_price: number;
  stock?: number;
  is_active?: boolean;
  variants?: EcommerceVariant[];
}

export interface ProductUpdatePayload {
  category_id?: number;
  name?: string;
  slug?: string;
  description?: string | null;
  material?: string | null;
  base_price?: number;
  stock?: number;
  is_active?: boolean;
  variants?: EcommerceVariant[];
}

export interface PaginationLink {
  url: string | null;
  label: string;
  active: boolean;
}

export interface PaginationMeta {
  current_page: number;
  from: number | null;
  last_page: number;
  links?: PaginationLink[];
  path: string;
  per_page: number;
  to: number | null;
  total: number;
}

export interface LaravelResourceCollection<T> {
  data: T[];
  links?: {
    first?: string;
    last?: string;
    prev?: string | null;
    next?: string | null;
  };
  meta?: PaginationMeta;
}

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'completed'
  | 'cancelled';

export type PaymentStatus =
  | 'unpaid'
  | 'waiting_verification'
  | 'paid'
  | 'rejected';

export interface EcommerceOrderItem {
  id: number;
  order_id: number;
  product_id: number | null;
  variant_id: number | null;
  product_name: string;
  variant_name: string | null;
  sku: string | null;
  unit_price: number;
  quantity: number;
  subtotal: number;
  created_at?: string;
  updated_at?: string;
}

export interface EcommerceCustomerSnapshot {
  id: number;
  name: string;
  email: string;
  phone?: string;
}

export interface EcommerceOrder {
  id: number;
  customer_id: number;
  order_number: string;
  status: OrderStatus;
  payment_status: PaymentStatus;
  payment_method?: string;
  shipping_method: string;
  shipping_name: string;
  shipping_whatsapp: string;
  shipping_address: string;
  shipping_kecamatan: string;
  shipping_city: string;
  shipping_province: string;
  shipping_postal_code: string;
  shipping_address_snapshot?: {
    recipient_name: string;
    whatsapp: string;
    address: string;
    district: string;
    city: string;
    province: string;
    postal_code: string;
  };
  notes: string | null;
  subtotal: number;
  shipping_cost: number;
  total: number;
  transfer_proof_url?: string | null;
  payment_details?: {
    bank_name: string;
    account_number: string;
    account_holder: string;
    expires_at: string | null;
  };
  items?: EcommerceOrderItem[];
  customer?: EcommerceCustomerSnapshot | null;
  created_at: string;
  updated_at: string;
}

export interface OrderListParams {
  search?: string;
  status?: string;
  payment_status?: string;
  page?: number;
  per_page?: number;
}
