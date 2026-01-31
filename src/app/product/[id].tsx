/**
 * PRODUCT DETAIL PAGE
 * 
 * Full product view with images, description, and add to cart.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  Minus,
  Plus,
  Package,
  Truck,
  Shield,
  ChevronRight,
  Play,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { Video, ResizeMode } from 'expo-av';

import { useCartStore } from '@/lib/state/cart-store';
import { productService } from '@/lib/supabase/products';
import type { Product } from '@/types/store';

const { width } = Dimensions.get('window');

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showVideo, setShowVideo] = useState(false);

  const cartItemCount = useCartStore((state) => state.getItemCount());
  const addToCart = useCartStore((state) => state.addItem);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productService.getById(id!),
    enabled: !!id,
  });

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity);
    }
  };

  const handleBuyNow = () => {
    if (product) {
      addToCart(product, quantity);
      router.push('/cart');
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <ActivityIndicator size="large" color="#10b981" />
      </View>
    );
  }

  if (!product) {
    return (
      <View className="flex-1 bg-slate-900 items-center justify-center">
        <Package size={60} color="#334155" />
        <Text className="text-white text-lg mt-4">Product not found</Text>
        <TouchableOpacity
          onPress={() => router.back()}
          className="mt-4 bg-emerald-500 px-6 py-3 rounded-full"
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = product.images.length > 0 ? product.images : [null];
  const discount = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="absolute top-12 left-0 right-0 z-10 px-4 flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => router.back()}
            className="bg-black/50 p-3 rounded-full"
          >
            <ArrowLeft size={20} color="#fff" />
          </TouchableOpacity>

          <View className="flex-row items-center space-x-3">
            <TouchableOpacity className="bg-black/50 p-3 rounded-full">
              <Heart size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity className="bg-black/50 p-3 rounded-full">
              <Share2 size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => router.push('/cart')}
              className="bg-black/50 p-3 rounded-full relative"
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

        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Main Image / Video */}
          <View className="relative">
            {showVideo && product.videoUrl ? (
              <Video
                source={{ uri: product.videoUrl }}
                style={{ width, height: width }}
                useNativeControls
                resizeMode={ResizeMode.CONTAIN}
                shouldPlay
              />
            ) : images[selectedImageIndex] ? (
              <Image
                source={{ uri: images[selectedImageIndex] }}
                style={{ width, height: width }}
                resizeMode="cover"
              />
            ) : (
              <View
                style={{ width, height: width }}
                className="bg-slate-800 items-center justify-center"
              >
                <Package size={80} color="#64748b" />
              </View>
            )}

            {/* Video Play Button */}
            {product.videoUrl && !showVideo && (
              <TouchableOpacity
                onPress={() => setShowVideo(true)}
                className="absolute bottom-4 right-4 bg-black/70 px-4 py-2 rounded-full flex-row items-center"
              >
                <Play size={16} color="#fff" fill="#fff" />
                <Text className="text-white font-medium ml-2">Watch Video</Text>
              </TouchableOpacity>
            )}

            {/* Sale Badge */}
            {product.salePrice && (
              <View className="absolute top-4 left-4 bg-red-500 px-3 py-1 rounded-full">
                <Text className="text-white font-bold">{discount}% OFF</Text>
              </View>
            )}
          </View>

          {/* Image Thumbnails */}
          {images.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="px-4 py-3"
            >
              {images.map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => {
                    setSelectedImageIndex(index);
                    setShowVideo(false);
                  }}
                  className={`mr-2 rounded-lg overflow-hidden border-2 ${
                    selectedImageIndex === index && !showVideo
                      ? 'border-emerald-500'
                      : 'border-transparent'
                  }`}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      className="w-16 h-16"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className="w-16 h-16 bg-slate-800 items-center justify-center">
                      <Package size={20} color="#64748b" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
              {product.videoUrl && (
                <TouchableOpacity
                  onPress={() => setShowVideo(true)}
                  className={`rounded-lg overflow-hidden border-2 ${
                    showVideo ? 'border-emerald-500' : 'border-transparent'
                  }`}
                >
                  <View className="w-16 h-16 bg-slate-800 items-center justify-center">
                    <Play size={20} color="#fff" fill="#fff" />
                  </View>
                </TouchableOpacity>
              )}
            </ScrollView>
          )}

          {/* Product Info */}
          <View className="px-4 py-4">
            {/* Category Badge */}
            <View className="flex-row">
              <View className="bg-emerald-500/20 px-3 py-1 rounded-full">
                <Text className="text-emerald-400 text-sm capitalize">
                  {product.category.replace('_', ' ')}
                </Text>
              </View>
            </View>

            {/* Title */}
            <Text className="text-white text-2xl font-bold mt-3">{product.name}</Text>

            {/* Rating */}
            <View className="flex-row items-center mt-2">
              <View className="flex-row items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    color="#fbbf24"
                    fill={star <= 4 ? '#fbbf24' : 'transparent'}
                  />
                ))}
              </View>
              <Text className="text-yellow-400 ml-2">4.8</Text>
              <Text className="text-slate-500 ml-1">(124 reviews)</Text>
            </View>

            {/* Price */}
            <View className="flex-row items-baseline mt-4">
              <Text className="text-emerald-400 text-3xl font-bold">
                {formatPrice(product.salePrice || product.price)}
              </Text>
              {product.salePrice && (
                <Text className="text-slate-500 text-lg line-through ml-3">
                  {formatPrice(product.price)}
                </Text>
              )}
            </View>

            {/* Stock Status */}
            <View className="flex-row items-center mt-3">
              <View
                className={`w-2 h-2 rounded-full mr-2 ${
                  product.stockStatus === 'in_stock'
                    ? 'bg-emerald-500'
                    : product.stockStatus === 'low_stock'
                    ? 'bg-yellow-500'
                    : 'bg-red-500'
                }`}
              />
              <Text
                className={`capitalize ${
                  product.stockStatus === 'in_stock'
                    ? 'text-emerald-400'
                    : product.stockStatus === 'low_stock'
                    ? 'text-yellow-400'
                    : 'text-red-400'
                }`}
              >
                {product.stockStatus.replace('_', ' ')}
              </Text>
            </View>

            {/* Quantity Selector */}
            <View className="flex-row items-center justify-between mt-6 bg-slate-800 rounded-xl p-4">
              <Text className="text-white font-medium">Quantity</Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setQuantity(Math.max(1, quantity - 1))}
                  className="bg-slate-700 w-10 h-10 rounded-full items-center justify-center"
                >
                  <Minus size={18} color="#fff" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold mx-6">{quantity}</Text>
                <TouchableOpacity
                  onPress={() => setQuantity(quantity + 1)}
                  className="bg-emerald-500 w-10 h-10 rounded-full items-center justify-center"
                >
                  <Plus size={18} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Description */}
            <View className="mt-6">
              <Text className="text-white text-lg font-bold mb-2">Description</Text>
              <Text className="text-slate-400 leading-6">
                {product.description || 'No description available.'}
              </Text>
            </View>

            {/* Features */}
            <View className="mt-6 space-y-3">
              <View className="flex-row items-center bg-slate-800/50 p-4 rounded-xl">
                <View className="bg-emerald-500/20 p-2 rounded-full">
                  <Truck size={20} color="#10b981" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">Free Shipping</Text>
                  <Text className="text-slate-400 text-sm">On orders over ₦50,000</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-slate-800/50 p-4 rounded-xl">
                <View className="bg-blue-500/20 p-2 rounded-full">
                  <Shield size={20} color="#3b82f6" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">Quality Guaranteed</Text>
                  <Text className="text-slate-400 text-sm">100% authentic products</Text>
                </View>
              </View>

              <View className="flex-row items-center bg-slate-800/50 p-4 rounded-xl">
                <View className="bg-purple-500/20 p-2 rounded-full">
                  <Package size={20} color="#a855f7" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-white font-medium">Easy Returns</Text>
                  <Text className="text-slate-400 text-sm">7-day return policy</Text>
                </View>
              </View>
            </View>
          </View>

          {/* Spacer for bottom buttons */}
          <View className="h-32" />
        </ScrollView>

        {/* Bottom Actions */}
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.95)', '#0f172a']}
          className="absolute bottom-0 left-0 right-0 px-4 pt-8 pb-8"
        >
          <View className="flex-row space-x-3">
            <TouchableOpacity
              onPress={handleAddToCart}
              className="flex-1 bg-slate-800 py-4 rounded-xl flex-row items-center justify-center border border-emerald-500"
            >
              <ShoppingCart size={20} color="#10b981" />
              <Text className="text-emerald-400 font-bold ml-2">Add to Cart</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBuyNow}
              className="flex-1 bg-emerald-500 py-4 rounded-xl items-center justify-center"
            >
              <Text className="text-white font-bold">Buy Now</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}
