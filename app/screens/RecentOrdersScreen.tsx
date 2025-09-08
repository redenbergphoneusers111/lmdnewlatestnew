import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  SlideInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  Filter,
  ChevronRight,
  Calendar,
  User,
  Phone,
  MapPin,
  CreditCard,
  Package,
  ClipboardList,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  MapPin as LocationIcon,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";

interface FilterStatus {
  status: string;
  ar_Status: string;
  definisionType: string;
  ar_DefinisionType: string;
}

interface RecentOrder {
  id: number;
  doStr: string;
  doDate: string;
  docNum: string;
  cardName: string;
  status: string;
  ar_Status: string;
  menuName: string;
  ar_MenuName: string;
  isSelected: boolean;
  isCancelled: boolean;
  isForceClosed: boolean;
  isActive: boolean;
  bpfName: string;
  docDate: string;
  isPrint: boolean;
  articleNo: string;
  channelInvoice: string;
  mobileNo: string;
  contactNumber: string;
  customerReference: string;
  paymentType: string;
  amount: number;
  vehicleNo: string;
}

interface AssignedTask {
  id: number;
  isAttachment: boolean;
  taskName: string;
  taskId: number;
  description: string;
  postingDate: string;
  dueDate: string;
  remarks: string;
  cardCode: string;
  docType: string;
  creditMemoNum: string;
  driverId: number;
  isCancelled: boolean;
  isActive: boolean;
  iscompleted: boolean;
  driverName: string;
}

type OrderType = "Delivery Order" | "Pickup Order" | "Tasks";

interface RecentOrdersScreenProps {
  initialOrderType?: OrderType;
  initialStatus?: string;
}

const RecentOrdersScreen: React.FC<RecentOrdersScreenProps> = ({
  initialOrderType = "Delivery Order",
  initialStatus = "ALL",
}) => {
  const { selectedVehicle } = useAuth();
  const [selectedOrderType, setSelectedOrderType] =
    useState<OrderType>(initialOrderType);
  const [selectedStatus, setSelectedStatus] = useState<string>(initialStatus);
  const [filterStatuses, setFilterStatuses] = useState<FilterStatus[]>([]);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [assignedTasks, setAssignedTasks] = useState<AssignedTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(initialStatus !== "ALL");

  const today = new Date().toISOString().split("T")[0];

  // Handle initial parameters
  useEffect(() => {
    if (initialOrderType && initialOrderType !== selectedOrderType) {
      setSelectedOrderType(initialOrderType);
    }
    if (initialStatus && initialStatus !== selectedStatus) {
      setSelectedStatus(initialStatus);
    }
  }, [initialOrderType, initialStatus]);

  // Load filter statuses based on selected order type
  useEffect(() => {
    loadFilterStatuses();
  }, [selectedOrderType]);

  // Load recent orders when filters change
  useEffect(() => {
    if (selectedVehicle) {
      loadRecentOrders();
    }
  }, [selectedOrderType, selectedStatus, selectedVehicle]);

  const loadFilterStatuses = async () => {
    try {
      setLoading(true);
      let endpoint = "";

      if (selectedOrderType === "Delivery Order") {
        endpoint = "/api/FilterStatus?DefinisionType=Delivery%20Order";
      } else if (selectedOrderType === "Pickup Order") {
        endpoint = "/api/FilterStatus?DefinisionType=Pickup%20Order";
      } else if (selectedOrderType === "Tasks") {
        // Tasks have 3 statuses based on API endpoints
        setFilterStatuses([
          {
            status: "ALL",
            ar_Status: "الجميع",
            definisionType: "Tasks",
            ar_DefinisionType: "مهام",
          },
          {
            status: "PENDING",
            ar_Status: "ريثما",
            definisionType: "Tasks",
            ar_DefinisionType: "مهام",
          },
          {
            status: "Completed",
            ar_Status: "منجز",
            definisionType: "Tasks",
            ar_DefinisionType: "مهام",
          },
        ]);
        return;
      }

      const response = await apiService.makeRequest(endpoint);
      if (response.success && response.data) {
        setFilterStatuses(response.data as FilterStatus[]);
      } else {
        setFilterStatuses([]);
      }
    } catch (error) {
      console.error("Error loading filter statuses:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadRecentOrders = async () => {
    if (!selectedVehicle) return;

    try {
      setLoading(true);

      if (selectedOrderType === "Tasks") {
        // Use the AssignedTask API endpoint for Tasks
        let endpoint = `/api/AssignedTask?vehicleId=${selectedVehicle.id}&taskId=&status=`;

        // Add status filter if not ALL
        if (selectedStatus !== "ALL") {
          endpoint += selectedStatus;
        }

        const response = await apiService.makeRequest(endpoint);
        if (response.success && response.data) {
          setAssignedTasks(response.data as AssignedTask[]);
          setRecentOrders([]); // Clear recent orders when showing tasks
        } else {
          setAssignedTasks([]);
          setRecentOrders([]);
        }
      } else {
        // Use the RecentOrders API for Delivery and Pickup Orders
        let endpoint = "";
        if (selectedOrderType === "Delivery Order") {
          endpoint = `/api/RecentOrders?cdate=${today}&vehicleId=${selectedVehicle.id}&status=${selectedStatus}&menuType=Delivery%20Order`;
        } else if (selectedOrderType === "Pickup Order") {
          endpoint = `/api/RecentOrders?cdate=${today}&vehicleId=${selectedVehicle.id}&status=${selectedStatus}&menuType=Pickup%20Order`;
        }

        const response = await apiService.makeRequest(endpoint);
        if (response.success && response.data) {
          setRecentOrders(response.data as RecentOrder[]);
          setAssignedTasks([]); // Clear tasks when showing orders
        } else {
          setRecentOrders([]);
          setAssignedTasks([]);
        }
      }
    } catch (error) {
      console.error("Error loading recent orders:", error);
      setRecentOrders([]);
      setAssignedTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadRecentOrders();
  };

  const getStatusColor = (status: string, isCompleted?: boolean) => {
    // Handle task completion status
    if (isCompleted !== undefined) {
      return isCompleted ? "#10b981" : "#f59e0b"; // Green for completed, Yellow for pending
    }

    // Handle order status
    switch (status) {
      case "COMPLETED":
      case "CLOSED":
      case "Completed":
        return "#10b981"; // Green
      case "PENDING":
        return "#f59e0b"; // Yellow
      case "CANCELLED":
        return "#ef4444"; // Red
      case "PICKED":
        return "#3b82f6"; // Blue
      case "DISPATCHED":
        return "#8b5cf6"; // Purple
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStatusIcon = (status: string, isCompleted?: boolean) => {
    // Handle task completion status
    if (isCompleted !== undefined) {
      return isCompleted ? CheckCircle2 : Clock;
    }

    // Handle order status
    switch (status) {
      case "COMPLETED":
      case "CLOSED":
      case "Completed":
        return CheckCircle2;
      case "PENDING":
        return Clock;
      case "CANCELLED":
        return XCircle;
      case "PICKED":
        return Package;
      case "DISPATCHED":
        return Truck;
      default:
        return ClipboardList;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return amount ? `$${amount.toFixed(2)}` : "N/A";
  };

  const renderTaskItem = ({
    item,
    index,
  }: {
    item: AssignedTask;
    index: number;
  }) => {
    const StatusIcon = getStatusIcon("", item.iscompleted);
    const statusColor = getStatusColor("", item.iscompleted);
    const statusText = item.iscompleted ? "Completed" : "PENDING";

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        className="bg-white rounded-lg p-4 mb-3 shadow-lg border-0 mx-2"
        style={{
          shadowColor: statusColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Horizontal Layout with Icon, Content, and Status */}
        <View className="flex-row items-center">
          {/* Enhanced Colored Icon Container */}
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mr-4"
            style={{
              backgroundColor: statusColor,
              borderWidth: 2,
              borderColor: statusColor + "40",
            }}
          >
            <StatusIcon size={28} color="white" />
          </View>

          {/* Content Section with Colorful Elements */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-900 font-bold text-lg">
                {item.taskName}
              </Text>
              <Text className="text-blue-600 font-bold px-2 text-sm">
                #{item.taskId}
              </Text>
            </View>
            <Text className="text-amber-600 font-medium text-sm mb-2">
              📅 {formatDate(item.dueDate)}
            </Text>
            <Text className="text-indigo-600 font-medium text-sm">
              📝 {item.description || "No description"}
            </Text>
            {item.remarks && (
              <Text className="text-gray-600 font-medium text-xs mt-1">
                💬 {item.remarks}
              </Text>
            )}
          </View>

          {/* Enhanced Status Badge */}
          <View className="items-end justify-end">
            <View
              className="px-3 py-1 rounded-full mb-2"
              style={{
                backgroundColor: statusColor + "25",
                borderWidth: 1,
                borderColor: statusColor + "50",
              }}
            >
              <Text
                style={{ color: statusColor }}
                className="font-medium text-xs"
              >
                {statusText}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderOrderItem = ({
    item,
    index,
  }: {
    item: RecentOrder;
    index: number;
  }) => {
    const StatusIcon = getStatusIcon(item.status);
    const statusColor = getStatusColor(item.status);

    return (
      <Animated.View
        entering={FadeInDown.delay(index * 100).duration(400)}
        className="bg-white rounded-lg p-4 mb-3 shadow-lg border-0 mx-2"
        style={{
          shadowColor: statusColor,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Horizontal Layout with Icon, Content, and Status */}
        <View className="flex-row items-center">
          {/* Enhanced Colored Icon Container */}
          <View
            className="w-14 h-14 rounded-xl items-center justify-center mr-4"
            style={{
              backgroundColor: statusColor,
              borderWidth: 2,
              borderColor: statusColor + "40",
            }}
          >
            <StatusIcon size={28} color="white" />
          </View>

          {/* Content Section with Colorful Elements */}
          <View className="flex-1">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-900 font-bold text-lg">
                {item.cardName} - {item.doStr}
              </Text>
            </View>
            <Text className="text-amber-600 font-medium text-sm mb-2">
              📅 {formatDate(item.docDate)}
            </Text>
            <Text className="text-indigo-600 font-medium text-sm">
              📍 {item.bpfName || "Location not specified"}
            </Text>
          </View>

          {/* Enhanced Status Badge */}
          <View className="items-end justify-end">
            <View
              className="px-3 py-1 rounded-full mb-2"
              style={{
                backgroundColor: statusColor + "25",
                borderWidth: 1,
                borderColor: statusColor + "50",
              }}
            >
              <Text
                style={{ color: statusColor }}
                className="font-medium text-xs"
              >
                {item.status}
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(600)}
        className="bg-white px-4 pb-3 border-b border-gray-100"
      >
        <Text className="text-gray-900 font-semibold text-base mb-1">
          Recent Orders
        </Text>
        <Text className="text-gray-500 text-xs">
          Track your delivery history
        </Text>
      </Animated.View>

      {/* Order Type Tabs */}
      <Animated.View
        entering={SlideInDown.delay(200).duration(500)}
        className="bg-white px-4 py-2 border-b border-gray-100"
      >
        <View className="flex-row space-x-2">
          {(["Delivery Order", "Pickup Order", "Tasks"] as OrderType[]).map(
            (type) => (
              <Pressable
                key={type}
                onPress={() => {
                  setSelectedOrderType(type);
                  setSelectedStatus("ALL");
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                className={`px-3 py-2 rounded-lg ${
                  selectedOrderType === type
                    ? "bg-purple-100 border border-purple-200"
                    : "bg-gray-50"
                }`}
              >
                <Text
                  className={`text-sm font-medium ${
                    selectedOrderType === type
                      ? "text-purple-700"
                      : "text-gray-600"
                  }`}
                >
                  {type}
                </Text>
              </Pressable>
            )
          )}
        </View>
      </Animated.View>

      {/* Content */}
      <View className="flex-1 bg-gray-50">
        <Animated.View
          entering={FadeInUp.delay(400).duration(600)}
          className="px-4 pt-2"
        >
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 font-medium text-sm">
              {selectedOrderType === "Tasks"
                ? `${assignedTasks.length} Tasks Found`
                : `${recentOrders.length} Orders Found`}
            </Text>
            <Pressable
              onPress={() => setShowFilters(!showFilters)}
              className="bg-white p-2 rounded-lg shadow-sm border border-gray-200"
            >
              <Filter size={16} color="#6b7280" />
            </Pressable>
          </View>
        </Animated.View>

        {/* Filter Options */}
        {showFilters && (
          <Animated.View
            entering={FadeInUp.duration(300)}
            className="px-4 mb-3"
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: 16 }}
            >
              {filterStatuses.map((filter) => (
                <Pressable
                  key={filter.status}
                  onPress={() => {
                    setSelectedStatus(filter.status);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`mr-2 px-3 py-2 rounded-lg border ${
                    selectedStatus === filter.status
                      ? "bg-purple-600 border-purple-600"
                      : "bg-white border-gray-200"
                  }`}
                >
                  <Text
                    className={`font-medium text-sm ${
                      selectedStatus === filter.status
                        ? "text-white"
                        : "text-gray-700"
                    }`}
                  >
                    {filter.status}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            {/* Show current filter info */}
            <View className="mt-2 px-2 py-1 bg-purple-50 rounded-lg">
              <Text className="text-purple-700 text-xs text-center">
                Filtering by: {selectedStatus}
              </Text>
            </View>
          </Animated.View>
        )}

        {loading ? (
          <Animated.View
            entering={FadeIn.duration(400)}
            className="flex-1 items-center justify-center"
          >
            <ActivityIndicator size="large" color="#7c3aed" />
          </Animated.View>
        ) : selectedOrderType === "Tasks" ? (
          assignedTasks.length > 0 ? (
            <FlatList
              data={assignedTasks}
              renderItem={renderTaskItem}
              keyExtractor={(item) => item.id.toString()}
              contentContainerStyle={{
                paddingHorizontal: 8,
                paddingBottom: 20,
                paddingTop: 8,
              }}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                />
              }
            />
          ) : (
            <Animated.View
              entering={FadeInUp.delay(600).duration(500)}
              className="flex-1 items-center justify-center px-4"
            >
              <Package size={48} color="#9ca3af" />
              <Text className="text-gray-500 font-medium text-base mt-3 text-center">
                No tasks found
              </Text>
              <Text className="text-gray-400 text-xs mt-1 text-center">
                Try adjusting your filters or check back later
              </Text>
            </Animated.View>
          )
        ) : recentOrders.length > 0 ? (
          <FlatList
            data={recentOrders}
            renderItem={renderOrderItem}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={{
              paddingHorizontal: 8,
              paddingBottom: 20,
              paddingTop: 8,
            }}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
              />
            }
          />
        ) : (
          <Animated.View
            entering={FadeInUp.delay(600).duration(500)}
            className="flex-1 items-center justify-center px-4"
          >
            <Package size={48} color="#9ca3af" />
            <Text className="text-gray-500 font-medium text-base mt-3 text-center">
              No orders found
            </Text>
            <Text className="text-gray-400 text-xs mt-1 text-center">
              Try adjusting your filters or check back later
            </Text>
          </Animated.View>
        )}
      </View>
    </SafeAreaView>
  );
};

export default RecentOrdersScreen;
