import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";

interface ProgressChipCardProps {
  title: string;
  subtitle?: string; // e.g., count value
  icon: React.ComponentType<any>;
  color: string; // accent color for icon
  onPress?: () => void;
}

const ProgressChipCard: React.FC<ProgressChipCardProps> = ({
  title,
  subtitle,
  icon: Icon,
  color,
  onPress,
}) => {
  return (
    <Animated.View entering={FadeInUp.duration(350)} className="mr-5">
      <Pressable
        className="w-32 h-32 rounded-xl shadow-lg items-center justify-center px-2"
        android_ripple={{ color: "rgba(255, 255, 255, 0.2)" }}
        onPress={onPress}
        style={{
          backgroundColor: color + "CC", // Adding 80% opacity (CC = 204/255)
          borderWidth: 1,
          borderColor: "rgba(255, 255, 255, 0.3)",
          shadowColor: color,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        {/* Icon at top center */}
        <View
          className="w-8 h-8 rounded-full items-center justify-center mb-3"
          style={{ backgroundColor: "rgba(255, 255, 255, 0.25)" }}
        >
          <Icon size={16} color="white" />
        </View>

        {/* Title below icon */}
        <Text
          className="text-white font-medium text-xs text-center mb-2"
          numberOfLines={1}
        >
          {title}
        </Text>

        {/* Count value at bottom */}
        <Text className="text-white font-bold text-lg text-center">
          {subtitle || "0"}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

export default ProgressChipCard;
