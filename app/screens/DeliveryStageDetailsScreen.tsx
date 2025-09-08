import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  TextInput,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeInDown,
  FadeIn,
  SlideInDown,
  FadeOutUp,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import {
  ArrowLeft,
  Search,
  QrCode,
  Check,
  X,
  Phone,
  ChevronDown,
  Calendar,
  User,
  MapPin,
  CreditCard,
  Package,
  ClipboardList,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type DeliveryStage = "open" | "picking" | "delivered" | "completed";

interface DeliveryStageDetailsScreenProps {
  orderData: {
    id: number;
    docNum: string;
    cardName: string;
    status: string;
    docDate: string;
    bpfName: string;
    amount: number;
    paymentType: string;
    mobileNo: string;
    contactNumber: string;
    customerReference: string;
    vehicleNo: string;
    deliveryDate?: string;
  };
  currentStage: DeliveryStage;
  onBack: () => void;
  onStageChange?: (newStage: DeliveryStage) => void;
}

const DeliveryStageDetailsScreen: React.FC<DeliveryStageDetailsScreenProps> = ({
  orderData,
  currentStage,
  onBack,
  onStageChange,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectAll, setSelectAll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCardSelected, setIsCardSelected] = useState(false);

  const getStageTitle = (stage: DeliveryStage) => {
    switch (stage) {
      case "open":
        return "Open";
      case "picking":
        return "Picking";
      case "delivered":
        return "Delivered";
      case "completed":
        return "Completed";
      default:
        return "Delivery Stage";
    }
  };

  const getStageColor = (stage: DeliveryStage) => {
    switch (stage) {
      case "open":
        return "#f59e0b"; // Yellow
      case "picking":
        return "#3b82f6"; // Blue
      case "delivered":
        return "#10b981"; // Green
      case "completed":
        return "#059669"; // Dark Green
      default:
        return "#6b7280"; // Gray
    }
  };

  const getStageIcon = (stage: DeliveryStage) => {
    switch (stage) {
      case "open":
        return ClipboardList;
      case "picking":
        return Package;
      case "delivered":
        return CheckCircle2;
      case "completed":
        return CheckCircle2;
      default:
        return ClipboardList;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const formatAmount = (amount: number) => {
    return amount ? `$${amount.toFixed(2)}` : "N/A";
  };

  const handleCall = () => {
    const phoneNumber = orderData.mobileNo || orderData.contactNumber;
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    } else {
      Alert.alert("No phone number available");
    }
  };

  const handleSelectAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectAll(!selectAll);
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: () => {
          // Handle order cancellation logic here
          console.log("Order cancelled");
          onBack(); // Go back to previous screen
        },
      },
    ]);
  };

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const getConfirmMessage = (stage: DeliveryStage) => {
      switch (stage) {
        case "open":
          return "Are you sure you want to start picking this order?";
        case "picking":
          return "Are you sure you want to mark this order as delivered?";
        case "delivered":
          return "Are you sure you want to complete this order?";
        case "completed":
          return "This order is already completed.";
        default:
          return "Are you sure you want to confirm this action?";
      }
    };

    const getNextStage = (stage: DeliveryStage): DeliveryStage | null => {
      switch (stage) {
        case "open":
          return "picking";
        case "picking":
          return "delivered";
        case "delivered":
          return "completed";
        case "completed":
          return null;
        default:
          return null;
      }
    };

    if (currentStage === "completed") {
      Alert.alert("Order Completed", "This order is already completed.");
      return;
    }

    const nextStage = getNextStage(currentStage);
    if (!nextStage) return;

    Alert.alert("Confirm", getConfirmMessage(currentStage), [
      { text: "Cancel", style: "cancel" },
      {
        text: "Confirm",
        onPress: () => {
          onStageChange?.(nextStage);
          console.log(`Order moved from ${currentStage} to ${nextStage}`);
        },
      },
    ]);
  };

  const handleExpand = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const handleCardSelect = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsCardSelected(!isCardSelected);
  };

  const handleCardPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsExpanded(!isExpanded);
  };

  const stageColor = getStageColor(currentStage);
  const StageIcon = getStageIcon(currentStage);

  // Stage-specific logic
  const isCompleted = currentStage === "completed";
  const canCancel = currentStage !== "completed";
  const canConfirm = currentStage !== "completed";
  const showSearchBar = currentStage === "picking";
  const showSelectionControls = currentStage === "picking";

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <Animated.View
        entering={FadeIn.duration(600)}
        className="px-4 py-2"
        style={{ backgroundColor: "#8b5cf6" }}
      >
        <View className="flex-row items-center justify-between h-12">
          <Pressable
            onPress={onBack}
            className="w-10 h-10 items-center justify-center rounded-lg active:bg-white/20"
            android_ripple={{ color: "rgba(255,255,255,0.2)" }}
          >
            <ArrowLeft size={24} color="#FFFFFF" />
          </Pressable>
          <Text className="text-white font-bold text-lg text-center">
            {getStageTitle(currentStage)}
          </Text>
          <View style={{ width: 40 }} />
        </View>
      </Animated.View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 20 }}
      >
        {/* Search Bar - Only show for picking and dispatching stages */}
        {showSearchBar && (
          <Animated.View
            entering={SlideInDown.delay(200).duration(500)}
            className="bg-white px-4 py-3 border-b border-gray-100"
          >
            <View className="flex-row items-center bg-gray-100 rounded-lg px-3 py-2">
              <QrCode size={20} color="#6b7280" />
              <TextInput
                className="flex-1 ml-3 text-gray-900"
                placeholder="Search DO/INV Number"
                placeholderTextColor="#9ca3af"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              <View className="w-px h-6 bg-gray-300 mx-2" />
              <Search size={20} color="#6b7280" />
            </View>
          </Animated.View>
        )}

        {/* Selection Controls - Only show for picking and dispatching stages */}
        {showSelectionControls && (
          <Animated.View
            entering={FadeInUp.delay(400).duration(600)}
            className="bg-white px-4 py-3 border-b border-gray-100"
          >
            <View className="flex-row items-center justify-between">
              <Pressable
                onPress={handleSelectAll}
                className="flex-row items-center"
              >
                <View
                  className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                    selectAll
                      ? "bg-purple-600 border-purple-600"
                      : "border-gray-300"
                  }`}
                >
                  {selectAll && <Check size={12} color="white" />}
                </View>
                <Text className="text-gray-700 font-medium">Select All</Text>
              </Pressable>

              <View className="flex-row space-x-3">
                <Pressable
                  onPress={handleCancel}
                  className="w-10 h-10 bg-red-500 rounded-full items-center justify-center active:bg-red-600"
                  android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <X size={20} color="white" />
                </Pressable>
                <Pressable
                  onPress={handleConfirm}
                  className="w-10 h-10 bg-green-500 rounded-full items-center justify-center active:bg-green-600"
                  android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <Check size={20} color="white" />
                </Pressable>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Order Details Card */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(600)}
          className="flex-1 px-4 pt-4"
        >
          <View className="bg-white rounded-lg p-4 shadow-lg">
            {/* Top Row - Checkbox, Order Number, and Action Buttons */}
            <View className="flex-row items-center justify-between mb-4">
              {/* Checkbox */}
              <Pressable
                onPress={handleCardSelect}
                className="w-6 h-6 rounded border-2 items-center justify-center mr-3"
                style={{
                  borderColor: isCardSelected ? "#8b5cf6" : "#d1d5db",
                  backgroundColor: isCardSelected ? "#8b5cf6" : "transparent",
                }}
              >
                {isCardSelected && <Check size={14} color="white" />}
              </Pressable>

              {/* Order Number */}
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900">
                  {orderData.docNum}
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row items-center space-x-2">
                <Pressable
                  onPress={handleCall}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#8b5cf6" }}
                  android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <Phone size={20} color="white" />
                </Pressable>
                <Pressable
                  onPress={() => {}}
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#f59e0b" }}
                  android_ripple={{ color: "rgba(255,255,255,0.3)" }}
                >
                  <MapPin size={20} color="white" />
                </Pressable>
              </View>
            </View>

            {/* Customer Info - Always visible */}
            <View className="mb-4">
              <Text className="text-lg font-semibold text-gray-900">
                {orderData.cardName}
              </Text>
              <View className="flex-row items-center mt-1">
                <View className="w-4 h-4 border border-blue-500 rounded mr-2" />
                <Text className="text-sm text-gray-600">
                  {orderData.mobileNo || orderData.contactNumber || "No phone"}
                </Text>
              </View>
              <Text className="text-sm font-medium text-gray-600 mt-1">
                (RC0103019)
              </Text>
            </View>

            {/* Expand/Collapse Indicator - Clickable */}
            {!isExpanded && (
              <Pressable
                onPress={handleCardPress}
                className="items-center mt-4 active:bg-gray-50 rounded-lg p-2 -m-2"
                android_ripple={{ color: "rgba(0,0,0,0.05)" }}
              >
                <Text className="text-gray-500 text-sm mb-2">Expand</Text>
                <View
                  className="w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: "#8b5cf6" }}
                >
                  <ChevronDown
                    size={16}
                    color="white"
                    style={{
                      transform: [{ rotate: "0deg" }],
                    }}
                  />
                </View>
              </Pressable>
            )}

            {/* Order Details - Collapsible */}
            {isExpanded && (
              <Animated.View
                entering={FadeInUp.duration(300)}
                exiting={FadeOutUp.duration(300)}
                className="space-y-3 mt-4"
              >
                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 font-medium">Date</Text>
                  <Text style={{ color: "#3b82f6" }} className="font-semibold">
                    {formatDate(orderData.docDate)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 font-medium">Doc. No</Text>
                  <Text style={{ color: "#3b82f6" }} className="font-semibold">
                    {orderData.docNum}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 font-medium">
                    Customer Name
                  </Text>
                  <Text style={{ color: "#3b82f6" }} className="font-semibold">
                    {orderData.cardName}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 font-medium">Address</Text>
                  <Text style={{ color: "#3b82f6" }} className="font-semibold">
                    {orderData.bpfName || "N/A"}
                  </Text>
                </View>

                {/* Stage-specific information */}

                {currentStage === "delivered" && orderData.deliveryDate && (
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-600 font-medium">
                      Delivery Date
                    </Text>
                    <Text
                      style={{ color: "#3b82f6" }}
                      className="font-semibold"
                    >
                      {formatDate(orderData.deliveryDate)}
                    </Text>
                  </View>
                )}

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 font-medium">Amount</Text>
                  <Text style={{ color: "#3b82f6" }} className="font-semibold">
                    {formatAmount(orderData.amount)}
                  </Text>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-600 font-medium">
                    Payment Type
                  </Text>
                  <Text style={{ color: "#3b82f6" }} className="font-semibold">
                    {orderData.paymentType || ""}
                  </Text>
                </View>

                {/* Show customer reference for completed orders */}
                {currentStage === "completed" &&
                  orderData.customerReference && (
                    <View className="flex-row justify-between items-center">
                      <Text className="text-gray-600 font-medium">
                        Customer Reference
                      </Text>
                      <Text
                        style={{ color: "#3b82f6" }}
                        className="font-semibold"
                      >
                        {orderData.customerReference}
                      </Text>
                    </View>
                  )}
              </Animated.View>
            )}

            {/* Collapse Button - Bottom Center when expanded */}
            {isExpanded && (
              <Animated.View
                entering={FadeInUp.duration(300)}
                className="items-center mt-4"
              >
                <Pressable
                  onPress={handleCardPress}
                  className="items-center active:bg-gray-50 rounded-lg p-2 -m-2"
                  android_ripple={{ color: "rgba(0,0,0,0.05)" }}
                >
                  <Text className="text-gray-500 text-sm mb-2">Collapse</Text>
                  <View
                    className="w-8 h-8 rounded-full items-center justify-center"
                    style={{ backgroundColor: "#8b5cf6" }}
                  >
                    <ChevronDown
                      size={16}
                      color="white"
                      style={{
                        transform: [{ rotate: "180deg" }],
                      }}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            )}

            {/* Completed Status Message */}
            {isCompleted && (
              <View className="mt-4 py-3 rounded-lg items-center bg-green-50 border border-green-200">
                <Text className="text-green-700 font-semibold text-base">
                  ✓ Order Completed Successfully
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default DeliveryStageDetailsScreen;
