/**
 * STORE TAB
 * 
 * Main e-commerce store interface.
 * Browse products, categories, and add to cart.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  RefreshControl,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ShoppingCart,
  Search,
  Filter,
  Star,
  Heart,
  ChevronRight,
  Package,
  X,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';

import { useCartStore } from '@/lib/state/cart-store';
import { productService } from '@/lib/supabase/products';
import type { Product, ProductCategory } from '@/types/store';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

const CATEGORIES: { key: ProductCategory | 'all'; label: string; emoji: string }[] = [
  { key: 'all', label: 'All', emoji: '🏪' },
  { key: 'supplements', label: 'Supplements', emoji: '💊' },
  { key: 'gym_wear', label: 'Gym Wear', emoji: '👕' },
  { key: 'equipment', label: 'Equipment', emoji: '🏋️' },
  { key: 'accessories', label: 'Accessories', emoji: '🎒' },
  { key: 'nutrition', label: 'Nutrition', emoji: '🥗' },
  { key: 'recovery', label: 'Recovery', emoji: '🧘' },
];

export default function StoreScreen() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const addToCart = useCartStore((state) => state.addItem);

  // Fetch featured products
  const { data: featuredProducts, isLoading: loadingFeatured } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => productService.getFeatured(6),
  });

  // Fetch products by category
  const {
    data: productsData,
    isLoading: loadingProducts,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['products', selectedCategory, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        return productService.search(searchQuery);
      }
      if (selectedCategory === 'all') {
        return productService.list({ filters: { isActive: true }, limit: 50 });
      }
      return productService.getByCategory(selectedCategory);
    },
  });

  const products = (productsData as any)?.products || productsData || [];

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const renderProductCard = ({ item: product }: { item: Product }) => (
    <TouchableOpacity
      onPress={() => handleProductPress(product)}
      style={{ width: CARD_WIDTH }}
      className="mb-4"
    >
      <View className="bg-slate-800/60 rounded-2xl overflow-hidden border border-slate-700/50">
        {/* Product Image */}
        <View className="relative">
          {product.images[0] ? (
            <Image
              source={{ uri: product.images[0] }}
              className="w-full h-40"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-40 bg-slate-700 items-center justify-center">
              <Package size={40} color="#64748b" />
            </View>
          )}

          {/* Sale Badge */}
          {product.salePrice && (
            <View className="absolute top-2 left-2 bg-red-500 px-2 py-1 rounded-full">
              <Text className="text-white text-xs font-bold">
                {Math.round(((product.price - product.salePrice) / product.price) * 100)}% OFF
              </Text>
            </View>
          )}

          {/* Wishlist Button */}
          <TouchableOpacity className="absolute top-2 right-2 bg-black/50 p-2 rounded-full">
            <Heart size={16} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Product Info */}
        <View className="p-3">
          <Text className="text-white font-medium text-sm" numberOfLines={2}>
            {product.name}
          </Text>

          <View className="flex-row items-center mt-1">
            <Star size={12} color="#fbbf24" fill="#fbbf24" />
            <Text className="text-yellow-400 text-xs ml-1">4.8</Text>
            <Text className="text-slate-500 text-xs ml-1">(124)</Text>
          </View>

          <View className="flex-row items-center justify-between mt-2">
            <View>
              {product.salePrice ? (
                <View className="flex-row items-center">
                  <Text className="text-emerald-400 font-bold">
                    {formatPrice(product.salePrice)}
                  </Text>
                  <Text className="text-slate-500 text-xs line-through ml-2">
                    {formatPrice(product.price)}
                  </Text>
                </View>
              ) : (
                <Text className="text-emerald-400 font-bold">
                  {formatPrice(product.price)}
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => handleAddToCart(product)}
              className="bg-emerald-500 p-2 rounded-full"
            >
              <ShoppingCart size={14} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="px-4 py-4">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-2xl font-bold text-white">Store</Text>
              <Text className="text-slate-400 text-sm">Fitness gear & supplements</Text>
            </View>

            <View className="flex-row items-center space-x-3">
              <TouchableOpacity
                onPress={() => setShowSearch(!showSearch)}
                className="bg-slate-800 p-3 rounded-full"
              >
                <Search size={20} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push('/cart')}
                className="bg-slate-800 p-3 rounded-full relative"
              >
                <ShoppingCart size={20} color="#fff" />
                {cartItemCount > 0 && (
                  <View className="absolute -top-1 -right-1 bg-emerald-500 w-5 h-5 rounded-full items-center justify-center">
                    <Text className="text-white text-xs font-bold">{cartItemCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Bar */}
          {showSearch && (
            <View className="mt-4 flex-row items-center bg-slate-800 rounded-xl px-4 py-2">
              <Search size={18} color="#64748b" />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search products..."
                placeholderTextColor="#64748b"
                className="flex-1 text-white ml-3"
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={18} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#10b981"
            />
          }
          contentContainerStyle={{ paddingBottom: 100 }}
        >
          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 mb-6"
          >
            {CATEGORIES.map((category) => (
              <TouchableOpacity
                key={category.key}
                onPress={() => setSelectedCategory(category.key)}
                className={`mr-3 px-4 py-2 rounded-full flex-row items-center ${
                  selectedCategory === category.key
                    ? 'bg-emerald-500'
                    : 'bg-slate-800'
                }`}
              >
                <Text className="mr-2">{category.emoji}</Text>
                <Text
                  className={`font-medium ${
                    selectedCategory === category.key ? 'text-white' : 'text-slate-300'
                  }`}
                >
                  {category.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured Section (only on "All") */}
          {selectedCategory === 'all' && !searchQuery && (
            <View className="mb-6">
              <View className="flex-row items-center justify-between px-4 mb-4">
                <Text className="text-white text-lg font-bold">Featured</Text>
                <TouchableOpacity className="flex-row items-center">
                  <Text className="text-emerald-400 text-sm mr-1">See All</Text>
                  <ChevronRight size={16} color="#10b981" />
                </TouchableOpacity>
              </View>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} className="px-4">
                {loadingFeatured ? (
                  <ActivityIndicator color="#10b981" />
                ) : (
                  featuredProducts?.map((product) => (
                    <TouchableOpacity
                      key={product.id}
                      onPress={() => handleProductPress(product)}
                      className="mr-4"
                    >
                      <LinearGradient
                        colors={['#1e3a5f', '#0f172a']}
                        className="w-64 rounded-2xl overflow-hidden"
                      >
                        <View className="flex-row">
                          {product.images[0] ? (
                            <Image
                              source={{ uri: product.images[0] }}
                              className="w-24 h-28"
                              resizeMode="cover"
                            />
                          ) : (
                            <View className="w-24 h-28 bg-slate-700 items-center justify-center">
                              <Package size={24} color="#64748b" />
                            </View>
                          )}
                          <View className="flex-1 p-3 justify-center">
                            <Text className="text-white font-bold" numberOfLines={2}>
                              {product.name}
                            </Text>
                            <Text className="text-emerald-400 font-bold mt-1">
                              {formatPrice(product.salePrice || product.price)}
                            </Text>
                            {product.salePrice && (
                              <Text className="text-slate-500 text-xs line-through">
                                {formatPrice(product.price)}
                              </Text>
                            )}
                          </View>
                        </View>
                      </LinearGradient>
                    </TouchableOpacity>
                  ))
                )}
              </ScrollView>
            </View>
          )}

          {/* Products Grid */}
          <View className="px-4">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white text-lg font-bold">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : selectedCategory === 'all'
                  ? 'All Products'
                  : CATEGORIES.find((c) => c.key === selectedCategory)?.label}
              </Text>
              <TouchableOpacity className="flex-row items-center bg-slate-800 px-3 py-2 rounded-full">
                <Filter size={14} color="#94a3b8" />
                <Text className="text-slate-300 text-sm ml-2">Filter</Text>
              </TouchableOpacity>
            </View>

            {loadingProducts ? (
              <View className="items-center py-20">
                <ActivityIndicator size="large" color="#10b981" />
                <Text className="text-slate-400 mt-4">Loading products...</Text>
              </View>
            ) : products.length === 0 ? (
              <View className="items-center py-20">
                <Package size={60} color="#334155" />
                <Text className="text-slate-400 text-lg mt-4">No products found</Text>
                <Text className="text-slate-500 text-sm mt-2">
                  {searchQuery
                    ? 'Try a different search term'
                    : 'Check back later for new arrivals'}
                </Text>
              </View>
            ) : (
              <FlatList
                data={products}
                renderItem={renderProductCard}
                keyExtractor={(item) => item.id}
                numColumns={2}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                scrollEnabled={false}
              />
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
