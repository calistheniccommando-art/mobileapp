/**
 * ADMIN PRODUCTS PAGE
 * 
 * Product management for administrators.
 * Create, edit, and manage store products.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Plus,
  Search,
  Package,
  Edit3,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  X,
  Upload,
  Video,
  DollarSign,
  Tag,
  FileText,
  Image as ImageIcon,
  Check,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';

import { productService } from '@/lib/supabase/products';
import type { Product, ProductCategory, ProductInsert, ProductUpdate, StockStatus } from '@/types/store';

const CATEGORIES: { key: ProductCategory; label: string }[] = [
  { key: 'supplements', label: 'Supplements' },
  { key: 'gym_wear', label: 'Gym Wear' },
  { key: 'equipment', label: 'Equipment' },
  { key: 'accessories', label: 'Accessories' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'recovery', label: 'Recovery' },
];

const STOCK_OPTIONS: { key: StockStatus; label: string; color: string }[] = [
  { key: 'in_stock', label: 'In Stock', color: '#10b981' },
  { key: 'low_stock', label: 'Low Stock', color: '#f59e0b' },
  { key: 'out_of_stock', label: 'Out of Stock', color: '#ef4444' },
];

export default function AdminProductsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<ProductCategory | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<ProductInsert>>({
    name: '',
    description: '',
    price: 0,
    salePrice: null,
    category: 'supplements',
    images: [],
    videoUrl: '',
    stockStatus: 'in_stock',
    isFeatured: false,
  });

  // Queries
  const { data: productsData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-products', filterCategory, searchQuery],
    queryFn: async () => {
      if (searchQuery) {
        return productService.search(searchQuery);
      }
      const filters: any = {};
      if (filterCategory !== 'all') {
        filters.category = filterCategory;
      }
      return productService.list({ filters, limit: 100 });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-product-stats'],
    queryFn: () => productService.getStats(),
  });

  const products = (productsData as any)?.products || productsData || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: ProductInsert) => productService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-stats'] });
      resetForm();
      Alert.alert('Success', 'Product created successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to create product');
      console.error(error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProductUpdate }) =>
      productService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      resetForm();
      Alert.alert('Success', 'Product updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update product');
      console.error(error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-product-stats'] });
      Alert.alert('Success', 'Product deleted');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to delete product');
      console.error(error);
    },
  });

  const duplicateMutation = useMutation({
    mutationFn: (id: string) => productService.duplicate(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      Alert.alert('Success', 'Product duplicated');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to duplicate product');
      console.error(error);
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      productService.update(id, { isActive }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    },
  });

  // Form handlers
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      salePrice: null,
      category: 'supplements',
      images: [],
      videoUrl: '',
      stockStatus: 'in_stock',
      isFeatured: false,
    });
    setEditingProduct(null);
    setShowForm(false);
  };

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      price: product.price,
      salePrice: product.salePrice,
      category: product.category,
      images: product.images,
      videoUrl: product.videoUrl || '',
      stockStatus: product.stockStatus,
      isFeatured: product.isFeatured,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    if (!formData.name?.trim()) {
      Alert.alert('Required', 'Please enter a product name');
      return;
    }
    if (!formData.price || formData.price <= 0) {
      Alert.alert('Required', 'Please enter a valid price');
      return;
    }

    const data: ProductInsert = {
      name: formData.name!,
      description: formData.description || '',
      price: formData.price!,
      salePrice: formData.salePrice || null,
      category: formData.category!,
      images: formData.images || [],
      videoUrl: formData.videoUrl || null,
      stockStatus: formData.stockStatus || 'in_stock',
      isFeatured: formData.isFeatured || false,
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (product: Product) => {
    Alert.alert(
      'Delete Product',
      `Are you sure you want to delete "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate(product.id),
        },
      ]
    );
  };

  const handleDuplicate = (product: Product) => {
    Alert.alert(
      'Duplicate Product',
      `Create a copy of "${product.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Duplicate', onPress: () => duplicateMutation.mutate(product.id) },
      ]
    );
  };

  const handlePickImages = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
    });

    if (!result.canceled) {
      const newImages = result.assets.map((asset) => asset.uri);
      setFormData({
        ...formData,
        images: [...(formData.images || []), ...newImages],
      });
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...(formData.images || [])];
    newImages.splice(index, 1);
    setFormData({ ...formData, images: newImages });
  };

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-4">Products</Text>
          </View>

          <TouchableOpacity
            onPress={() => setShowForm(true)}
            className="bg-emerald-500 px-4 py-2 rounded-lg flex-row items-center"
          >
            <Plus size={18} color="#fff" />
            <Text className="text-white font-medium ml-2">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Stats */}
        {stats && (
          <View className="flex-row px-4 mb-4 space-x-3">
            <View className="flex-1 bg-slate-800 rounded-xl p-3">
              <Text className="text-slate-400 text-xs">Total</Text>
              <Text className="text-white font-bold text-lg">{stats.total}</Text>
            </View>
            <View className="flex-1 bg-emerald-500/20 rounded-xl p-3">
              <Text className="text-emerald-400 text-xs">Active</Text>
              <Text className="text-emerald-400 font-bold text-lg">{stats.active}</Text>
            </View>
            <View className="flex-1 bg-yellow-500/20 rounded-xl p-3">
              <Text className="text-yellow-400 text-xs">Inactive</Text>
              <Text className="text-yellow-400 font-bold text-lg">{stats.draft}</Text>
            </View>
          </View>
        )}

        {/* Search */}
        <View className="px-4 mb-4">
          <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
            <Search size={18} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search products..."
              placeholderTextColor="#64748b"
              className="flex-1 text-white ml-3"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={18} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 mb-4"
        >
          <TouchableOpacity
            onPress={() => setFilterCategory('all')}
            className={`mr-2 px-4 py-2 rounded-full ${
              filterCategory === 'all' ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <Text className={filterCategory === 'all' ? 'text-white' : 'text-slate-300'}>
              All
            </Text>
          </TouchableOpacity>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.key}
              onPress={() => setFilterCategory(cat.key)}
              className={`mr-2 px-4 py-2 rounded-full ${
                filterCategory === cat.key ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={filterCategory === cat.key ? 'text-white' : 'text-slate-300'}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Products List */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
          </View>
        ) : (
          <ScrollView
            className="flex-1 px-4"
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={refetch}
                tintColor="#10b981"
              />
            }
          >
            {products.length === 0 ? (
              <View className="items-center py-20">
                <Package size={60} color="#334155" />
                <Text className="text-slate-400 text-lg mt-4">No products found</Text>
              </View>
            ) : (
              products.map((product: Product) => (
                <View
                  key={product.id}
                  className={`bg-slate-800 rounded-xl p-4 mb-4 ${
                    !product.isActive ? 'opacity-60' : ''
                  }`}
                >
                  <View className="flex-row">
                    {/* Image */}
                    {product.images[0] ? (
                      <Image
                        source={{ uri: product.images[0] }}
                        className="w-20 h-20 rounded-xl"
                        resizeMode="cover"
                      />
                    ) : (
                      <View className="w-20 h-20 rounded-xl bg-slate-700 items-center justify-center">
                        <Package size={24} color="#64748b" />
                      </View>
                    )}

                    {/* Info */}
                    <View className="flex-1 ml-4">
                      <View className="flex-row items-start justify-between">
                        <Text className="text-white font-medium flex-1" numberOfLines={2}>
                          {product.name}
                        </Text>
                        {product.isFeatured && (
                          <View className="bg-yellow-500/20 px-2 py-0.5 rounded">
                            <Text className="text-yellow-400 text-xs">Featured</Text>
                          </View>
                        )}
                      </View>

                      <View className="flex-row items-center mt-1">
                        <Text className="text-emerald-400 font-bold">
                          {formatPrice(product.salePrice || product.price)}
                        </Text>
                        {product.salePrice && (
                          <Text className="text-slate-500 text-sm line-through ml-2">
                            {formatPrice(product.price)}
                          </Text>
                        )}
                      </View>

                      <View className="flex-row items-center mt-2">
                        <View
                          className={`px-2 py-0.5 rounded ${
                            product.stockStatus === 'in_stock'
                              ? 'bg-emerald-500/20'
                              : product.stockStatus === 'low_stock'
                              ? 'bg-yellow-500/20'
                              : 'bg-red-500/20'
                          }`}
                        >
                          <Text
                            className={`text-xs capitalize ${
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
                        <Text className="text-slate-500 text-xs ml-2 capitalize">
                          {product.category.replace('_', ' ')}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Actions */}
                  <View className="flex-row items-center justify-end mt-4 pt-3 border-t border-slate-700 space-x-3">
                    <TouchableOpacity
                      onPress={() =>
                        toggleActiveMutation.mutate({
                          id: product.id,
                          isActive: !product.isActive,
                        })
                      }
                      className="p-2"
                    >
                      {product.isActive ? (
                        <Eye size={18} color="#10b981" />
                      ) : (
                        <EyeOff size={18} color="#64748b" />
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDuplicate(product)}
                      className="p-2"
                    >
                      <Copy size={18} color="#3b82f6" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleEdit(product)} className="p-2">
                      <Edit3 size={18} color="#f59e0b" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(product)} className="p-2">
                      <Trash2 size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            <View className="h-8" />
          </ScrollView>
        )}

        {/* Add/Edit Modal */}
        <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet">
          <View className="flex-1 bg-slate-900">
            <SafeAreaView className="flex-1">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-800">
                <TouchableOpacity onPress={resetForm}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">
                  {editingProduct ? 'Edit Product' : 'New Product'}
                </Text>
                <TouchableOpacity
                  onPress={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <ActivityIndicator color="#10b981" />
                  ) : (
                    <Check size={24} color="#10b981" />
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {/* Name */}
                <View className="mt-4">
                  <Text className="text-slate-400 text-sm mb-2">Product Name *</Text>
                  <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                    <FileText size={18} color="#64748b" />
                    <TextInput
                      value={formData.name}
                      onChangeText={(text) => setFormData({ ...formData, name: text })}
                      placeholder="Enter product name"
                      placeholderTextColor="#64748b"
                      className="flex-1 text-white ml-3"
                    />
                  </View>
                </View>

                {/* Description */}
                <View className="mt-4">
                  <Text className="text-slate-400 text-sm mb-2">Description</Text>
                  <TextInput
                    value={formData.description}
                    onChangeText={(text) => setFormData({ ...formData, description: text })}
                    placeholder="Enter product description"
                    placeholderTextColor="#64748b"
                    multiline
                    numberOfLines={4}
                    className="bg-slate-800 text-white px-4 py-3 rounded-xl"
                    style={{ textAlignVertical: 'top' }}
                  />
                </View>

                {/* Price */}
                <View className="mt-4 flex-row space-x-4">
                  <View className="flex-1">
                    <Text className="text-slate-400 text-sm mb-2">Price (₦) *</Text>
                    <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                      <DollarSign size={18} color="#64748b" />
                      <TextInput
                        value={formData.price?.toString()}
                        onChangeText={(text) =>
                          setFormData({ ...formData, price: parseInt(text) || 0 })
                        }
                        placeholder="0"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        className="flex-1 text-white ml-3"
                      />
                    </View>
                  </View>

                  <View className="flex-1">
                    <Text className="text-slate-400 text-sm mb-2">Sale Price (₦)</Text>
                    <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                      <Tag size={18} color="#64748b" />
                      <TextInput
                        value={formData.salePrice?.toString() || ''}
                        onChangeText={(text) =>
                          setFormData({
                            ...formData,
                            salePrice: text ? parseInt(text) : null,
                          })
                        }
                        placeholder="Optional"
                        placeholderTextColor="#64748b"
                        keyboardType="numeric"
                        className="flex-1 text-white ml-3"
                      />
                    </View>
                  </View>
                </View>

                {/* Category */}
                <View className="mt-4">
                  <Text className="text-slate-400 text-sm mb-2">Category</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {CATEGORIES.map((cat) => (
                      <TouchableOpacity
                        key={cat.key}
                        onPress={() => setFormData({ ...formData, category: cat.key })}
                        className={`mr-2 px-4 py-2 rounded-full ${
                          formData.category === cat.key ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <Text
                          className={
                            formData.category === cat.key ? 'text-white' : 'text-slate-300'
                          }
                        >
                          {cat.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Stock Status */}
                <View className="mt-4">
                  <Text className="text-slate-400 text-sm mb-2">Stock Status</Text>
                  <View className="flex-row space-x-3">
                    {STOCK_OPTIONS.map((option) => (
                      <TouchableOpacity
                        key={option.key}
                        onPress={() => setFormData({ ...formData, stockStatus: option.key })}
                        className={`flex-1 px-3 py-3 rounded-xl border ${
                          formData.stockStatus === option.key
                            ? 'border-emerald-500 bg-emerald-500/20'
                            : 'border-slate-700 bg-slate-800'
                        }`}
                      >
                        <Text
                          className="text-center text-sm"
                          style={{
                            color:
                              formData.stockStatus === option.key ? option.color : '#94a3b8',
                          }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* Images */}
                <View className="mt-4">
                  <Text className="text-slate-400 text-sm mb-2">Product Images</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {(formData.images || []).map((uri, index) => (
                      <View key={index} className="mr-3 relative">
                        <Image
                          source={{ uri }}
                          className="w-24 h-24 rounded-xl"
                          resizeMode="cover"
                        />
                        <TouchableOpacity
                          onPress={() => handleRemoveImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 w-6 h-6 rounded-full items-center justify-center"
                        >
                          <X size={14} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    ))}
                    <TouchableOpacity
                      onPress={handlePickImages}
                      className="w-24 h-24 rounded-xl bg-slate-800 items-center justify-center border-2 border-dashed border-slate-600"
                    >
                      <ImageIcon size={24} color="#64748b" />
                      <Text className="text-slate-500 text-xs mt-1">Add</Text>
                    </TouchableOpacity>
                  </ScrollView>
                </View>

                {/* Video URL */}
                <View className="mt-4">
                  <Text className="text-slate-400 text-sm mb-2">Video URL (Optional)</Text>
                  <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                    <Video size={18} color="#64748b" />
                    <TextInput
                      value={formData.videoUrl || ''}
                      onChangeText={(text) => setFormData({ ...formData, videoUrl: text })}
                      placeholder="https://..."
                      placeholderTextColor="#64748b"
                      className="flex-1 text-white ml-3"
                    />
                  </View>
                </View>

                {/* Featured Toggle */}
                <TouchableOpacity
                  onPress={() =>
                    setFormData({ ...formData, isFeatured: !formData.isFeatured })
                  }
                  className="mt-4 bg-slate-800 rounded-xl p-4 flex-row items-center justify-between"
                >
                  <Text className="text-white">Featured Product</Text>
                  <View
                    className={`w-12 h-7 rounded-full ${
                      formData.isFeatured ? 'bg-emerald-500' : 'bg-slate-600'
                    } justify-center`}
                  >
                    <View
                      className={`w-5 h-5 rounded-full bg-white ${
                        formData.isFeatured ? 'ml-6' : 'ml-1'
                      }`}
                    />
                  </View>
                </TouchableOpacity>

                <View className="h-32" />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
