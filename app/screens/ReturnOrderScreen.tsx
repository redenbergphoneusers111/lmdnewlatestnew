import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  interpolate,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import {
  Grid3X3,
  Menu,
  QrCode,
  Search,
  Package,
  MapPin,
  CheckCircle,
  Home,
  RotateCcw,
  Bell,
  User,
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

interface ReturnOrderStatus {
  id: string;
  title: string;
  description: string;
  status: "pickup" | "confirmation";
  icon: React.ReactNode;
  color: string;
}

interface ReturnOrderScreenProps {
  onBack?: () => void;
}

const ReturnOrderScreen: React.FC<ReturnOrderScreenProps> = ({ onBack }) => {
  // Animation values
  const card1TranslateY = useSharedValue(100);
  const card1Opacity = useSharedValue(0);
  const card2TranslateY = useSharedValue(100);
  const card2Opacity = useSharedValue(0);
  const bottomNavTranslateY = useSharedValue(50);
  const bottomNavOpacity = useSharedValue(0);

  const returnOrderStatuses: ReturnOrderStatus[] = [
    {
      id: "1",
      title: "Pickup Order",
      description: "View Order Pickup Details & Customer Information",
      status: "pickup",
      icon: <Package size={24} color="#DC2626" />,
      color: "#8B5CF6",
    },
    {
      id: "2",
      title: "Return Confirmation",
      description: "Confirm Return Details & Process Completion",
      status: "confirmation",
      icon: <CheckCircle size={24} color="#DC2626" />,
      color: "#8B5CF6",
    },
  ];

  useEffect(() => {
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Cards animation with staggered delay
    card1TranslateY.value = withDelay(
      200,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    card1Opacity.value = withDelay(200, withTiming(1, { duration: 600 }));

    card2TranslateY.value = withDelay(
      400,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    card2Opacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    // Bottom navigation animation
    bottomNavTranslateY.value = withDelay(
      600,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    bottomNavOpacity.value = withDelay(600, withTiming(1, { duration: 600 }));
  };

  const handleCardPress = (status: string) => {
    console.log(`Navigating to ${status} details`);
    // Add navigation logic here
  };

  const handleQrCodePress = (status: string) => {
    console.log(`Opening QR code for ${status}`);
    // Add QR code logic here
  };

  const handleSearchPress = (status: string) => {
    console.log(`Opening search for ${status}`);
    // Add search logic here
  };

  // Animated styles
  const card1AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card1TranslateY.value }],
    opacity: card1Opacity.value,
  }));

  const card2AnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: card2TranslateY.value }],
    opacity: card2Opacity.value,
  }));

  const bottomNavAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomNavTranslateY.value }],
    opacity: bottomNavOpacity.value,
  }));

  const renderReturnCard = (status: ReturnOrderStatus, index: number) => {
    let animatedStyle;
    let illustration;
    let iconPosition: "left" | "right";

    switch (index) {
      case 0: // Pickup Order
        animatedStyle = card1AnimatedStyle;
        illustration = (
          <StyledView className="flex-row items-center">
            <StyledView className="w-16 h-16 bg-blue-200 rounded-lg items-center justify-center">
              <Package size={20} color="#3B82F6" />
            </StyledView>
          </StyledView>
        );
        iconPosition = "left";
        break;
      case 1: // Return Confirmation
        animatedStyle = card2AnimatedStyle;
        illustration = (
          <StyledView className="flex-row items-center">
            <StyledView className="w-16 h-16 bg-blue-100 rounded-lg items-center justify-center mr-5">
              <CheckCircle size={20} color="#3B82F6" />
            </StyledView>
          </StyledView>
        );
        iconPosition = "right";
        break;
      default:
        animatedStyle = card1AnimatedStyle;
        illustration = null;
        iconPosition = "left";
    }

    return (
      <StyledAnimatedView
        key={status.id}
        className="bg-white rounded-2xl shadow-lg mb-4 overflow-hidden"
        style={animatedStyle}
      >
        <StyledView className="p-6">
          <StyledView
            className={`flex-row items-start justify-between mb-4 ${
              iconPosition === "right" ? "flex-row-reverse" : ""
            }`}
          >
            <StyledView
              className={`flex-1 ${
                iconPosition === "right" ? "text-right" : ""
              }`}
            >
              <StyledText
                className="text-2xl font-bold mb-2"
                style={{ color: status.color }}
              >
                {status.title}
              </StyledText>
              <StyledText className="text-gray-600 text-sm leading-5">
                {status.description}
              </StyledText>
            </StyledView>
            <StyledView className="ml-4">{illustration}</StyledView>
          </StyledView>

          <StyledView
            className={`flex-row items-center ${
              iconPosition === "right" ? "justify-end" : "justify-start"
            }`}
          >
            <StyledPressable
              onPress={() => handleQrCodePress(status.status)}
              className="w-10 h-10 bg-red-100 rounded-lg items-center justify-center mr-3 active:bg-red-200"
            >
              <QrCode size={20} color={status.color} />
            </StyledPressable>
            <StyledPressable
              onPress={() => handleSearchPress(status.status)}
              className="w-10 h-10 bg-red-100 rounded-lg items-center justify-center active:bg-red-200"
            >
              <Search size={20} color={status.color} />
            </StyledPressable>
          </StyledView>
        </StyledView>
      </StyledAnimatedView>
    );
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-gray-50">
      {/* Content */}
      <StyledScrollView
        className="flex-1 px-6 pt-1"
        showsVerticalScrollIndicator={false}
      >
        {returnOrderStatuses.map((status, index) =>
          renderReturnCard(status, index)
        )}

        {/* Bottom spacing for bottom navigation */}
        <StyledView className="h-20" />
      </StyledScrollView>
    </StyledSafeAreaView>
  );
};

export default ReturnOrderScreen;
