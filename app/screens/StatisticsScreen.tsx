import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import {
  Calendar,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  PieChart,
} from "lucide-react-native";

const WEEK = [
  { label: "Mon", day: "25" },
  { label: "Tue", day: "26" },
  { label: "Wed", day: "27" },
  { label: "Thu", day: "28", highlight: true },
  { label: "Fri", day: "29" },
  { label: "Sat", day: "30" },
  { label: "Sun", day: "31" },
];

const Card: React.FC<{
  title: string;
  countText: string;
  color: string; // bg color
  Icon: React.ComponentType<any>;
  delay: number;
}> = ({ title, countText, color, Icon, delay }) => {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withTiming(1, { duration: 220 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 220 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={style}
      className="rounded-2xl p-4 mr-3 mb-3"
      // @ts-ignore
      style={[style, { backgroundColor: color }]}
    >
      <View className="flex-row items-center justify-between">
        <View className="flex-1 pr-3">
          <Text className="text-gray-900 font-semibold" numberOfLines={1}>
            {title}
          </Text>
          <Text className="text-gray-700 mt-1" numberOfLines={1}>
            {countText}
          </Text>
        </View>
        <View className="w-10 h-10 rounded-xl bg-white/60 items-center justify-center">
          <Icon size={20} color="#0F172A" />
        </View>
      </View>
    </Animated.View>
  );
};

const StatisticsScreen: React.FC = () => {
  const headerOpacity = useSharedValue(0);
  const dateTranslateY = useSharedValue(-16);
  const dateOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
    dateTranslateY.value = withDelay(150, withTiming(0, { duration: 300 }));
    dateOpacity.value = withDelay(150, withTiming(1, { duration: 300 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));
  const dateStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dateTranslateY.value }],
    opacity: dateOpacity.value,
  }));

  return (
    <SafeAreaView className="flex-1 bg-slate-900">
      {/* Futuristic dark background overlay */}
      <View className="absolute inset-0">
        <View className="absolute -top-10 -left-10 w-56 h-56 rounded-full bg-teal-500/10" />
        <View className="absolute bottom-10 -right-10 w-72 h-72 rounded-full bg-purple-600/10" />
      </View>

      {/* Gradient header */}
      <Animated.View
        style={headerStyle}
        className="overflow-hidden rounded-b-3xl"
      >
        <LinearGradient
          colors={["#14b8a6", "#7c3aed"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 py-5"
        >
          <View className="flex-row items-center justify-between">
            <Text className="text-white text-xl font-bold">Statistics</Text>
            <View className="w-10 h-10 rounded-xl bg-white/20 items-center justify-center">
              <Calendar size={22} color="#FFFFFF" />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Date picker */}
        <Animated.View style={dateStyle} className="px-6 pt-4">
          <View className="bg-slate-800 rounded-2xl p-4 border border-white/5">
            <Text className="text-white font-semibold mb-3">August 2025</Text>
            <View className="flex-row items-center justify-between">
              {WEEK.map((d) => (
                <View
                  key={`${d.label}${d.day}`}
                  className={`items-center px-2 py-2 rounded-xl ${
                    d.highlight ? "bg-red-500" : "bg-transparent"
                  }`}
                >
                  <Text
                    className={`text-xs ${
                      d.highlight ? "text-white" : "text-slate-300"
                    }`}
                  >
                    {d.label}
                  </Text>
                  <Text
                    className={`text-sm font-semibold ${
                      d.highlight ? "text-white" : "text-slate-200"
                    }`}
                  >
                    {d.day}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Cards Grid */}
        <View className="px-6 pt-4">
          <View className="flex-row flex-wrap -mr-3">
            <Card
              title="Deliveries Picking"
              countText="0 Deliveries Picking"
              color="#E0F2FE" // light blue
              Icon={Clock}
              delay={0}
            />
            <Card
              title="Deliveries Dispatching"
              countText="0 Deliveries Dispatching"
              color="#DCFCE7" // light green
              Icon={Truck}
              delay={200}
            />
            <Card
              title="Deliveries Confirmation"
              countText="0 Deliveries Confirmation"
              color="#FEE2E2" // light red
              Icon={CheckCircle}
              delay={400}
            />
            <Card
              title="Deliveries Cancelled"
              countText="0 Deliveries Cancelled"
              color="#E5E7EB" // light gray
              Icon={XCircle}
              delay={600}
            />
            <Card
              title="Overall Report"
              countText="View consolidated insights"
              color="#FEF9C3" // soft yellow
              Icon={PieChart}
              delay={800}
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default StatisticsScreen;
