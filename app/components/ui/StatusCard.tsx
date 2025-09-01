import React, { useEffect } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { Svg, Circle } from "react-native-svg";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

interface StatusCardProps {
  count: number;
  label: string;
  color: string;
  delay?: number;
}

const StatusCard: React.FC<StatusCardProps> = ({
  count,
  label,
  color,
  delay = 0,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const circleProgress = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15 }));
    circleProgress.value = withDelay(
      delay + 200,
      withTiming(1, { duration: 800 })
    );
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${circleProgress.value * 360}deg` }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSpring(0.95, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
  };

  return (
    <Animated.View style={animatedStyle} className="w-[48%] mb-4">
      <Pressable
        onPress={handlePress}
        android_ripple={{ color: "rgba(255,255,255,0.2)" }}
        className="rounded-2xl overflow-hidden"
      >
        <LinearGradient
          colors={["#6C63FF", "#5b54d9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 16 }}
        >
          <View className="p-4">
            <View className="items-center mb-3">
              <View className="relative" style={{ width: 48, height: 48 }}>
                <Svg width={48} height={48} className="transform -rotate-90">
                  <Circle
                    cx={24}
                    cy={24}
                    r={19}
                    stroke="rgba(255,255,255,0.28)"
                    strokeWidth={4}
                    fill="none"
                  />
                  <Animated.View style={animatedCircleStyle}>
                    <Circle
                      cx={4}
                      cy={29}
                      r={19}
                      stroke="#FFFFFF"
                      strokeWidth={4}
                      fill="none"
                      strokeDasharray={`${(count / 30) * 119} 119`}
                      strokeLinecap="round"
                    />
                  </Animated.View>
                </Svg>
                <View style={styles.countContainer}>
                  <Text
                    style={[styles.countText, { color: "#FFFFFF" }]}
                    className="font-nunito font-bold"
                  >
                    {count}
                  </Text>
                </View>
              </View>
            </View>

            <Text className="text-center font-nunito font-semibold text-sm text-white">
              {label}
            </Text>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  countContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  countText: {
    fontSize: 24,
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
    padding: 0,
  },
});

export default StatusCard;
