/**
 * STORE TYPES
 * 
 * Type definitions for the e-commerce store feature.
 * Products, orders, cart, and related entities.
 */

// ==================== PRODUCT TYPES ====================

export type ProductCategory = 
  | 'supplements'      // Weight loss pills, protein, vitamins
  | 'gym_wear'         // Workout clothes, shoes
  | 'equipment'        // Dumbbells, resistance bands, mats
  | 'accessories'      // Water bottles, gym bags, gloves
  | 'nutrition'        // Meal prep, healthy snacks
  | 'recovery';        // Foam rollers, massage guns

export type StockStatus = 'in_stock' | 'low_stock' | 'out_of_stock';

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  category: ProductCategory;
  price: number;           // Price in Naira
  salePrice: number | null;// Sale price for discounts
  costPrice?: number;      // Cost to source (admin only)
  images: string[];        // Array of image URLs
  videoUrl: string | null; // YouTube video URL
  sku?: string;
  stockStatus: StockStatus;
  stockQuantity?: number;  // null = unlimited
  weight?: number;         // Weight in grams for shipping
  tags?: string[];
  isFeatured: boolean;
  isBestseller: boolean;
  isActive: boolean;       // Whether product is visible
  createdAt: string;
  updatedAt: string;
}

export interface ProductInsert {
  name: string;
  slug?: string;
  description?: string;
  category: ProductCategory;
  price: number;
  salePrice?: number | null;
  costPrice?: number;
  images?: string[];
  videoUrl?: string | null;
  sku?: string;
  stockStatus?: StockStatus;
  stockQuantity?: number;
  weight?: number;
  tags?: string[];
  isFeatured?: boolean;
  isBestseller?: boolean;
  isActive?: boolean;
}

export interface ProductUpdate extends Partial<ProductInsert> {}

export interface ProductFilters {
  category?: ProductCategory;
  isActive?: boolean;
  isFeatured?: boolean;
  isBestseller?: boolean;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  stockStatus?: StockStatus;
}

export interface ProductListOptions {
  filters?: ProductFilters;
  sortBy?: 'name' | 'price' | 'createdAt' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface ProductListResult {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== CART TYPES ====================

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  originalPrice: number;
  quantity: number;
  image: string | null;
  slug: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress | null;
}

// ==================== ORDER TYPES ====================

export type OrderStatus = 
  | 'pending'           // Just placed, awaiting payment
  | 'paid'              // Payment confirmed
  | 'processing'        // Admin is sourcing/ordering
  | 'shipped'           // Order shipped
  | 'delivered'         // Delivered to customer
  | 'cancelled'         // Cancelled by user or admin
  | 'refunded';         // Refunded

export type PaymentMethod = 'paystack' | 'transfer';

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  landmark?: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
}

export interface Order {
  id: string;
  orderNumber: string;     // Human-readable order number like "CMD-20260131-001"
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  status: OrderStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  paidAt?: string;
  shippingAddress: ShippingAddress;
  trackingNumber?: string;
  trackingUrl?: string;
  adminNotes?: string;     // Internal notes for admin
  sourceOrderId?: string;  // Amazon/eBay order ID (admin only)
  sourceOrderUrl?: string; // Link to source order
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderInsert {
  userId: string;
  userEmail: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  paymentMethod?: PaymentMethod;
}

export interface OrderUpdate {
  status?: OrderStatus;
  paymentReference?: string;
  paidAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  adminNotes?: string;
  sourceOrderId?: string;
  sourceOrderUrl?: string;
  estimatedDelivery?: string;
  shippedAt?: string;
  deliveredAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export interface OrderFilters {
  userId?: string;
  status?: OrderStatus;
  startDate?: string;
  endDate?: string;
  search?: string;
}

export interface OrderListOptions {
  filters?: OrderFilters;
  sortBy?: 'createdAt' | 'total' | 'status';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface OrderListResult {
  orders: Order[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// ==================== SHIPPING ====================

export const SHIPPING_RATES = {
  lagos: 2500,
  outsideLagos: {
    'Ogun': 3500,
    'Oyo': 3500,
    'Osun': 3500,
    'Ondo': 4000,
    'Ekiti': 4000,
    'Kwara': 4500,
    'Kogi': 5000,
    'Rivers': 5500,
    'Abuja': 5000,
  } as Record<string, number>,
  default: 6000,
};

// ==================== CATEGORY LABELS ====================

export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, string> = {
  supplements: 'Supplements',
  gym_wear: 'Gym Wear',
  equipment: 'Equipment',
  accessories: 'Accessories',
  nutrition: 'Nutrition',
  recovery: 'Recovery',
};

export const PRODUCT_CATEGORY_ICONS: Record<ProductCategory, string> = {
  supplements: '💊',
  gym_wear: '👕',
  equipment: '🏋️',
  accessories: '🎒',
  nutrition: '🥗',
  recovery: '💆',
};

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'Pending Payment',
  paid: 'Payment Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#f59e0b',    // Amber
  paid: '#3b82f6',       // Blue
  processing: '#8b5cf6', // Purple
  shipped: '#06b6d4',    // Cyan
  delivered: '#10b981',  // Green
  cancelled: '#ef4444',  // Red
  refunded: '#6b7280',   // Gray
};

// ==================== NIGERIAN STATES ====================

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu',
  'FCT (Abuja)', 'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina',
  'Kebbi', 'Kogi', 'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo',
  'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];
