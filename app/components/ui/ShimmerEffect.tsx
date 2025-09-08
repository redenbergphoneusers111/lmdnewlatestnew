import React, { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from "react-native-reanimated";

interface ShimmerEffectProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

const ShimmerEffect: React.FC<ShimmerEffectProps> = ({
  width = "100%",
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnimation = useSharedValue(0);

  useEffect(() => {
    shimmerAnimation.value = withRepeat(
      withTiming(1, { duration: 1500 }),
      -1,
      false
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerAnimation.value, [0, 1], [-100, 100]);

    return {
      transform: [{ translateX }],
    };
  });

  return (
    <View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: "#f0f0f0",
          overflow: "hidden",
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "#e0e0e0",
          },
          animatedStyle,
        ]}
      />
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(255, 255, 255, 0.6)",
          transform: [{ skewX: "-20deg" }],
        }}
      />
    </View>
  );
};

// Shimmer components for different UI elements
export const ShimmerCard: React.FC<{ height?: number }> = ({
  height = 120,
}) => (
  <View
    style={{
      backgroundColor: "white",
      borderRadius: 16,
      padding: 20,
      marginHorizontal: 24,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }}
  >
    <ShimmerEffect width="60%" height={20} borderRadius={4} />
    <View style={{ marginTop: 12 }}>
      <ShimmerEffect width="40%" height={16} borderRadius={4} />
    </View>
    <View style={{ marginTop: 8 }}>
      <ShimmerEffect width="80%" height={16} borderRadius={4} />
    </View>
  </View>
);

export const ShimmerProgressCard: React.FC = () => (
  <View
    style={{
      backgroundColor: "white",
      borderRadius: 12,
      padding: 16,
      marginRight: 12,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
      minWidth: 120,
    }}
  >
    <ShimmerEffect width={40} height={40} borderRadius={20} />
    <View style={{ marginTop: 12 }}>
      <ShimmerEffect width="80%" height={16} borderRadius={4} />
    </View>
    <View style={{ marginTop: 4 }}>
      <ShimmerEffect width="60%" height={14} borderRadius={4} />
    </View>
  </View>
);

export const ShimmerRecentItem: React.FC = () => (
  <View
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
      flexDirection: "row",
      alignItems: "center",
    }}
  >
    {/* Icon placeholder */}
    <ShimmerEffect width={40} height={40} borderRadius={20} />

    {/* Content placeholder */}
    <View style={{ flex: 1, marginLeft: 12 }}>
      <ShimmerEffect width="70%" height={16} borderRadius={4} />
      <View style={{ marginTop: 4 }}>
        <ShimmerEffect width="50%" height={14} borderRadius={4} />
      </View>
    </View>

    {/* Right side placeholder */}
    <View style={{ alignItems: "flex-end" }}>
      <ShimmerEffect width={60} height={16} borderRadius={4} />
      <View style={{ marginTop: 4 }}>
        <ShimmerEffect width={80} height={20} borderRadius={10} />
      </View>
    </View>
  </View>
);

export default ShimmerEffect;
