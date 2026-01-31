/**
 * ORDER SERVICE
 * 
 * Supabase CRUD operations for store orders.
 * Handles order creation, tracking, and admin management.
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderFilters,
  OrderListOptions,
  OrderListResult,
  OrderStatus,
  OrderItem,
} from '@/types/store';

// ==================== HELPERS ====================

function generateOrderNumber(): string {
  const date = new Date();
  const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `CMD-${dateStr}-${random}`;
}

// ==================== ORDER SERVICE ====================

export const orderService = {
  /**
   * List orders with filtering, sorting, and pagination
   */
  async list(options: OrderListOptions = {}): Promise<OrderListResult> {
    if (!isSupabaseConfigured()) {
      return { orders: [], total: 0, page: 1, limit: 20, hasMore: false };
    }

    const {
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options;

    let query = supabase
      .from('orders')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.userId) {
      query = query.eq('user_id', filters.userId);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }
    if (filters.search) {
      query = query.or(
        `order_number.ilike.%${filters.search}%,user_email.ilike.%${filters.search}%`
      );
    }

    // Apply sorting
    const sortColumn = sortBy === 'createdAt' ? 'created_at' : sortBy;
    query = query.order(sortColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Error listing orders:', error);
      throw error;
    }

    const orders = (data || []).map(mapDbToOrder);
    const total = count || 0;

    return {
      orders,
      total,
      page,
      limit,
      hasMore: from + orders.length < total,
    };
  },

  /**
   * Get a single order by ID
   */
  async getById(id: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error getting order:', error);
      throw error;
    }

    return mapDbToOrder(data);
  },

  /**
   * Get a single order by order number
   */
  async getByOrderNumber(orderNumber: string): Promise<Order | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error getting order by number:', error);
      throw error;
    }

    return mapDbToOrder(data);
  },

  /**
   * Get orders for a specific user
   */
  async getByUserId(userId: string): Promise<Order[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting user orders:', error);
      throw error;
    }

    return (data || []).map(mapDbToOrder);
  },

  /**
   * Get recent orders (Admin)
   */
  async getRecent(limit = 10): Promise<Order[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting recent orders:', error);
      throw error;
    }

    return (data || []).map(mapDbToOrder);
  },

  /**
   * Get orders by status (Admin)
   */
  async getByStatus(status: OrderStatus): Promise<Order[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting orders by status:', error);
      throw error;
    }

    return (data || []).map(mapDbToOrder);
  },

  /**
   * Create a new order
   */
  async create(order: OrderInsert): Promise<Order> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const orderNumber = generateOrderNumber();

    const dbOrder = {
      order_number: orderNumber,
      user_id: order.userId,
      user_email: order.userEmail,
      items: order.items,
      subtotal: order.subtotal,
      shipping: order.shipping,
      total: order.total,
      status: 'pending',
      payment_method: order.paymentMethod,
      shipping_address: order.shippingAddress,
    };

    const { data, error } = await (supabase
      .from('orders') as any)
      .insert(dbOrder)
      .select()
      .single();

    if (error) {
      console.error('Error creating order:', error);
      throw error;
    }

    return mapDbToOrder(data);
  },

  /**
   * Update an order (Admin)
   */
  async update(id: string, updates: OrderUpdate): Promise<Order> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.paymentReference !== undefined) dbUpdates.payment_reference = updates.paymentReference;
    if (updates.paidAt !== undefined) dbUpdates.paid_at = updates.paidAt;
    if (updates.trackingNumber !== undefined) dbUpdates.tracking_number = updates.trackingNumber;
    if (updates.trackingUrl !== undefined) dbUpdates.tracking_url = updates.trackingUrl;
    if (updates.adminNotes !== undefined) dbUpdates.admin_notes = updates.adminNotes;
    if (updates.sourceOrderId !== undefined) dbUpdates.source_order_id = updates.sourceOrderId;
    if (updates.sourceOrderUrl !== undefined) dbUpdates.source_order_url = updates.sourceOrderUrl;
    if (updates.estimatedDelivery !== undefined) dbUpdates.estimated_delivery = updates.estimatedDelivery;
    if (updates.shippedAt !== undefined) dbUpdates.shipped_at = updates.shippedAt;
    if (updates.deliveredAt !== undefined) dbUpdates.delivered_at = updates.deliveredAt;
    if (updates.cancelledAt !== undefined) dbUpdates.cancelled_at = updates.cancelledAt;
    if (updates.cancellationReason !== undefined) dbUpdates.cancellation_reason = updates.cancellationReason;

    const { data, error } = await (supabase
      .from('orders') as any)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating order:', error);
      throw error;
    }

    return mapDbToOrder(data);
  },

  /**
   * Mark order as paid
   */
  async markAsPaid(id: string, paymentReference: string): Promise<Order> {
    return this.update(id, {
      status: 'paid',
      paymentReference,
      paidAt: new Date().toISOString(),
    });
  },

  /**
   * Mark order as processing (Admin started sourcing)
   */
  async markAsProcessing(id: string, sourceOrderId?: string, sourceOrderUrl?: string): Promise<Order> {
    return this.update(id, {
      status: 'processing',
      sourceOrderId,
      sourceOrderUrl,
    });
  },

  /**
   * Mark order as shipped (Admin)
   */
  async markAsShipped(
    id: string,
    trackingNumber: string,
    trackingUrl?: string,
    estimatedDelivery?: string
  ): Promise<Order> {
    return this.update(id, {
      status: 'shipped',
      trackingNumber,
      trackingUrl,
      estimatedDelivery,
      shippedAt: new Date().toISOString(),
    });
  },

  /**
   * Mark order as delivered (Admin)
   */
  async markAsDelivered(id: string): Promise<Order> {
    return this.update(id, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    });
  },

  /**
   * Cancel an order
   */
  async cancel(id: string, reason?: string): Promise<Order> {
    return this.update(id, {
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason,
    });
  },

  /**
   * Get order statistics (Admin)
   */
  async getStats(): Promise<{
    total: number;
    pending: number;
    paid: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    totalRevenue: number;
    todayOrders: number;
    todayRevenue: number;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        total: 0,
        pending: 0,
        paid: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        totalRevenue: 0,
        todayOrders: 0,
        todayRevenue: 0,
      };
    }

    const { data, error } = await supabase
      .from('orders')
      .select('status, total, created_at');

    if (error) {
      console.error('Error getting order stats:', error);
      throw error;
    }

    const today = new Date().toISOString().slice(0, 10);
    const stats = {
      total: data?.length || 0,
      pending: 0,
      paid: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      totalRevenue: 0,
      todayOrders: 0,
      todayRevenue: 0,
    };

    data?.forEach((order: any) => {
      const status = order.status as OrderStatus;
      if (status === 'pending') stats.pending++;
      if (status === 'paid') stats.paid++;
      if (status === 'processing') stats.processing++;
      if (status === 'shipped') stats.shipped++;
      if (status === 'delivered') stats.delivered++;
      if (status === 'cancelled') stats.cancelled++;

      // Count revenue only for paid/processing/shipped/delivered
      if (['paid', 'processing', 'shipped', 'delivered'].includes(status)) {
        stats.totalRevenue += order.total || 0;
      }

      // Today's stats
      if (order.created_at?.startsWith(today)) {
        stats.todayOrders++;
        if (['paid', 'processing', 'shipped', 'delivered'].includes(status)) {
          stats.todayRevenue += order.total || 0;
        }
      }
    });

    return stats;
  },
};

// ==================== DB MAPPING ====================

function mapDbToOrder(db: any): Order {
  return {
    id: db.id,
    orderNumber: db.order_number,
    userId: db.user_id,
    userEmail: db.user_email,
    items: db.items || [],
    subtotal: db.subtotal,
    shipping: db.shipping,
    total: db.total,
    status: db.status,
    paymentMethod: db.payment_method,
    paymentReference: db.payment_reference,
    paidAt: db.paid_at,
    shippingAddress: db.shipping_address,
    trackingNumber: db.tracking_number,
    trackingUrl: db.tracking_url,
    adminNotes: db.admin_notes,
    sourceOrderId: db.source_order_id,
    sourceOrderUrl: db.source_order_url,
    estimatedDelivery: db.estimated_delivery,
    shippedAt: db.shipped_at,
    deliveredAt: db.delivered_at,
    cancelledAt: db.cancelled_at,
    cancellationReason: db.cancellation_reason,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export default orderService;
