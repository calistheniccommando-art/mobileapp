/**
 * SHOPPING CART PAGE
 * 
 * View cart items, update quantities, and proceed to checkout.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Trash2,
  Minus,
  Plus,
  Package,
  ShoppingBag,
  ChevronRight,
  MapPin,
  CreditCard,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useCartStore } from '@/lib/state/cart-store';
import { NIGERIAN_STATES, type ShippingAddress } from '@/types/store';

export default function CartScreen() {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);

  const items = useCartStore((state) => state.items);
  const subtotal = useCartStore((state) => state.subtotal);
  const shipping = useCartStore((state) => state.shipping);
  const total = useCartStore((state) => state.total);
  const shippingAddress = useCartStore((state) => state.shippingAddress);
  const removeItem = useCartStore((state) => state.removeItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const clearCart = useCartStore((state) => state.clearCart);
  const setShippingAddress = useCartStore((state) => state.setShippingAddress);

  // Shipping form state
  const [address, setAddress] = useState<Partial<ShippingAddress>>(
    shippingAddress || {
      fullName: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      state: 'Lagos',
      landmark: '',
    }
  );
  const [showStateSelector, setShowStateSelector] = useState(false);

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const handleRemoveItem = (productId: string, name: string) => {
    Alert.alert('Remove Item', `Remove ${name} from cart?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeItem(productId) },
    ]);
  };

  const handleClearCart = () => {
    Alert.alert('Clear Cart', 'Remove all items from cart?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: clearCart },
    ]);
  };

  const handleProceedToCheckout = () => {
    if (items.length === 0) return;
    setShowCheckout(true);
  };

  const validateAddress = (): boolean => {
    if (!address.fullName?.trim()) {
      Alert.alert('Required', 'Please enter your full name');
      return false;
    }
    if (!address.phone?.trim() || address.phone.length < 10) {
      Alert.alert('Required', 'Please enter a valid phone number');
      return false;
    }
    if (!address.email?.trim() || !address.email.includes('@')) {
      Alert.alert('Required', 'Please enter a valid email address');
      return false;
    }
    if (!address.address?.trim()) {
      Alert.alert('Required', 'Please enter your delivery address');
      return false;
    }
    if (!address.city?.trim()) {
      Alert.alert('Required', 'Please enter your city');
      return false;
    }
    if (!address.state) {
      Alert.alert('Required', 'Please select your state');
      return false;
    }
    return true;
  };

  const handleConfirmAddress = () => {
    if (!validateAddress()) return;

    const fullAddress: ShippingAddress = {
      fullName: address.fullName!,
      phone: address.phone!,
      email: address.email!,
      address: address.address!,
      city: address.city!,
      state: address.state!,
      landmark: address.landmark,
    };

    setShippingAddress(fullAddress);
    router.push('/checkout');
  };

  // Empty cart
  if (items.length === 0 && !showCheckout) {
    return (
      <View className="flex-1 bg-slate-900">
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center px-4 py-4">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-4">Shopping Cart</Text>
          </View>

          {/* Empty State */}
          <View className="flex-1 items-center justify-center px-8">
            <View className="bg-slate-800/50 p-6 rounded-full mb-6">
              <ShoppingBag size={60} color="#334155" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">
              Your cart is empty
            </Text>
            <Text className="text-slate-400 text-center mt-2">
              Browse our store and add some items to get started
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/store')}
              className="mt-6 bg-emerald-500 px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-bold">Browse Store</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Checkout / Address Form
  if (showCheckout) {
    return (
      <View className="flex-1 bg-slate-900">
        <SafeAreaView className="flex-1" edges={['top']}>
          {/* Header */}
          <View className="flex-row items-center px-4 py-4">
            <TouchableOpacity onPress={() => setShowCheckout(false)} className="p-2">
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-4">Shipping Address</Text>
          </View>

          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            {/* State Selector Modal */}
            {showStateSelector && (
              <View className="absolute top-0 left-0 right-0 z-10 bg-slate-800 rounded-xl p-4 max-h-80">
                <ScrollView>
                  {NIGERIAN_STATES.map((state) => (
                    <TouchableOpacity
                      key={state}
                      onPress={() => {
                        setAddress({ ...address, state });
                        setShowStateSelector(false);
                      }}
                      className="py-3 border-b border-slate-700"
                    >
                      <Text
                        className={`${
                          address.state === state ? 'text-emerald-400' : 'text-white'
                        }`}
                      >
                        {state}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Form Fields */}
            <View className="space-y-4 pb-32">
              <View>
                <Text className="text-slate-400 text-sm mb-2">Full Name *</Text>
                <TextInput
                  value={address.fullName}
                  onChangeText={(text) => setAddress({ ...address, fullName: text })}
                  placeholder="John Doe"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 text-white px-4 py-4 rounded-xl"
                />
              </View>

              <View>
                <Text className="text-slate-400 text-sm mb-2">Phone Number *</Text>
                <TextInput
                  value={address.phone}
                  onChangeText={(text) => setAddress({ ...address, phone: text })}
                  placeholder="08012345678"
                  placeholderTextColor="#64748b"
                  keyboardType="phone-pad"
                  className="bg-slate-800 text-white px-4 py-4 rounded-xl"
                />
              </View>

              <View>
                <Text className="text-slate-400 text-sm mb-2">Email Address *</Text>
                <TextInput
                  value={address.email}
                  onChangeText={(text) => setAddress({ ...address, email: text })}
                  placeholder="john@example.com"
                  placeholderTextColor="#64748b"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  className="bg-slate-800 text-white px-4 py-4 rounded-xl"
                />
              </View>

              <View>
                <Text className="text-slate-400 text-sm mb-2">Delivery Address *</Text>
                <TextInput
                  value={address.address}
                  onChangeText={(text) => setAddress({ ...address, address: text })}
                  placeholder="123 Main Street, Lekki"
                  placeholderTextColor="#64748b"
                  multiline
                  numberOfLines={2}
                  className="bg-slate-800 text-white px-4 py-4 rounded-xl"
                />
              </View>

              <View className="flex-row space-x-4">
                <View className="flex-1">
                  <Text className="text-slate-400 text-sm mb-2">City *</Text>
                  <TextInput
                    value={address.city}
                    onChangeText={(text) => setAddress({ ...address, city: text })}
                    placeholder="Lagos"
                    placeholderTextColor="#64748b"
                    className="bg-slate-800 text-white px-4 py-4 rounded-xl"
                  />
                </View>

                <View className="flex-1">
                  <Text className="text-slate-400 text-sm mb-2">State *</Text>
                  <TouchableOpacity
                    onPress={() => setShowStateSelector(!showStateSelector)}
                    className="bg-slate-800 px-4 py-4 rounded-xl flex-row items-center justify-between"
                  >
                    <Text className="text-white">{address.state || 'Select'}</Text>
                    <ChevronRight size={16} color="#64748b" />
                  </TouchableOpacity>
                </View>
              </View>

              <View>
                <Text className="text-slate-400 text-sm mb-2">
                  Nearest Landmark (Optional)
                </Text>
                <TextInput
                  value={address.landmark}
                  onChangeText={(text) => setAddress({ ...address, landmark: text })}
                  placeholder="Near ABC Shopping Mall"
                  placeholderTextColor="#64748b"
                  className="bg-slate-800 text-white px-4 py-4 rounded-xl"
                />
              </View>

              {/* Order Summary */}
              <View className="bg-slate-800 rounded-xl p-4 mt-6">
                <Text className="text-white font-bold text-lg mb-4">Order Summary</Text>

                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-400">
                    Subtotal ({items.length} items)
                  </Text>
                  <Text className="text-white">{formatPrice(subtotal)}</Text>
                </View>

                <View className="flex-row justify-between mb-2">
                  <Text className="text-slate-400">Shipping to {address.state}</Text>
                  <Text className="text-white">
                    {address.state ? formatPrice(useCartStore.getState().calculateShipping(address.state)) : '—'}
                  </Text>
                </View>

                <View className="border-t border-slate-700 pt-3 mt-3">
                  <View className="flex-row justify-between">
                    <Text className="text-white font-bold">Total</Text>
                    <Text className="text-emerald-400 font-bold text-lg">
                      {formatPrice(
                        subtotal +
                          (address.state
                            ? useCartStore.getState().calculateShipping(address.state)
                            : 0)
                      )}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Bottom Action */}
          <LinearGradient
            colors={['transparent', 'rgba(15, 23, 42, 0.95)', '#0f172a']}
            className="absolute bottom-0 left-0 right-0 px-4 pt-8 pb-8"
          >
            <TouchableOpacity
              onPress={handleConfirmAddress}
              className="bg-emerald-500 py-4 rounded-xl flex-row items-center justify-center"
            >
              <CreditCard size={20} color="#fff" />
              <Text className="text-white font-bold ml-2">Proceed to Payment</Text>
            </TouchableOpacity>
          </LinearGradient>
        </SafeAreaView>
      </View>
    );
  }

  // Cart with items
  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text className="text-white text-xl font-bold ml-4">
              Shopping Cart ({items.length})
            </Text>
          </View>

          <TouchableOpacity onPress={handleClearCart}>
            <Text className="text-red-400">Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Cart Items */}
          {items.map((item) => (
            <View
              key={item.productId}
              className="bg-slate-800/60 rounded-xl p-4 mb-4 flex-row"
            >
              {/* Product Image */}
              {item.image ? (
                <Image
                  source={{ uri: item.image }}
                  className="w-20 h-20 rounded-xl"
                  resizeMode="cover"
                />
              ) : (
                <View className="w-20 h-20 rounded-xl bg-slate-700 items-center justify-center">
                  <Package size={24} color="#64748b" />
                </View>
              )}

              {/* Product Info */}
              <View className="flex-1 ml-4 justify-between">
                <View>
                  <Text className="text-white font-medium" numberOfLines={2}>
                    {item.name}
                  </Text>
                  <View className="flex-row items-center mt-1">
                    <Text className="text-emerald-400 font-bold">
                      {formatPrice(item.price)}
                    </Text>
                    {item.originalPrice > item.price && (
                      <Text className="text-slate-500 text-sm line-through ml-2">
                        {formatPrice(item.originalPrice)}
                      </Text>
                    )}
                  </View>
                </View>

                {/* Quantity Controls */}
                <View className="flex-row items-center justify-between mt-2">
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.productId, item.quantity - 1)}
                      className="bg-slate-700 w-8 h-8 rounded-full items-center justify-center"
                    >
                      <Minus size={14} color="#fff" />
                    </TouchableOpacity>
                    <Text className="text-white font-bold mx-4">{item.quantity}</Text>
                    <TouchableOpacity
                      onPress={() => updateQuantity(item.productId, item.quantity + 1)}
                      className="bg-emerald-500 w-8 h-8 rounded-full items-center justify-center"
                    >
                      <Plus size={14} color="#fff" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleRemoveItem(item.productId, item.name)}
                  >
                    <Trash2 size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}

          {/* Order Summary */}
          <View className="bg-slate-800 rounded-xl p-4 mt-4 mb-32">
            <Text className="text-white font-bold text-lg mb-4">Order Summary</Text>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400">Subtotal</Text>
              <Text className="text-white">{formatPrice(subtotal)}</Text>
            </View>

            <View className="flex-row justify-between mb-2">
              <Text className="text-slate-400">Shipping</Text>
              <Text className="text-slate-400">Calculated at checkout</Text>
            </View>

            <View className="border-t border-slate-700 pt-3 mt-3">
              <View className="flex-row justify-between">
                <Text className="text-white font-bold">Estimated Total</Text>
                <Text className="text-emerald-400 font-bold text-lg">
                  {formatPrice(subtotal)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Bottom Action */}
        <LinearGradient
          colors={['transparent', 'rgba(15, 23, 42, 0.95)', '#0f172a']}
          className="absolute bottom-0 left-0 right-0 px-4 pt-8 pb-8"
        >
          <TouchableOpacity
            onPress={handleProceedToCheckout}
            className="bg-emerald-500 py-4 rounded-xl flex-row items-center justify-center"
          >
            <MapPin size={20} color="#fff" />
            <Text className="text-white font-bold ml-2">Add Delivery Address</Text>
          </TouchableOpacity>
        </LinearGradient>
      </SafeAreaView>
    </View>
  );
}
