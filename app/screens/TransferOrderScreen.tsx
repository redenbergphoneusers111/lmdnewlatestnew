import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import {
  ArrowLeft,
  ArrowRightLeft,
  ChevronDown,
  Search,
  Trash2,
  CheckSquare,
  Square,
  QrCode,
} from "lucide-react-native";
import { useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";

import TransferOrderItem from "../components/ui/TransferOrderItem";
import VehicleSelectionModal from "../components/ui/VehicleSelectionModal";
import { apiService, TransferOrder, Vehicle } from "../services/apiService";
import { StorageManager } from "../utils/storage";

interface TransferOrderScreenProps {
  onBack?: () => void;
}

const TransferOrderScreen: React.FC<TransferOrderScreenProps> = ({
  onBack,
}) => {
  const router = useRouter();

  // State management
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [allOrders, setAllOrders] = useState<TransferOrder[]>([]);
  const [displayedOrders, setDisplayedOrders] = useState<TransferOrder[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<TransferOrder[]>([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState<Set<number>>(
    new Set()
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState("");

  // Vehicle selection
  const [fromVehicle, setFromVehicle] = useState<Vehicle | null>(null);
  const [toVehicle, setToVehicle] = useState<Vehicle | null>(null);
  const [showVehicleModal, setShowVehicleModal] = useState(false);

  // UI state
  const [selectAll, setSelectAll] = useState(false);

  // Load initial data
  useFocusEffect(
    useCallback(() => {
      loadInitialData();
    }, [])
  );

  const loadInitialData = async () => {
    setLoading(true);
    try {
      // Get current vehicle from storage
      const currentVehicle = await StorageManager.getSelectedVehicle();
      if (currentVehicle) {
        setFromVehicle(currentVehicle);
        await loadOrders(currentVehicle.id);
      } else {
        Alert.alert(
          "Error",
          "No vehicle selected. Please select a vehicle first."
        );
        onBack?.();
      }
    } catch (error) {
      console.error("Error loading initial data:", error);
      Alert.alert("Error", "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async (vehicleId: number) => {
    try {
      setLoading(true);
      const response = await apiService.getDeliveryOrdersByVehicle(vehicleId);
      if (response.success && response.data) {
        setAllOrders(response.data);
        setDisplayedOrders([]); // Don't show any items initially
      } else {
        Alert.alert("Error", "Failed to load orders");
      }
    } catch (error) {
      console.error("Error loading orders:", error);
      Alert.alert("Error", "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const searchOrders = (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setDisplayedOrders([]); // Don't show any items when search is empty
      return;
    }

    const filtered = allOrders.filter(
      (order) =>
        order.docNum.toLowerCase().includes(query.toLowerCase()) ||
        order.doStr.toLowerCase().includes(query.toLowerCase()) ||
        order.cardName.toLowerCase().includes(query.toLowerCase()) ||
        order.cardCode.toLowerCase().includes(query.toLowerCase())
    );
    setDisplayedOrders(filtered);
  };

  const addOrderToTransfer = (order: TransferOrder) => {
    const isAlreadyAdded = selectedOrderIds.has(order.id);
    if (isAlreadyAdded) {
      Alert.alert("Info", "Order is already added to transfer list");
      return;
    }

    setSelectedOrders((prev) => [...prev, order]);
    setSelectedOrderIds((prev) => new Set([...prev, order.id]));
  };

  const removeOrderFromTransfer = (orderId: number) => {
    setSelectedOrders((prev) => prev.filter((order) => order.id !== orderId));
    setSelectedOrderIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(orderId);
      return newSet;
    });
  };

  const toggleOrderSelection = (order: TransferOrder) => {
    if (selectedOrderIds.has(order.id)) {
      removeOrderFromTransfer(order.id);
    } else {
      addOrderToTransfer(order);
    }
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedOrders([]);
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrders([...displayedOrders]);
      setSelectedOrderIds(new Set(displayedOrders.map((order) => order.id)));
    }
    setSelectAll(!selectAll);
  };

  const removeSelectedOrders = () => {
    // Remove selected items from both displayed orders and selected orders
    const selectedIds = Array.from(selectedOrderIds);
    setDisplayedOrders((prev) =>
      prev.filter((order) => !selectedIds.includes(order.id))
    );
    setAllOrders((prev) =>
      prev.filter((order) => !selectedIds.includes(order.id))
    );
    setSelectedOrders([]);
    setSelectedOrderIds(new Set());
    setSelectAll(false);
  };

  const handleVehicleSelection = (vehicle: Vehicle) => {
    setToVehicle(vehicle);
  };

  const validateTransfer = () => {
    if (!toVehicle) {
      Alert.alert("Validation Error", "Please select a destination vehicle");
      return false;
    }
    if (selectedOrders.length === 0) {
      Alert.alert(
        "Validation Error",
        "Please select at least one order to transfer"
      );
      return false;
    }
    if (!reason.trim()) {
      Alert.alert(
        "Validation Error",
        "Please provide a reason for the transfer"
      );
      return false;
    }
    return true;
  };

  const executeTransfer = async () => {
    if (!validateTransfer()) return;

    setTransferring(true);
    try {
      const userId = await StorageManager.getId();
      const orderIds = selectedOrders.map((order) => order.id).join(",");

      const response = await apiService.transferOrders(
        orderIds,
        userId,
        toVehicle!.id.toString(),
        fromVehicle!.id.toString()
      );

      if (response.success) {
        Alert.alert("Success", "Orders transferred successfully!", [
          {
            text: "OK",
            onPress: () => {
              // Clear selections and reload data
              setSelectedOrders([]);
              setSelectedOrderIds(new Set());
              setSelectAll(false);
              setToVehicle(null);
              setReason("");
              loadOrders(fromVehicle!.id);
            },
          },
        ]);
      } else {
        Alert.alert("Error", response.error || "Failed to transfer orders");
      }
    } catch (error) {
      console.error("Error transferring orders:", error);
      Alert.alert("Error", "Failed to transfer orders. Please try again.");
    } finally {
      setTransferring(false);
    }
  };

  const renderOrderItem = ({ item }: { item: TransferOrder }) => (
    <TransferOrderItem
      order={item}
      isSelected={selectedOrderIds.has(item.id)}
      onToggleSelection={() => toggleOrderSelection(item)}
      onLongPress={() => toggleOrderSelection(item)}
    />
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LinearGradient colors={["#6C63FF", "#5b54d9"]} className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-6 pt-0 pb-4 -mt-2">
          <TouchableOpacity
            onPress={() => onBack?.()}
            className="w-10 h-10 rounded-full bg-white/20 items-center justify-center"
          >
            <ArrowLeft size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="text-white font-nunito font-bold text-lg">
            Transfer Order
          </Text>
          <View className="w-10" />
        </View>

        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Transfer Details Section */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(100)}
            className="px-6 mb-6"
          >
            <View className="bg-white rounded-2xl p-6 shadow-lg">
              <Text className="text-gray-800 font-nunito font-bold text-lg mb-4">
                Transfer Details
              </Text>

              {/* FROM Vehicle */}
              <View className="mb-4">
                <Text className="text-gray-600 font-nunito font-semibold text-sm mb-2">
                  FROM
                </Text>
                <View className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <Text className="text-gray-800 font-nunito font-semibold">
                    {fromVehicle
                      ? `${fromVehicle.vehicleNo} - ${fromVehicle.vehicleModel}`
                      : "Loading..."}
                  </Text>
                  {fromVehicle && (
                    <Text className="text-gray-500 font-nunito text-sm mt-1">
                      Driver: {fromVehicle.driverName}
                    </Text>
                  )}
                </View>
              </View>

              {/* TO Vehicle */}
              <View className="mb-4">
                <Text className="text-gray-600 font-nunito font-semibold text-sm mb-2">
                  TO
                </Text>
                <TouchableOpacity
                  onPress={() => setShowVehicleModal(true)}
                  className="bg-white rounded-xl p-4 border border-gray-200 flex-row items-center justify-between"
                >
                  <Text
                    className={`font-nunito font-semibold ${
                      toVehicle ? "text-gray-800" : "text-gray-400"
                    }`}
                  >
                    {toVehicle
                      ? `${toVehicle.vehicleNo} - ${toVehicle.vehicleModel}`
                      : "SELECT VEHICLE"}
                  </Text>
                  <ChevronDown size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>

              {/* Reason */}
              <View>
                <Text className="text-gray-600 font-nunito font-semibold text-sm mb-2">
                  Reason
                </Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Enter reason for transfer"
                  className="bg-white rounded-xl p-4 border border-gray-200 text-gray-800 font-nunito"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </Animated.View>

          {/* Order Selection Section */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(200)}
            className="px-6 mb-6"
          >
            <View className="bg-white rounded-2xl p-6 shadow-lg">
              <Text className="text-gray-800 font-nunito font-bold text-lg mb-4">
                Search and select orders to transfer
              </Text>

              {/* Search Bar */}
              <View className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-4">
                <TouchableOpacity className="mr-3">
                  <QrCode size={20} color="#8B5CF6" />
                </TouchableOpacity>
                <TextInput
                  value={searchQuery}
                  onChangeText={searchOrders}
                  placeholder="Search"
                  className="flex-1 text-gray-800 font-nunito"
                />
                <TouchableOpacity
                  onPress={() => {
                    searchOrders(searchQuery);
                    setSearchQuery(""); // Clear the search field after search
                  }}
                >
                  <Search size={20} color="#8B5CF6" />
                </TouchableOpacity>
              </View>

              {/* Action Bar */}
              <View className="flex-row items-center justify-between mb-4">
                <TouchableOpacity
                  onPress={toggleSelectAll}
                  className="flex-row items-center"
                >
                  {selectAll ? (
                    <CheckSquare size={20} color="#EF4444" />
                  ) : (
                    <Square size={20} color="#EF4444" />
                  )}
                  <Text className="text-red-500 font-nunito font-semibold ml-2">
                    Select All
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={removeSelectedOrders}
                  className="w-10 h-10 bg-red-500 rounded-full items-center justify-center"
                >
                  <Trash2 size={16} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Orders List */}
              {loading ? (
                <View className="py-8 items-center">
                  <ActivityIndicator size="large" color="#8B5CF6" />
                  <Text className="text-gray-500 font-nunito mt-2">
                    Loading orders...
                  </Text>
                </View>
              ) : displayedOrders.length === 0 ? (
                <View className="py-8 items-center">
                  <Search size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 font-nunito mt-2 text-center">
                    {searchQuery
                      ? "No orders found"
                      : "Search for orders to transfer"}
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={displayedOrders}
                  renderItem={renderOrderItem}
                  keyExtractor={(item, index) =>
                    `${item.id}-${item.docNum}-${index}`
                  }
                  showsVerticalScrollIndicator={false}
                  scrollEnabled={false}
                />
              )}
            </View>
          </Animated.View>

          {/* Transfer Button */}
          <Animated.View
            entering={FadeInUp.duration(600).delay(300)}
            className="px-6 pb-8"
          >
            <TouchableOpacity
              onPress={executeTransfer}
              disabled={transferring || selectedOrders.length === 0}
              className={`rounded-2xl p-4 items-center ${
                transferring || selectedOrders.length === 0
                  ? "bg-gray-300"
                  : "bg-red-500"
              }`}
            >
              {transferring ? (
                <View className="flex-row items-center">
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text className="text-white font-nunito font-bold text-lg ml-2">
                    Transferring...
                  </Text>
                </View>
              ) : (
                <Text className="text-white font-nunito font-bold text-lg">
                  Transfer Order
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </ScrollView>

        {/* Vehicle Selection Modal */}
        <VehicleSelectionModal
          visible={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          onSelectVehicle={handleVehicleSelection}
          currentVehicleId={fromVehicle?.id}
        />
      </LinearGradient>
    </KeyboardAvoidingView>
  );
};

export default TransferOrderScreen;
