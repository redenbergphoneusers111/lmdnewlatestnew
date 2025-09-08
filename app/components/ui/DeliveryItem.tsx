import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { Package, CheckCircle2, XCircle, Clock } from "lucide-react-native";

interface DeliveryItemProps {
  name: string;
  orderNumber?: string;
  amount: string;
  status: "delivered" | "cancelled" | "pending";
  note?: string;
  isLast?: boolean;
}

const statusColors = {
  delivered: "#10b981",
  cancelled: "#ef4444",
  pending: "#f59e0b",
};

const statusLabels = {
  delivered: "Delivered",
  cancelled: "Cancelled",
  pending: "Pending",
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case "delivered":
      return CheckCircle2;
    case "cancelled":
      return XCircle;
    case "pending":
      return Clock;
    default:
      return Package;
  }
};

const DeliveryItem: React.FC<DeliveryItemProps> = ({
  name,
  orderNumber,
  amount,
  status,
  note,
  isLast = false,
}) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.98, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
  };

  const StatusIcon = getStatusIcon(status);
  const statusColor = statusColors[status];

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        style={{
          backgroundColor: "white",
          paddingVertical: 16,
          paddingHorizontal: 20,
          marginBottom: 8,
          borderRadius: 12,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
          elevation: 3,
        }}
        onPress={handlePress}
        android_ripple={{ color: "#f9fafb" }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          {/* Left Section - Icon and Text */}
          <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
            {/* Status Icon */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: statusColor + "20",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <StatusIcon size={20} color={statusColor} />
            </View>

            {/* Text Content */}
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: 2,
                }}
              >
                {name}
                {orderNumber ? ` - ${orderNumber}` : ""}
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  color: "#6b7280",
                  fontWeight: "400",
                }}
              >
                Delivery Order
              </Text>
            </View>
          </View>

          {/* Right Section - Amount and Status Badge */}
          <View style={{ alignItems: "flex-end" }}>
            {/* Amount */}
            {amount && (
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "bold",
                  color: "#1f2937",
                  marginBottom: 4,
                }}
              >
                {amount}
              </Text>
            )}

            {/* Status Badge */}
            <View
              style={{
                backgroundColor: statusColor,
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <StatusIcon size={12} color="white" style={{ marginRight: 4 }} />
              <Text
                style={{
                  color: "white",
                  fontSize: 12,
                  fontWeight: "600",
                }}
              >
                {statusLabels[status]}
              </Text>
            </View>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default DeliveryItem;
