import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
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
} from "lucide-react-native";

import AnimatedHeader from "../components/ui/AnimatedHeader";
import StatusCard from "../components/ui/StatusCard";
import DeliveryItem from "../components/ui/DeliveryItem";
import ProgressChipCard from "../components/ui/ProgressChipCard";

interface DeliveryData {
  id: string;
  name: string;
  amount: string;
  status: "delivered" | "cancelled" | "pending";
  note?: string;
}

const deliveryData: DeliveryData[] = [
  { id: "1", name: "Connor Davidson", amount: "$278.47", status: "delivered" },
  { id: "2", name: "Connor Davidson", amount: "$278.47", status: "delivered" },
  { id: "3", name: "Connor Davidson", amount: "$0", status: "cancelled" },
  {
    id: "4",
    name: "Connor Davidson",
    amount: "",
    status: "pending",
    note: "invalid address",
  },
  { id: "5", name: "Connor Davidson", amount: "$278.47", status: "delivered" },
  {
    id: "6",
    name: "Connor Davidson",
    amount: "",
    status: "pending",
    note: "Bad Weather",
  },
];

const statusData = [
  { id: "1", count: 20, label: "Completed", color: "#43C337" },
  { id: "2", count: 6, label: "Postponed", color: "#E8B73A" },
  { id: "3", count: 8, label: "Pending", color: "#6C93E5" },
  { id: "4", count: 2, label: "Cancelled", color: "#FF2D55" },
];

type TileItem = {
  id: string;
  title: string;
  count?: number; // completed count
  completedCount?: number;
  totalCount?: number;
  color: string;
  icon: React.ComponentType<any>;
};

const HorizontalSection: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <Animated.View entering={FadeInUp.duration(500)} className="mb-2">
    <View className="flex-row items-center justify-between px-6 mb-3">
      <Text className="text-white font-nunito font-extrabold text-base tracking-wide">
        {title}
      </Text>
    </View>
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 24 }}
    >
      <View className="flex-row">{children}</View>
    </ScrollView>
  </Animated.View>
);

const TileCard: React.FC<{ item: TileItem; index: number }> = ({
  item,
  index,
}) => (
  <Animated.View
    entering={FadeInUp.delay(80 + index * 60).duration(380)}
    className="mr-3"
  >
    <Pressable
      className="bg-white/15 rounded-2xl p-4 active:bg-white/25 w-44"
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      android_ripple={{ color: "rgba(255,255,255,0.25)" }}
    >
      <View className="flex-row items-center justify-between mb-3">
        <View
          className="w-10 h-10 rounded-full items-center justify-center"
          style={{ backgroundColor: item.color + "30" }}
        >
          <item.icon size={20} color={item.color} />
        </View>
        {(() => {
          const completed =
            typeof item.completedCount === "number"
              ? item.completedCount
              : typeof item.count === "number"
              ? item.count
              : undefined;
          return typeof completed === "number" ? (
            <Text className="text-white font-nunito font-bold text-xl">
              {completed}
            </Text>
          ) : null;
        })()}
      </View>
      <Text className="text-white font-nunito font-semibold text-base">
        {item.title}
      </Text>
      {(() => {
        const completed =
          typeof item.completedCount === "number"
            ? item.completedCount
            : typeof item.count === "number"
            ? item.count
            : undefined;
        const total =
          typeof item.totalCount === "number" ? item.totalCount : undefined;
        if (
          typeof completed === "number" &&
          typeof total === "number" &&
          total > 0
        ) {
          const pct = Math.max(
            0,
            Math.min(100, Math.round((completed / total) * 100))
          );
          return (
            <View className="mt-3">
              <View className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                <View
                  className="h-2 bg-white"
                  style={{ width: `${pct}%` } as any}
                />
              </View>
              <View className="flex-row justify-between mt-1">
                <Text className="text-white/80 font-nunito text-xs">
                  {completed}/{total}
                </Text>
                <Text className="text-white/80 font-nunito text-xs">
                  {pct}%
                </Text>
              </View>
            </View>
          );
        }
        return null;
      })()}
    </Pressable>
  </Animated.View>
);

const HomeScreen: React.FC = () => {
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

  return (
    <View className="flex-1">
      <LinearGradient colors={["#6C63FF", "#5b54d9"]} className="flex-1">
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >
          {/* Today Section */}
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            className="px-6 mb-8 mt-6"
          >
            <View className="flex-row items-end justify-between mb-3">
              <View>
                <Text className="text-white font-nunito font-extrabold text-2xl tracking-wide">
                  Today
                </Text>
                <Text className="text-white/80 font-nunito text-xs mt-1">
                  {todayLabel}
                </Text>
              </View>
            </View>

            {/* Status Cards Grid */}
            <Animated.View style={animatedCardsStyle}>
              <View className="flex-row flex-wrap justify-between">
                {statusData.map((status, index) => (
                  <StatusCard
                    key={status.id}
                    count={status.count}
                    label={status.label}
                    color={status.color}
                    delay={index * 100}
                  />
                ))}
              </View>
            </Animated.View>
          </Animated.View>

          {/* Action Tiles - Horizontal Carousels */}
          <HorizontalSection title="Delivery Orders">
            {[
              {
                id: "do1",
                title: "Picking",
                completedCount: 12,
                totalCount: 20,
                color: "#6C93E5",
                icon: Truck,
              },
              {
                id: "do2",
                title: "Dispatching",
                completedCount: 8,
                totalCount: 14,
                color: "#6C63FF",
                icon: Send,
              },
              {
                id: "do3",
                title: "Confirmation",
                completedCount: 6,
                totalCount: 10,
                color: "#43C337",
                icon: ClipboardCheck,
              },
              {
                id: "do4",
                title: "Cancelled",
                completedCount: 2,
                totalCount: 4,
                color: "#FF2D55",
                icon: XCircle,
              },
              {
                id: "do5",
                title: "Completed",
                completedCount: 20,
                totalCount: 24,
                color: "#22C55E",
                icon: CheckCircle2,
              },
            ].map((item, index) => (
              <ProgressChipCard
                key={item.id}
                title={item.title}
                subtitle={`${item.completedCount}/${item.totalCount}`}
                percent={Math.round(
                  ((item.completedCount ?? 0) / (item.totalCount ?? 1)) * 100
                )}
                icon={item.icon}
                color={item.color}
              />
            ))}
          </HorizontalSection>

          <HorizontalSection title="Pickup Orders">
            {[
              {
                id: "po1",
                title: "Pickup Orders",
                completedCount: 5,
                totalCount: 12,
                color: "#6C63FF",
                icon: PackagePlus,
              },
              {
                id: "po2",
                title: "Return Confirmation",
                completedCount: 3,
                totalCount: 6,
                color: "#43C337",
                icon: ClipboardCheck,
              },
              {
                id: "po3",
                title: "Cancelled",
                completedCount: 1,
                totalCount: 3,
                color: "#FF2D55",
                icon: XCircle,
              },
              {
                id: "po4",
                title: "Completed",
                completedCount: 9,
                totalCount: 11,
                color: "#22C55E",
                icon: CheckCircle2,
              },
            ].map((item, index) => (
              <ProgressChipCard
                key={item.id}
                title={item.title}
                subtitle={`${item.completedCount}/${item.totalCount}`}
                percent={Math.round(
                  ((item.completedCount ?? 0) / (item.totalCount ?? 1)) * 100
                )}
                icon={item.icon}
                color={item.color}
              />
            ))}
          </HorizontalSection>

          <HorizontalSection title="Tasks">
            {[
              {
                id: "t1",
                title: "Pending",
                completedCount: 7,
                totalCount: 15,
                color: "#E8B73A",
                icon: ClipboardList,
              },
              {
                id: "t2",
                title: "Completed",
                completedCount: 18,
                totalCount: 20,
                color: "#43C337",
                icon: CheckCircle2,
              },
            ].map((item, index) => (
              <ProgressChipCard
                key={item.id}
                title={item.title}
                subtitle={`${item.completedCount}/${item.totalCount}`}
                percent={Math.round(
                  ((item.completedCount ?? 0) / (item.totalCount ?? 1)) * 100
                )}
                icon={item.icon}
                color={item.color}
              />
            ))}
          </HorizontalSection>

          <HorizontalSection title="Merchandise Activity">
            {[
              {
                id: "m1",
                title: "Sale Orders",
                completedCount: 14,
                totalCount: 22,
                color: "#6C63FF",
                icon: ShoppingCart,
              },
              {
                id: "m2",
                title: "Customer List",
                completedCount: 230,
                totalCount: 520,
                color: "#6C93E5",
                icon: Users,
              },
              {
                id: "m3",
                title: "Invoice List",
                completedCount: 42,
                totalCount: 60,
                color: "#E8B73A",
                icon: FileText,
              },
              {
                id: "m4",
                title: "Items List",
                completedCount: 128,
                totalCount: 200,
                color: "#43C337",
                icon: Boxes,
              },
              {
                id: "m5",
                title: "Drafts",
                completedCount: 6,
                totalCount: 11,
                color: "#ACB1C0",
                icon: FileText,
              },
            ].map((item) => (
              <ProgressChipCard
                key={item.id}
                title={item.title}
                subtitle={`${item.completedCount}/${item.totalCount}`}
                percent={Math.round(
                  ((item.completedCount ?? 0) / (item.totalCount ?? 1)) * 100
                )}
                icon={item.icon}
                color={item.color}
              />
            ))}
          </HorizontalSection>

          {/* Recent Section */}
          <Animated.View
            entering={FadeInUp.delay(600).duration(600)}
            className="bg-white mx-6 rounded-xl shadow-lg  mt-6"
          >
            {/* Recent Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-text-primary font-nunito font-normal text-xs uppercase tracking-wider">
                RECENT
              </Text>
              <Pressable
                className="px-3 py-1 rounded-md active:bg-red-50"
                onPress={() =>
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                }
                android_ripple={{ color: "#fee2e2" }}
              >
                <Text className="text-status-cancelled font-sf-display font-medium text-sm">
                  Show all
                </Text>
              </Pressable>
            </View>

            {/* Delivery Items */}
            <View className="px-5 py-2">
              {deliveryData.map((delivery, index) => (
                <Animated.View
                  key={delivery.id}
                  entering={FadeInDown.delay(800 + index * 100).duration(400)}
                >
                  <DeliveryItem
                    name={delivery.name}
                    amount={delivery.amount}
                    status={delivery.status}
                    note={delivery.note}
                    isLast={index === deliveryData.length - 1}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default HomeScreen;
