import React from "react";
import { View, Text, Pressable } from "react-native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { Svg, Circle } from "react-native-svg";

interface ProgressChipCardProps {
  title: string;
  subtitle?: string; // e.g., 12/20
  percent: number; // 0..100
  icon: React.ComponentType<any>;
  color: string; // accent color for icon/progress
  onPress?: () => void;
}

const ProgressChipCard: React.FC<ProgressChipCardProps> = ({
  title,
  subtitle,
  percent,
  icon: Icon,
  color,
  onPress,
}) => {
  const clamped = Math.max(0, Math.min(100, Math.round(percent)));
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const dash = (clamped / 100) * circumference;

  return (
    <Animated.View entering={FadeInUp.duration(350)} className="mr-3">
      <Pressable
        className="w-40 bg-white rounded-2xl px-3 py-3 shadow-sm active:bg-gray-50"
        android_ripple={{ color: "#f3f4f6" }}
        onPress={onPress}
      >
        <View className="flex-row items-center justify-between mb-2">
          <View
            className="w-9 h-9 rounded-xl items-center justify-center"
            style={{ backgroundColor: color + "1A" }}
          >
            <Icon size={18} color={color} />
          </View>
          <View className="items-center justify-center">
            <Svg width={34} height={34}>
              <Circle
                cx={17}
                cy={17}
                r={radius}
                stroke="#e5e7eb"
                strokeWidth={3}
                fill="none"
              />
              <Circle
                cx={17}
                cy={17}
                r={radius}
                stroke={color}
                strokeWidth={3}
                fill="none"
                strokeDasharray={`${dash} ${circumference}`}
                strokeLinecap="round"
                transform="rotate(-90 17 17)"
              />
            </Svg>
            <View
              style={{
                position: "absolute",
                width: 34,
                height: 34,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text className="text-gray-800 font-nunito font-semibold text-[10px]">
                {clamped}%
              </Text>
            </View>
          </View>
        </View>
        <Text
          className="text-gray-900 font-nunito font-semibold text-sm"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-gray-500 font-nunito text-xs mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
    </Animated.View>
  );
};

export default ProgressChipCard;
