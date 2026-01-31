/**
 * CART STORE
 * 
 * Zustand store for shopping cart state management.
 * Persisted to AsyncStorage for offline access.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Cart, CartItem, Product, ShippingAddress } from '@/types/store';
import { SHIPPING_RATES } from '@/types/store';

interface CartState extends Cart {
  // Actions
  addItem: (product: Product, quantity?: number) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  
  // Shipping
  setShippingAddress: (address: ShippingAddress) => void;
  calculateShipping: (state: string) => number;
  
  // Computed
  getItemCount: () => number;
  getCartTotal: () => { subtotal: number; shipping: number; total: number };
}

const initialState: Cart = {
  items: [],
  subtotal: 0,
  shipping: 0,
  total: 0,
  shippingAddress: null,
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      ...initialState,

      /**
       * Add item to cart or increase quantity if already exists
       */
      addItem: (product: Product, quantity = 1) => {
        set((state) => {
          const existingIndex = state.items.findIndex(
            (item) => item.productId === product.id
          );

          let newItems: CartItem[];

          if (existingIndex > -1) {
            // Item exists, increase quantity
            newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + quantity,
            };
          } else {
            // New item
            const newItem: CartItem = {
              productId: product.id,
              name: product.name,
              price: product.salePrice || product.price,
              originalPrice: product.price,
              quantity,
              image: product.images[0] || null,
              slug: product.slug,
            };
            newItems = [...state.items, newItem];
          }

          const subtotal = calculateSubtotal(newItems);
          const shipping = state.shippingAddress
            ? get().calculateShipping(state.shippingAddress.state)
            : 0;

          return {
            items: newItems,
            subtotal,
            shipping,
            total: subtotal + shipping,
          };
        });
      },

      /**
       * Remove item from cart
       */
      removeItem: (productId: string) => {
        set((state) => {
          const newItems = state.items.filter(
            (item) => item.productId !== productId
          );

          const subtotal = calculateSubtotal(newItems);
          const shipping = state.shippingAddress
            ? get().calculateShipping(state.shippingAddress.state)
            : 0;

          return {
            items: newItems,
            subtotal,
            shipping,
            total: subtotal + shipping,
          };
        });
      },

      /**
       * Update quantity of an item
       */
      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }

        set((state) => {
          const newItems = state.items.map((item) =>
            item.productId === productId ? { ...item, quantity } : item
          );

          const subtotal = calculateSubtotal(newItems);
          const shipping = state.shippingAddress
            ? get().calculateShipping(state.shippingAddress.state)
            : 0;

          return {
            items: newItems,
            subtotal,
            shipping,
            total: subtotal + shipping,
          };
        });
      },

      /**
       * Clear entire cart
       */
      clearCart: () => {
        set(initialState);
      },

      /**
       * Set shipping address
       */
      setShippingAddress: (address: ShippingAddress) => {
        set((state) => {
          const shipping = get().calculateShipping(address.state);
          return {
            shippingAddress: address,
            shipping,
            total: state.subtotal + shipping,
          };
        });
      },

      /**
       * Calculate shipping cost based on state
       */
      calculateShipping: (state: string): number => {
        // Lagos has flat rate
        if (state.toLowerCase() === 'lagos') {
          return SHIPPING_RATES.lagos;
        }

        // Check if state is in special list
        const outsideLagosState = SHIPPING_RATES.outsideLagos[state];
        if (outsideLagosState !== undefined) {
          return outsideLagosState;
        }

        // Default rate for unlisted states
        return SHIPPING_RATES.default;
      },

      /**
       * Get total item count
       */
      getItemCount: () => {
        return get().items.reduce((sum, item) => sum + item.quantity, 0);
      },

      /**
       * Get cart totals
       */
      getCartTotal: () => {
        const { subtotal, shipping, total } = get();
        return { subtotal, shipping, total };
      },
    }),
    {
      name: 'commando-cart',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        items: state.items,
        subtotal: state.subtotal,
        shipping: state.shipping,
        total: state.total,
        shippingAddress: state.shippingAddress,
      }),
    }
  )
);

// ==================== HELPERS ====================

function calculateSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

// ==================== SELECTORS ====================

export const selectCartItems = (state: CartState) => state.items;
export const selectCartSubtotal = (state: CartState) => state.subtotal;
export const selectCartShipping = (state: CartState) => state.shipping;
export const selectCartTotal = (state: CartState) => state.total;
export const selectCartItemCount = (state: CartState) => state.getItemCount();
export const selectShippingAddress = (state: CartState) => state.shippingAddress;

export default useCartStore;
