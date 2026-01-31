/**
 * ADMIN ORDERS PAGE
 * 
 * Order management for administrators.
 * View orders, update status, track sourcing from Amazon/eBay.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  RefreshControl,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  X,
  ExternalLink,
  Phone,
  Mail,
  MapPin,
  ChevronDown,
  ChevronUp,
  DollarSign,
  ShoppingBag,
  Link as LinkIcon,
  FileText,
  Calendar,
} from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { orderService } from '@/lib/supabase/orders';
import type { Order, OrderStatus } from '@/types/store';

const STATUS_CONFIG: Record<
  OrderStatus,
  { icon: typeof Package; color: string; bgColor: string; label: string }
> = {
  pending: {
    icon: Clock,
    color: '#f59e0b',
    bgColor: 'bg-yellow-500/20',
    label: 'Pending',
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

const STATUS_OPTIONS: OrderStatus[] = [
  'pending',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
];

export default function AdminOrdersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  // Update form state
  const [updateForm, setUpdateForm] = useState({
    status: 'paid' as OrderStatus,
    sourceOrderId: '',
    sourceOrderUrl: '',
    trackingNumber: '',
    trackingUrl: '',
    estimatedDelivery: '',
    adminNotes: '',
    cancellationReason: '',
  });

  // Queries
  const { data: ordersData, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['admin-orders', filterStatus, searchQuery],
    queryFn: async () => {
      const filters: any = {};
      if (filterStatus !== 'all') {
        filters.status = filterStatus;
      }
      if (searchQuery) {
        filters.search = searchQuery;
      }
      return orderService.list({ filters, limit: 100 });
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-order-stats'],
    queryFn: () => orderService.getStats(),
  });

  const orders = ordersData?.orders || [];

  // Mutations
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) =>
      orderService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-order-stats'] });
      setShowUpdateModal(false);
      setSelectedOrder(null);
      Alert.alert('Success', 'Order updated successfully');
    },
    onError: (error) => {
      Alert.alert('Error', 'Failed to update order');
      console.error(error);
    },
  });

  const formatPrice = (price: number) => {
    return `₦${price.toLocaleString()}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-NG', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleOpenUpdate = (order: Order) => {
    setSelectedOrder(order);
    setUpdateForm({
      status: order.status,
      sourceOrderId: order.sourceOrderId || '',
      sourceOrderUrl: order.sourceOrderUrl || '',
      trackingNumber: order.trackingNumber || '',
      trackingUrl: order.trackingUrl || '',
      estimatedDelivery: order.estimatedDelivery || '',
      adminNotes: order.adminNotes || '',
      cancellationReason: order.cancellationReason || '',
    });
    setShowUpdateModal(true);
  };

  const handleSaveUpdate = () => {
    if (!selectedOrder) return;

    const updates: any = {
      status: updateForm.status,
    };

    if (updateForm.sourceOrderId) updates.sourceOrderId = updateForm.sourceOrderId;
    if (updateForm.sourceOrderUrl) updates.sourceOrderUrl = updateForm.sourceOrderUrl;
    if (updateForm.trackingNumber) updates.trackingNumber = updateForm.trackingNumber;
    if (updateForm.trackingUrl) updates.trackingUrl = updateForm.trackingUrl;
    if (updateForm.estimatedDelivery) updates.estimatedDelivery = updateForm.estimatedDelivery;
    if (updateForm.adminNotes) updates.adminNotes = updateForm.adminNotes;
    if (updateForm.cancellationReason) updates.cancellationReason = updateForm.cancellationReason;

    // Auto-set timestamps based on status
    if (updateForm.status === 'shipped' && !selectedOrder.shippedAt) {
      updates.shippedAt = new Date().toISOString();
    }
    if (updateForm.status === 'delivered' && !selectedOrder.deliveredAt) {
      updates.deliveredAt = new Date().toISOString();
    }
    if (updateForm.status === 'cancelled' && !selectedOrder.cancelledAt) {
      updates.cancelledAt = new Date().toISOString();
    }

    updateMutation.mutate({ id: selectedOrder.id, updates });
  };

  const handleCallCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmailCustomer = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const handleOpenSourceUrl = (url: string) => {
    Linking.openURL(url);
  };

  const renderOrderCard = (order: Order) => {
    const status = STATUS_CONFIG[order.status];
    const StatusIcon = status.icon;
    const isExpanded = expandedOrder === order.id;

    return (
      <View key={order.id} className="bg-slate-800 rounded-xl mb-4 overflow-hidden">
        {/* Header */}
        <TouchableOpacity
          onPress={() => setExpandedOrder(isExpanded ? null : order.id)}
          className="p-4"
        >
          <View className="flex-row items-center justify-between mb-2">
            <Text className="text-white font-bold">{order.orderNumber}</Text>
            <View className={`flex-row items-center px-3 py-1 rounded-full ${status.bgColor}`}>
              <StatusIcon size={14} color={status.color} />
              <Text style={{ color: status.color }} className="ml-1 text-sm font-medium">
                {status.label}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-slate-400 text-sm">{formatDate(order.createdAt)}</Text>
              <Text className="text-white">{order.shippingAddress?.fullName}</Text>
            </View>
            <View className="flex-row items-center">
              <Text className="text-emerald-400 font-bold text-lg mr-2">
                {formatPrice(order.total)}
              </Text>
              {isExpanded ? (
                <ChevronUp size={20} color="#64748b" />
              ) : (
                <ChevronDown size={20} color="#64748b" />
              )}
            </View>
          </View>
        </TouchableOpacity>

        {/* Expanded Content */}
        {isExpanded && (
          <View className="px-4 pb-4 border-t border-slate-700">
            {/* Customer Contact */}
            <View className="flex-row items-center mt-4 space-x-3">
              <TouchableOpacity
                onPress={() => handleCallCustomer(order.shippingAddress?.phone || '')}
                className="flex-1 bg-slate-700 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Phone size={16} color="#10b981" />
                <Text className="text-emerald-400 ml-2">Call</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleEmailCustomer(order.userEmail)}
                className="flex-1 bg-slate-700 py-3 rounded-lg flex-row items-center justify-center"
              >
                <Mail size={16} color="#3b82f6" />
                <Text className="text-blue-400 ml-2">Email</Text>
              </TouchableOpacity>
            </View>

            {/* Shipping Address */}
            <View className="mt-4 bg-slate-700/50 rounded-lg p-3">
              <View className="flex-row items-center mb-2">
                <MapPin size={14} color="#64748b" />
                <Text className="text-slate-400 text-sm ml-1">Delivery Address</Text>
              </View>
              <Text className="text-white">{order.shippingAddress?.fullName}</Text>
              <Text className="text-slate-400 text-sm">
                {order.shippingAddress?.address}, {order.shippingAddress?.city}
              </Text>
              <Text className="text-slate-400 text-sm">{order.shippingAddress?.state}</Text>
              <Text className="text-slate-400 text-sm">{order.shippingAddress?.phone}</Text>
            </View>

            {/* Order Items */}
            <View className="mt-4">
              <Text className="text-slate-400 text-sm mb-2">
                Items ({order.items.length})
              </Text>
              {order.items.map((item, index) => (
                <View key={index} className="flex-row justify-between py-2">
                  <Text className="text-white flex-1" numberOfLines={1}>
                    {item.quantity}x {item.name}
                  </Text>
                  <Text className="text-slate-300">
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
              <View className="flex-row justify-between pt-2 mt-2 border-t border-slate-700">
                <Text className="text-slate-400">Subtotal</Text>
                <Text className="text-white">{formatPrice(order.subtotal)}</Text>
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-slate-400">Shipping</Text>
                <Text className="text-white">{formatPrice(order.shipping)}</Text>
              </View>
              <View className="flex-row justify-between mt-2 pt-2 border-t border-slate-700">
                <Text className="text-white font-bold">Total</Text>
                <Text className="text-emerald-400 font-bold">{formatPrice(order.total)}</Text>
              </View>
            </View>

            {/* Source Order Info (if processing) */}
            {order.sourceOrderUrl && (
              <TouchableOpacity
                onPress={() => handleOpenSourceUrl(order.sourceOrderUrl!)}
                className="mt-4 bg-blue-500/20 rounded-lg p-3 flex-row items-center"
              >
                <ExternalLink size={16} color="#3b82f6" />
                <View className="ml-3 flex-1">
                  <Text className="text-blue-400 font-medium">Source Order</Text>
                  <Text className="text-slate-400 text-sm" numberOfLines={1}>
                    {order.sourceOrderId || order.sourceOrderUrl}
                  </Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Tracking Info */}
            {order.trackingNumber && (
              <TouchableOpacity
                onPress={() => order.trackingUrl && handleOpenSourceUrl(order.trackingUrl)}
                className="mt-4 bg-purple-500/20 rounded-lg p-3 flex-row items-center"
              >
                <Truck size={16} color="#8b5cf6" />
                <View className="ml-3 flex-1">
                  <Text className="text-purple-400 font-medium">Tracking</Text>
                  <Text className="text-white">{order.trackingNumber}</Text>
                </View>
              </TouchableOpacity>
            )}

            {/* Admin Notes */}
            {order.adminNotes && (
              <View className="mt-4 bg-slate-700/50 rounded-lg p-3">
                <Text className="text-slate-400 text-sm">Admin Notes</Text>
                <Text className="text-white mt-1">{order.adminNotes}</Text>
              </View>
            )}

            {/* Update Button */}
            <TouchableOpacity
              onPress={() => handleOpenUpdate(order)}
              className="mt-4 bg-emerald-500 py-3 rounded-xl items-center"
            >
              <Text className="text-white font-bold">Update Order</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
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
          <Text className="text-white text-xl font-bold ml-4">Orders</Text>
        </View>

        {/* Stats */}
        {stats && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-4 mb-4"
          >
            <View className="bg-slate-800 rounded-xl p-3 mr-3 min-w-[80px]">
              <Text className="text-slate-400 text-xs">Total</Text>
              <Text className="text-white font-bold text-lg">{stats.total}</Text>
            </View>
            <View className="bg-yellow-500/20 rounded-xl p-3 mr-3 min-w-[80px]">
              <Text className="text-yellow-400 text-xs">Pending</Text>
              <Text className="text-yellow-400 font-bold text-lg">{stats.pending}</Text>
            </View>
            <View className="bg-emerald-500/20 rounded-xl p-3 mr-3 min-w-[80px]">
              <Text className="text-emerald-400 text-xs">Paid</Text>
              <Text className="text-emerald-400 font-bold text-lg">{stats.paid}</Text>
            </View>
            <View className="bg-blue-500/20 rounded-xl p-3 mr-3 min-w-[80px]">
              <Text className="text-blue-400 text-xs">Processing</Text>
              <Text className="text-blue-400 font-bold text-lg">{stats.processing}</Text>
            </View>
            <View className="bg-purple-500/20 rounded-xl p-3 mr-3 min-w-[80px]">
              <Text className="text-purple-400 text-xs">Shipped</Text>
              <Text className="text-purple-400 font-bold text-lg">{stats.shipped}</Text>
            </View>
            <View className="bg-slate-800 rounded-xl p-3 mr-3 min-w-[100px]">
              <Text className="text-slate-400 text-xs">Today Revenue</Text>
              <Text className="text-emerald-400 font-bold">{formatPrice(stats.todayRevenue)}</Text>
            </View>
          </ScrollView>
        )}

        {/* Search */}
        <View className="px-4 mb-4">
          <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
            <Search size={18} color="#64748b" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search by order # or email..."
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

        {/* Status Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 mb-4"
        >
          <TouchableOpacity
            onPress={() => setFilterStatus('all')}
            className={`mr-2 px-4 py-2 rounded-full ${
              filterStatus === 'all' ? 'bg-emerald-500' : 'bg-slate-800'
            }`}
          >
            <Text className={filterStatus === 'all' ? 'text-white' : 'text-slate-300'}>
              All
            </Text>
          </TouchableOpacity>
          {STATUS_OPTIONS.map((status) => (
            <TouchableOpacity
              key={status}
              onPress={() => setFilterStatus(status)}
              className={`mr-2 px-4 py-2 rounded-full ${
                filterStatus === status ? 'bg-emerald-500' : 'bg-slate-800'
              }`}
            >
              <Text
                className={filterStatus === status ? 'text-white' : 'text-slate-300'}
              >
                {STATUS_CONFIG[status].label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Orders List */}
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
            {orders.length === 0 ? (
              <View className="items-center py-20">
                <ShoppingBag size={60} color="#334155" />
                <Text className="text-slate-400 text-lg mt-4">No orders found</Text>
              </View>
            ) : (
              orders.map(renderOrderCard)
            )}
            <View className="h-8" />
          </ScrollView>
        )}

        {/* Update Modal */}
        <Modal visible={showUpdateModal} animationType="slide" presentationStyle="pageSheet">
          <View className="flex-1 bg-slate-900">
            <SafeAreaView className="flex-1">
              {/* Modal Header */}
              <View className="flex-row items-center justify-between px-4 py-4 border-b border-slate-800">
                <TouchableOpacity onPress={() => setShowUpdateModal(false)}>
                  <X size={24} color="#fff" />
                </TouchableOpacity>
                <Text className="text-white text-lg font-bold">Update Order</Text>
                <TouchableOpacity
                  onPress={handleSaveUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? (
                    <ActivityIndicator color="#10b981" />
                  ) : (
                    <Text className="text-emerald-400 font-bold">Save</Text>
                  )}
                </TouchableOpacity>
              </View>

              <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
                {selectedOrder && (
                  <View className="py-4">
                    <Text className="text-slate-400 text-sm">Order</Text>
                    <Text className="text-white text-lg font-bold">
                      {selectedOrder.orderNumber}
                    </Text>
                  </View>
                )}

                {/* Status */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Status</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {STATUS_OPTIONS.map((status) => (
                      <TouchableOpacity
                        key={status}
                        onPress={() => setUpdateForm({ ...updateForm, status })}
                        className={`mr-2 px-4 py-2 rounded-full ${
                          updateForm.status === status ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <Text
                          className={
                            updateForm.status === status ? 'text-white' : 'text-slate-300'
                          }
                        >
                          {STATUS_CONFIG[status].label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Source Order Info (for processing) */}
                {(updateForm.status === 'processing' || updateForm.status === 'shipped') && (
                  <>
                    <View className="mb-4">
                      <Text className="text-slate-400 text-sm mb-2">
                        Amazon/eBay Order ID
                      </Text>
                      <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                        <ShoppingBag size={18} color="#64748b" />
                        <TextInput
                          value={updateForm.sourceOrderId}
                          onChangeText={(text) =>
                            setUpdateForm({ ...updateForm, sourceOrderId: text })
                          }
                          placeholder="e.g., 123-4567890-1234567"
                          placeholderTextColor="#64748b"
                          className="flex-1 text-white ml-3"
                        />
                      </View>
                    </View>

                    <View className="mb-4">
                      <Text className="text-slate-400 text-sm mb-2">Source Order URL</Text>
                      <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                        <LinkIcon size={18} color="#64748b" />
                        <TextInput
                          value={updateForm.sourceOrderUrl}
                          onChangeText={(text) =>
                            setUpdateForm({ ...updateForm, sourceOrderUrl: text })
                          }
                          placeholder="https://www.amazon.com/..."
                          placeholderTextColor="#64748b"
                          className="flex-1 text-white ml-3"
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Tracking Info (for shipped) */}
                {updateForm.status === 'shipped' && (
                  <>
                    <View className="mb-4">
                      <Text className="text-slate-400 text-sm mb-2">Tracking Number</Text>
                      <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                        <Truck size={18} color="#64748b" />
                        <TextInput
                          value={updateForm.trackingNumber}
                          onChangeText={(text) =>
                            setUpdateForm({ ...updateForm, trackingNumber: text })
                          }
                          placeholder="Enter tracking number"
                          placeholderTextColor="#64748b"
                          className="flex-1 text-white ml-3"
                        />
                      </View>
                    </View>

                    <View className="mb-4">
                      <Text className="text-slate-400 text-sm mb-2">Tracking URL</Text>
                      <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                        <ExternalLink size={18} color="#64748b" />
                        <TextInput
                          value={updateForm.trackingUrl}
                          onChangeText={(text) =>
                            setUpdateForm({ ...updateForm, trackingUrl: text })
                          }
                          placeholder="https://track..."
                          placeholderTextColor="#64748b"
                          className="flex-1 text-white ml-3"
                        />
                      </View>
                    </View>

                    <View className="mb-4">
                      <Text className="text-slate-400 text-sm mb-2">
                        Estimated Delivery Date
                      </Text>
                      <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-center">
                        <Calendar size={18} color="#64748b" />
                        <TextInput
                          value={updateForm.estimatedDelivery}
                          onChangeText={(text) =>
                            setUpdateForm({ ...updateForm, estimatedDelivery: text })
                          }
                          placeholder="e.g., 2024-12-25"
                          placeholderTextColor="#64748b"
                          className="flex-1 text-white ml-3"
                        />
                      </View>
                    </View>
                  </>
                )}

                {/* Cancellation Reason */}
                {updateForm.status === 'cancelled' && (
                  <View className="mb-4">
                    <Text className="text-slate-400 text-sm mb-2">Cancellation Reason</Text>
                    <TextInput
                      value={updateForm.cancellationReason}
                      onChangeText={(text) =>
                        setUpdateForm({ ...updateForm, cancellationReason: text })
                      }
                      placeholder="Reason for cancellation..."
                      placeholderTextColor="#64748b"
                      multiline
                      numberOfLines={3}
                      className="bg-slate-800 text-white px-4 py-3 rounded-xl"
                      style={{ textAlignVertical: 'top' }}
                    />
                  </View>
                )}

                {/* Admin Notes */}
                <View className="mb-4">
                  <Text className="text-slate-400 text-sm mb-2">Admin Notes</Text>
                  <View className="bg-slate-800 rounded-xl px-4 py-3 flex-row items-start">
                    <FileText size={18} color="#64748b" style={{ marginTop: 4 }} />
                    <TextInput
                      value={updateForm.adminNotes}
                      onChangeText={(text) =>
                        setUpdateForm({ ...updateForm, adminNotes: text })
                      }
                      placeholder="Internal notes..."
                      placeholderTextColor="#64748b"
                      multiline
                      numberOfLines={4}
                      className="flex-1 text-white ml-3"
                      style={{ textAlignVertical: 'top' }}
                    />
                  </View>
                </View>

                <View className="h-32" />
              </ScrollView>
            </SafeAreaView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}
