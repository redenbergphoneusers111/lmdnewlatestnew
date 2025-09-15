import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  FadeInUp,
  FadeInDown,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ShimmerCard,
  ShimmerProgressCard,
  ShimmerRecentItem,
} from "../components/ui/ShimmerEffect";
import {
  Truck,
  Send,
  ClipboardCheck,
  XCircle,
  CheckCircle2,
  PackagePlus,
  ClipboardList,
  ShoppingCart,
  Users,
  FileText,
  Boxes,
  TrendingUp,
  Calendar,
} from "lucide-react-native";

import AnimatedHeader from "../components/ui/AnimatedHeader";
import StatusCard from "../components/ui/StatusCard";
import DeliveryItem from "../components/ui/DeliveryItem";
import ProgressChipCard from "../components/ui/ProgressChipCard";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";

interface DeliveryData {
  id: string;
  name: string;
  amount: string;
  status: "delivered" | "cancelled" | "pending";
  note?: string;
}

const deliveryData: DeliveryData[] = [];
const statusData = [] as any[];

const HorizontalSection: React.FC<{
  title: string;
  children: React.ReactNode;
  loading?: boolean;
}> = ({ title, children, loading = false }) => (
  <Animated.View entering={FadeInUp.duration(500)} className="mb-6">
    <View className="px-6 mb-4">
      <Text className="text-white/90 font-medium text-sm uppercase tracking-wider">
        {title}
      </Text>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      {loading ? (
        <View className="flex-row">
          <ShimmerProgressCard />
          <ShimmerProgressCard />
          <ShimmerProgressCard />
        </View>
      ) : (
        <View className="flex-row">{children}</View>
      )}
    </ScrollView>
  </Animated.View>
);

const StatsCard: React.FC<{
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ComponentType<any>;
  color: string;
}> = ({ title, value, subtitle, icon: Icon, color }) => (
  <View className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 mr-3 min-w-[140px]">
    <View className="flex-row items-center justify-between mb-3">
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: color + "20" }}
      >
        <Icon size={20} color={color} />
      </View>
      <View className="items-end">
        <Text className="text-white font-bold text-lg">{value}</Text>
        {subtitle && <Text className="text-white/70 text-xs">{subtitle}</Text>}
      </View>
    </View>
    <Text className="text-white/80 font-medium text-sm">{title}</Text>
  </View>
);

interface HomeScreenProps {
  tabsRef?: any;
  navigateToDeliveryStage?: (orderData: any, currentStage: any) => void;
  navigateToPickupStage?: (orderData: any, currentStage: any) => void;
  navigateToTaskStage?: (taskData: any, currentStage: any) => void;
}

const HomeScreen: React.FC<HomeScreenProps> = ({
  tabsRef,
  navigateToDeliveryStage,
  navigateToPickupStage,
  navigateToTaskStage,
}) => {
  const { selectedVehicle, userDetails } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statistics, setStatistics] = useState<any | null>(null);

  const headerOpacity = useSharedValue(0);
  const cardsOpacity = useSharedValue(0);
  const todayLabel = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    cardsOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const animatedCardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: withSpring(cardsOpacity.value === 1 ? 0 : 50) }],
  }));

  const userRole = useMemo(() => {
    return userDetails && userDetails.length > 0
      ? userDetails[0].roleName || "admin"
      : "admin";
  }, [userDetails]);

  const fetchStatistics = async () => {
    if (!selectedVehicle) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getStatistics(selectedVehicle.id, userRole);
      if (res.success) {
        setStatistics(res.data);
      } else {
        setError(res.error || "Failed to load statistics");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load statistics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicle, userRole]);

  // Calculate summary stats
  const totalDeliveries = useMemo(() => {
    if (!statistics?.statisticsDOs) return 0;
    return statistics.statisticsDOs.reduce(
      (sum: number, item: any) => sum + (Number(item.counts) || 0),
      0
    );
  }, [statistics]);

  const totalPickups = useMemo(() => {
    if (!statistics?.statisticsPRs) return 0;
    return statistics.statisticsPRs.reduce(
      (sum: number, item: any) => sum + (Number(item.counts) || 0),
      0
    );
  }, [statistics]);

  const totalTasks = useMemo(() => {
    if (!statistics?.statisticstasks) return 0;
    return statistics.statisticstasks.reduce(
      (sum: number, item: any) => sum + (Number(item.counts) || 0),
      0
    );
  }, [statistics]);

  return (
    <View className="flex-1">
      <LinearGradient
        colors={["#6366f1", "#4f46e5", "#3730a3"]}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchStatistics();
              }}
            />
          }
        >
          {/* Header Section */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(600)}
            className="px-6 mb-6 mt-12"
          >
            <View className="flex-row items-center justify-between mb-2">
              <View>
                <Text className="text-white font-semibold text-2xl">
                  Dashboard
                </Text>
                <Text className="text-white/70 text-sm mt-1">{todayLabel}</Text>
              </View>
              <View className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
                <TrendingUp size={20} color="white" />
              </View>
            </View>
          </Animated.View>

          {/* Summary Stats Cards */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            className="mb-8"
          >
            {loading ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                <ShimmerCard height={100} />
                <ShimmerCard height={100} />
                <ShimmerCard height={100} />
              </ScrollView>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}
              >
                <StatsCard
                  title="Total Deliveries"
                  value={totalDeliveries.toString()}
                  subtitle="Today"
                  icon={Truck}
                  color="#10b981"
                />
                <StatsCard
                  title="Pickup Orders"
                  value={totalPickups.toString()}
                  subtitle="Today"
                  icon={PackagePlus}
                  color="#3b82f6"
                />
                <StatsCard
                  title="Active Tasks"
                  value={totalTasks.toString()}
                  subtitle="Pending"
                  icon={ClipboardList}
                  color="#f59e0b"
                />
              </ScrollView>
            )}
          </Animated.View>

          {/* Delivery Orders Section */}
          <HorizontalSection title="Delivery Orders" loading={loading}>
            {(statistics?.statisticsDOs || []).map((s: any, index: number) => {
              const icon =
                s.category === "Picking"
                  ? Truck
                  : s.category === "Dispatching"
                  ? Send
                  : s.category === "Confirmation"
                  ? ClipboardCheck
                  : s.category === "Cancelled"
                  ? XCircle
                  : CheckCircle2;
              const color =
                s.category === "Picking"
                  ? "#3b82f6" // Blue
                  : s.category === "Dispatching"
                  ? "#8b5cf6" // Purple
                  : s.category === "Confirmation"
                  ? "#10b981" // Green
                  : s.category === "Cancelled"
                  ? "#ef4444" // Red
                  : "#059669"; // Dark Green
              return (
                <ProgressChipCard
                  key={`do-${index}`}
                  title={s.category}
                  subtitle={`${s.counts}`}
                  icon={icon}
                  color={color}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    // Navigate to RecentOrdersScreen with Delivery Order type and specific status
                    if (tabsRef) {
                      // Map category to correct status
                      let status = "ALL";
                      switch (s.category) {
                        case "Picking":
                          status = "OPEN";
                          break;
                        case "Dispatching":
                          status = "PICKED";
                          break;
                        case "Confirmation":
                          status = "DISPATCHED";
                          break;
                        case "Cancelled":
                          status = "CANCELLED";
                          break;
                        case "Completed":
                          status = "COMPLETED";
                          break;
                        default:
                          status = s.category.toUpperCase();
                      }

                      tabsRef.selectTab("recent order", {
                        initialOrderType: "Delivery Order",
                        initialStatus: status,
                      });
                    }
                  }}
                />
              );
            })}
          </HorizontalSection>

          {/* Pickup Orders Section */}
          <HorizontalSection title="Pickup Orders" loading={loading}>
            {(statistics?.statisticsPRs || []).map((s: any, index: number) => {
              const icon =
                s.category === "Pickup Order"
                  ? PackagePlus
                  : s.category === "Return Confirmation"
                  ? ClipboardCheck
                  : s.category === "Cancelled"
                  ? XCircle
                  : CheckCircle2;
              const color =
                s.category === "Pickup Order"
                  ? "#f59e0b" // Orange
                  : s.category === "Return Confirmation"
                  ? "#10b981" // Green
                  : s.category === "Cancelled"
                  ? "#ef4444" // Red
                  : "#059669"; // Dark Green
              return (
                <ProgressChipCard
                  key={`pr-${index}`}
                  title={s.category}
                  subtitle={`${s.counts}`}
                  icon={icon}
                  color={color}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (tabsRef) {
                      // Map pickup order menu categories to correct filter statuses
                      let status = "ALL";
                      switch (s.category) {
                        case "Pickup Order":
                          status = "OPEN";
                          break;
                        case "Return Confirmation":
                          status = "REQUESTED";
                          break;
                        case "Completed":
                          status = "CLOSED";
                          break;
                        case "Cancelled":
                          status = "CANCELLED";
                          break;
                        default:
                          status = s.category.toUpperCase();
                      }

                      tabsRef.selectTab("recent order", {
                        initialOrderType: "Pickup Order",
                        initialStatus: status,
                      });
                    }
                  }}
                />
              );
            })}
          </HorizontalSection>

          {/* Tasks Section */}
          <HorizontalSection title="Tasks" loading={loading}>
            {(statistics?.statisticstasks || []).map(
              (s: any, index: number) => {
                const icon =
                  s.category === "Pending" ? ClipboardList : CheckCircle2;
                const color = s.category === "Pending" ? "#f59e0b" : "#10b981"; // Orange for pending, Green for completed
                return (
                  <ProgressChipCard
                    key={`task-${index}`}
                    title={s.category}
                    subtitle={`${s.counts}`}
                    icon={icon}
                    color={color}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      if (tabsRef) {
                        // Map statistics category to API status parameter
                        const apiStatus =
                          s.category === "Pending"
                            ? "PENDING"
                            : s.category === "Completed"
                            ? "Completed"
                            : "ALL";
                        tabsRef.selectTab("recent order", {
                          initialOrderType: "Tasks",
                          initialStatus: apiStatus,
                        });
                      }
                    }}
                  />
                );
              }
            )}
          </HorizontalSection>

          {/* Merchandise Activity Section */}
          <HorizontalSection title="Merchandise Activity" loading={loading}>
            {(statistics?.statisticsMCA || []).map((s: any, index: number) => {
              const icon =
                s.category === "Sales Order"
                  ? ShoppingCart
                  : s.category === "Customer"
                  ? Users
                  : s.category === "Items"
                  ? Boxes
                  : FileText;
              const color =
                s.category === "Sales Order"
                  ? "#8b5cf6" // Purple
                  : s.category === "Customer"
                  ? "#3b82f6" // Blue
                  : s.category === "Items"
                  ? "#10b981" // Green
                  : "#f59e0b"; // Orange
              return (
                <ProgressChipCard
                  key={`mca-${index}`}
                  title={s.category}
                  subtitle={`${s.counts}`}
                  icon={icon}
                  color={color}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (tabsRef) {
                      tabsRef.selectTab("recent order", {
                        initialOrderType: "Delivery Order",
                        initialStatus: "ALL",
                      });
                    }
                  }}
                />
              );
            })}
          </HorizontalSection>

          {/* Recent Section */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(600)}
            className="bg-white mx-6 rounded-2xl shadow-sm mt-8"
          >
            {/* Recent Header */}
            <View className="flex-row items-center justify-between px-6 py-5 border-b border-gray-50">
              <Text className="text-gray-600 font-medium text-xs uppercase tracking-wider">
                RECENT ACTIVITY (10)
              </Text>
              <Pressable
                className="px-4 py-2 rounded-lg active:bg-gray-50"
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (tabsRef) {
                    tabsRef.selectTab("recent order", {
                      initialOrderType: "Delivery Order",
                      initialStatus: "ALL",
                    });
                  }
                }}
                android_ripple={{ color: "#f9fafb" }}
              >
                <Text className="text-indigo-600 font-medium text-sm">
                  View all
                </Text>
              </Pressable>
            </View>

            {/* Delivery Items */}
            <View className="px-4 py-4">
              {loading ? (
                <View>
                  <ShimmerRecentItem />
                  <ShimmerRecentItem />
                  <ShimmerRecentItem />
                  <ShimmerRecentItem />
                  <ShimmerRecentItem />
                </View>
              ) : (
                (() => {
                  const totalDoDetails = (
                    statistics?.statisticsDODetails || []
                  ).reduce(
                    (sum: number, it: any) => sum + (Number(it.counts) || 0),
                    0
                  );
                  if (totalDoDetails > 0) {
                    const details = (
                      statistics?.statisticsDODetails || []
                    ).flatMap((it: any) => it.stageDetails || []);
                    if (details.length > 0) {
                      // Debug: Log the first item to see available fields
                      if (details.length > 0) {
                        console.log(
                          "🔍 Recent Activity Data Sample:",
                          JSON.stringify(details[0], null, 2)
                        );
                      }
                      return details
                        .slice(0, 10)
                        .map((d: any, index: number) => (
                          <Animated.View
                            key={`recent-${index}`}
                            entering={FadeInDown.delay(
                              800 + index * 100
                            ).duration(400)}
                          >
                            <DeliveryItem
                              name={d?.customerName || d?.name || "-"}
                              orderNumber={
                                d?.docNum || d?.orderNumber || d?.doStr || d?.id
                              }
                              amount={d?.amount ? String(d.amount) : ""}
                              status={(d?.status as any) || "pending"}
                              note={d?.note}
                              isLast={
                                index === Math.min(details.length, 10) - 1
                              }
                            />
                          </Animated.View>
                        ));
                    }
                  }
                  return (
                    <View className="py-12 items-center">
                      <Text className="text-gray-400 text-sm">
                        No recent activity
                      </Text>
                    </View>
                  );
                })()
              )}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default HomeScreen;
