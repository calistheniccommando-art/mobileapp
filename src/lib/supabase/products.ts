/**
 * PRODUCT SERVICE
 * 
 * Supabase CRUD operations for store products.
 * Handles product listing, filtering, and admin management.
 */

import { supabase, isSupabaseConfigured } from './client';
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductFilters,
  ProductListOptions,
  ProductListResult,
  ProductCategory,
  StockStatus,
} from '@/types/store';

// ==================== HELPERS ====================

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

function generateSKU(category: ProductCategory): string {
  const prefix = category.substring(0, 3).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}-${random}`;
}

// ==================== PRODUCT SERVICE ====================

export const productService = {
  /**
   * List products with filtering, sorting, and pagination
   */
  async list(options: ProductListOptions = {}): Promise<ProductListResult> {
    if (!isSupabaseConfigured()) {
      return { products: [], total: 0, page: 1, limit: 20, hasMore: false };
    }

    const {
      filters = {},
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = options;

    let query = supabase
      .from('products')
      .select('*', { count: 'exact' });

    // Apply filters
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    if (filters.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      // Default to active products for non-admin views
      query = query.eq('is_active', true);
    }
    if (filters.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }
    if (filters.isBestseller !== undefined) {
      query = query.eq('is_bestseller', filters.isBestseller);
    }
    if (filters.stockStatus) {
      query = query.eq('stock_status', filters.stockStatus);
    }
    if (filters.minPrice !== undefined) {
      query = query.gte('price', filters.minPrice);
    }
    if (filters.maxPrice !== undefined) {
      query = query.lte('price', filters.maxPrice);
    }
    if (filters.search) {
      query = query.or(
        `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
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
      console.error('Error listing products:', error);
      throw error;
    }

    const products = (data || []).map(mapDbToProduct);
    const total = count || 0;

    return {
      products,
      total,
      page,
      limit,
      hasMore: from + products.length < total,
    };
  },

  /**
   * Get a single product by ID
   */
  async getById(id: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error getting product:', error);
      throw error;
    }

    return mapDbToProduct(data);
  },

  /**
   * Get a single product by slug
   */
  async getBySlug(slug: string): Promise<Product | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      console.error('Error getting product by slug:', error);
      throw error;
    }

    return mapDbToProduct(data);
  },

  /**
   * Get featured products
   */
  async getFeatured(limit = 8): Promise<Product[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting featured products:', error);
      throw error;
    }

    return (data || []).map(mapDbToProduct);
  },

  /**
   * Get bestseller products
   */
  async getBestsellers(limit = 8): Promise<Product[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('is_bestseller', true)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting bestseller products:', error);
      throw error;
    }

    return (data || []).map(mapDbToProduct);
  },

  /**
   * Get products by category
   */
  async getByCategory(category: ProductCategory, limit = 20): Promise<Product[]> {
    if (!isSupabaseConfigured()) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting products by category:', error);
      throw error;
    }

    return (data || []).map(mapDbToProduct);
  },

  /**
   * Search products
   */
  async search(query: string, limit = 20): Promise<Product[]> {
    if (!isSupabaseConfigured()) return [];
    if (!query.trim()) return [];

    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error searching products:', error);
      throw error;
    }

    return (data || []).map(mapDbToProduct);
  },

  /**
   * Create a new product (Admin)
   */
  async create(product: ProductInsert): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const slug = product.slug || generateSlug(product.name);
    const sku = product.sku || generateSKU(product.category);

    const dbProduct = {
      name: product.name,
      slug,
      description: product.description || null,
      category: product.category,
      price: product.price,
      sale_price: product.salePrice || null,
      cost_price: product.costPrice,
      images: product.images || [],
      video_url: product.videoUrl || null,
      sku,
      stock_status: product.stockStatus || 'in_stock',
      stock_quantity: product.stockQuantity,
      weight: product.weight,
      tags: product.tags || [],
      is_featured: product.isFeatured || false,
      is_bestseller: product.isBestseller || false,
      is_active: product.isActive ?? true,
    };
    const { data, error } = await (supabase
      .from('products') as any)
      .insert(dbProduct)
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      throw error;
    }

    return mapDbToProduct(data);
  },

  /**
   * Update a product (Admin)
   */
  async update(id: string, updates: ProductUpdate): Promise<Product> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const dbUpdates: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.slug !== undefined) dbUpdates.slug = updates.slug;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.category !== undefined) dbUpdates.category = updates.category;
    if (updates.price !== undefined) dbUpdates.price = updates.price;
    if (updates.salePrice !== undefined) dbUpdates.sale_price = updates.salePrice;
    if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
    if (updates.images !== undefined) dbUpdates.images = updates.images;
    if (updates.videoUrl !== undefined) dbUpdates.video_url = updates.videoUrl;
    if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
    if (updates.stockStatus !== undefined) dbUpdates.stock_status = updates.stockStatus;
    if (updates.stockQuantity !== undefined) dbUpdates.stock_quantity = updates.stockQuantity;
    if (updates.weight !== undefined) dbUpdates.weight = updates.weight;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.isFeatured !== undefined) dbUpdates.is_featured = updates.isFeatured;
    if (updates.isBestseller !== undefined) dbUpdates.is_bestseller = updates.isBestseller;
    if (updates.isActive !== undefined) dbUpdates.is_active = updates.isActive;

    const { data, error } = await (supabase
      .from('products') as any)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      throw error;
    }

    return mapDbToProduct(data);
  },

  /**
   * Delete a product (Admin) - soft delete by setting is_active to false
   */
  async delete(id: string): Promise<void> {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase not configured');
    }

    const { error } = await (supabase
      .from('products') as any)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error deleting product:', error);
      throw error;
    }
  },

  /**
   * Duplicate a product (Admin)
   */
  async duplicate(id: string): Promise<Product> {
    const original = await this.getById(id);
    if (!original) {
      throw new Error('Product not found');
    }

    return this.create({
      name: `${original.name} (Copy)`,
      description: original.description || undefined,
      category: original.category,
      price: original.price,
      salePrice: original.salePrice,
      costPrice: original.costPrice,
      images: original.images,
      videoUrl: original.videoUrl,
      stockStatus: original.stockStatus,
      stockQuantity: original.stockQuantity,
      weight: original.weight,
      tags: original.tags,
      isFeatured: false,
      isBestseller: false,
      isActive: false,
    });
  },

  /**
   * Get product statistics (Admin)
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    draft: number;
    outOfStock: number;
    byCategory: Record<ProductCategory, number>;
  }> {
    if (!isSupabaseConfigured()) {
      return {
        total: 0,
        active: 0,
        draft: 0,
        outOfStock: 0,
        byCategory: {} as Record<ProductCategory, number>,
      };
    }

    const { data, error } = await supabase
      .from('products')
      .select('is_active, stock_status, category');

    if (error) {
      console.error('Error getting product stats:', error);
      throw error;
    }

    const stats = {
      total: data?.length || 0,
      active: 0,
      draft: 0,
      outOfStock: 0,
      byCategory: {} as Record<ProductCategory, number>,
    };

    data?.forEach((p: any) => {
      if (p.is_active) stats.active++;
      else stats.draft++;
      if (p.stock_status === 'out_of_stock') stats.outOfStock++;

      const category = p.category as ProductCategory;
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    });

    return stats;
  },
};

// ==================== DB MAPPING ====================

function mapDbToProduct(db: any): Product {
  return {
    id: db.id,
    name: db.name,
    slug: db.slug,
    description: db.description,
    category: db.category,
    price: db.price,
    salePrice: db.sale_price,
    costPrice: db.cost_price,
    images: db.images || [],
    videoUrl: db.video_url,
    sku: db.sku,
    stockStatus: db.stock_status || 'in_stock',
    stockQuantity: db.stock_quantity,
    weight: db.weight,
    tags: db.tags || [],
    isFeatured: db.is_featured || false,
    isBestseller: db.is_bestseller || false,
    isActive: db.is_active ?? true,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export default productService;
