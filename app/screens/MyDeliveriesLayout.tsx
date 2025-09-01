import React, { useEffect } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import {
  QrCode,
  Search,
  Package,
  MapPin,
  CheckCircle,
  User,
  House,
} from "lucide-react-native";

const Card: React.FC<{
  title: string;
  description: string;
  delay: number;
  leftIllustration: React.ReactNode;
}> = ({ title, description, delay, leftIllustration }) => {
  const translateY = useSharedValue(40);
  const opacity = useSharedValue(0);
  const qrScale = useSharedValue(0.9);
  const searchScale = useSharedValue(0.9);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withSpring(0, { damping: 16, stiffness: 160 })
    );
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    qrScale.value = withDelay(delay + 200, withTiming(1, { duration: 200 }));
    searchScale.value = withDelay(
      delay + 200,
      withTiming(1, { duration: 200 })
    );
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const qrStyle = useAnimatedStyle(() => ({
    transform: [{ scale: qrScale.value }],
  }));
  const searchStyle = useAnimatedStyle(() => ({
    transform: [{ scale: searchScale.value }],
  }));

  return (
    <Animated.View
      style={cardStyle}
      className="bg-white rounded-2xl shadow-lg p-5 mb-4"
    >
      <View className="flex-row items-start justify-between mb-4">
        <View className="flex-1 pr-3">
          <Text className="text-red-600 text-xl font-bold mb-1">{title}</Text>
          <Text className="text-gray-600">{description}</Text>
        </View>
        <View className="items-center justify-center">{leftIllustration}</View>
      </View>

      <View className="flex-row items-center">
        <Animated.View style={qrStyle}>
          <Pressable className="w-10 h-10 rounded-lg bg-red-100 items-center justify-center mr-3 active:bg-red-200">
            <QrCode size={20} color="#DC2626" />
          </Pressable>
        </Animated.View>
        <Animated.View style={searchStyle}>
          <Pressable className="w-10 h-10 rounded-lg bg-red-100 items-center justify-center active:bg-red-200">
            <Search size={20} color="#DC2626" />
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const MyDeliveriesLayout: React.FC = () => {
  const headerOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 500 });
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Purple header with only title */}
      <Animated.View style={headerStyle} className="px-6 py-4 bg-purple-600">
        <Text className="text-white text-xl font-bold">
          My Deliveries Layout
        </Text>
      </Animated.View>

      <ScrollView
        className="flex-1 px-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        {/* Picked */}
        <Card
          title="Picked"
          description="View Order Picking Details & Remarks"
          delay={0}
          leftIllustration={
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-2">
                <User size={20} color="#7C3AED" />
              </View>
              <View className="w-12 h-12 rounded-lg bg-indigo-100 items-center justify-center">
                <Package size={20} color="#4F46E5" />
              </View>
            </View>
          }
        />

        {/* Dispatching */}
        <Card
          title="Dispatching"
          description="View Dispatch Details Vehicle No & Location"
          delay={300}
          leftIllustration={
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-2">
                <User size={20} color="#2563EB" />
              </View>
              <View className="w-12 h-12 rounded-lg bg-gray-100 items-center justify-center">
                <MapPin size={20} color="#2563EB" />
              </View>
            </View>
          }
        />

        {/* Confirmation */}
        <Card
          title="Confirmation"
          description="Order Confirmation Details Customer Feed back"
          delay={600}
          leftIllustration={
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-emerald-100 items-center justify-center mr-2">
                <User size={20} color="#10B981" />
              </View>
              <View className="w-12 h-12 rounded-lg bg-emerald-50 items-center justify-center">
                <CheckCircle size={22} color="#10B981" />
              </View>
            </View>
          }
        />

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
};

export default MyDeliveriesLayout;
