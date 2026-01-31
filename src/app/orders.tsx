/**
 * USER ORDERS PAGE
 * 
 * View order history and track orders.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronRight,
  ExternalLink,
} from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';

import { orderService } from '@/lib/supabase/orders';
import { useUserStore } from '@/lib/state/user-store';
import type { Order, OrderStatus } from '@/types/store';

const STATUS_CONFIG: Record<
  OrderStatus,
  { icon: typeof Package; color: string; bgColor: string; label: string }
> = {
  pending: {
    icon: Clock,
    color: '#f59e0b',
    bgColor: 'bg-yellow-500/20',
    label: 'Pending Payment',
  },
  paid: {
    icon: CheckCircle2,
    color: '#10b981',
    bgColor: 'bg-emerald-500/20',
    label: 'Paid',
  },
  processing: {
    icon: Package,
    color: '#3b82f6',
    bgColor: 'bg-blue-500/20',
    label: 'Processing',
  },
  shipped: {
    icon: Truck,
    color: '#8b5cf6',
    bgColor: 'bg-purple-500/20',
    label: 'Shipped',
  },
  delivered: {
    icon: CheckCircle2,
    color: '#10b981',
    bgColor: 'bg-emerald-500/20',
    label: 'Delivered',
  },
  cancelled: {
    icon: XCircle,
    color: '#ef4444',
    bgColor: 'bg-red-500/20',
    label: 'Cancelled',
  },
  refunded: {
    icon: XCircle,
    color: '#6b7280',
    bgColor: 'bg-gray-500/20',
    label: 'Refunded',
  },
};

export default function OrdersScreen() {
  const router = useRouter();
  const profile = useUserStore((state) => state.profile);

  const {
    data: orders,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['user-orders', profile?.id],
    queryFn: () => (profile?.id ? orderService.getByUserId(profile.id) : Promise.resolve([])),
    enabled: !!profile?.id,
  });

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderOrderCard = (order: Order) => {
    const status = STATUS_CONFIG[order.status];
    const StatusIcon = status.icon;

    return (
      <TouchableOpacity
        key={order.id}
        onPress={() => router.push(`/order/${order.id}`)}
        className="bg-slate-800 rounded-xl p-4 mb-4"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className="text-white font-bold">{order.orderNumber}</Text>
            <Text className="text-slate-400 text-sm">
              {formatDate(order.createdAt)}
            </Text>
          </View>

          <View className={`flex-row items-center px-3 py-1 rounded-full ${status.bgColor}`}>
            <StatusIcon size={14} color={status.color} />
            <Text style={{ color: status.color }} className="ml-1 text-sm font-medium">
              {status.label}
            </Text>
          </View>
        </View>

        {/* Items Preview */}
        <View className="border-t border-slate-700 pt-3">
          <Text className="text-slate-400 text-sm mb-2">
            {order.items.length} item{order.items.length > 1 ? 's' : ''}
          </Text>
          {order.items.slice(0, 2).map((item, index) => (
            <Text key={index} className="text-white" numberOfLines={1}>
              {item.quantity}x {item.name}
            </Text>
          ))}
          {order.items.length > 2 && (
            <Text className="text-slate-400 text-sm">
              +{order.items.length - 2} more items
            </Text>
          )}
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between mt-4 pt-3 border-t border-slate-700">
          <View>
            <Text className="text-slate-400 text-sm">Total</Text>
            <Text className="text-emerald-400 font-bold text-lg">
              {formatPrice(order.total)}
            </Text>
          </View>

          <View className="flex-row items-center">
            {order.trackingUrl && (
              <TouchableOpacity
                onPress={() => {
                  // Open tracking URL
                }}
                className="bg-slate-700 px-3 py-2 rounded-lg flex-row items-center mr-2"
              >
                <ExternalLink size={14} color="#fff" />
                <Text className="text-white text-sm ml-1">Track</Text>
              </TouchableOpacity>
            )}
            <ChevronRight size={20} color="#64748b" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View className="flex-1 bg-slate-900">
      <SafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-4">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#fff" />
          </TouchableOpacity>
          <Text className="text-white text-xl font-bold ml-4">My Orders</Text>
        </View>

        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#10b981" />
            <Text className="text-slate-400 mt-4">Loading orders...</Text>
          </View>
        ) : !orders || orders.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="bg-slate-800/50 p-6 rounded-full mb-6">
              <Package size={60} color="#334155" />
            </View>
            <Text className="text-white text-2xl font-bold text-center">
              No orders yet
            </Text>
            <Text className="text-slate-400 text-center mt-2">
              Your order history will appear here
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/store')}
              className="mt-6 bg-emerald-500 px-8 py-4 rounded-xl"
            >
              <Text className="text-white font-bold">Browse Store</Text>
            </TouchableOpacity>
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
            {orders.map(renderOrderCard)}
            <View className="h-8" />
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}
