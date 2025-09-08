import React, { useEffect } from "react";
import { View, Text, Pressable, Dimensions, Modal } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
  withRepeat,
  withDelay,
  withSequence,
  interpolate,
} from "react-native-reanimated";
import { LogOut, AlertTriangle, Shield, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

interface LogoutConfirmationDialogProps {
  isVisible: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const LogoutConfirmationDialog: React.FC<LogoutConfirmationDialogProps> = ({
  isVisible,
  onConfirm,
  onCancel,
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const rotation = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const buttonScale = useSharedValue(1);
  const shimmerAnimation = useSharedValue(0);
  const pulseAnimation = useSharedValue(1);

  useEffect(() => {
    if (isVisible) {
      // Start animations
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 300 });

      // Icon animation with delay
      iconScale.value = withDelay(
        200,
        withSpring(1, { damping: 12, stiffness: 400 })
      );

      // Shimmer animation
      shimmerAnimation.value = withRepeat(
        withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      );

      // Pulse animation
      pulseAnimation.value = withRepeat(
        withSequence(
          withTiming(1.1, {
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
          }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    } else {
      // Hide animations
      scale.value = withSpring(0, { damping: 15, stiffness: 300 });
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withSpring(50, { damping: 15, stiffness: 300 });
      iconScale.value = withSpring(0, { damping: 15, stiffness: 300 });
      shimmerAnimation.value = withTiming(0, { duration: 200 });
      pulseAnimation.value = withTiming(1, { duration: 200 });
    }
  }, [isVisible]);

  const dialogStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const iconContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnimation.value }],
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerAnimation.value, [0, 1], [-100, 100]);
    return {
      transform: [{ translateX }],
    };
  });

  const confirmButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const cancelButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleConfirm = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onConfirm();
  };

  const handleCancel = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    buttonScale.value = withSequence(
      withSpring(0.95, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
    onCancel();
  };

  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      {/* Blurred backdrop */}
      <View
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Pressable style={{ flex: 1 }} onPress={handleCancel} />

        {/* Dialog - Centered */}
        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          }}
        >
          <Animated.View style={dialogStyle}>
            {/* Glassmorphic Container */}
            <View
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.95)",
                borderRadius: 28,
                padding: 32,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 20 },
                shadowOpacity: 0.3,
                shadowRadius: 25,
                elevation: 20,
                width: Math.min(screenWidth - 40, 360),
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
                overflow: "hidden",
              }}
            >
              {/* Shimmer Effect */}
              <Animated.View
                style={[
                  {
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    transform: [{ skewX: "-15deg" }],
                  },
                  shimmerStyle,
                ]}
              />

              {/* Close Button */}
              <Pressable
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  justifyContent: "center",
                  alignItems: "center",
                  zIndex: 10,
                }}
                onPress={handleCancel}
              >
                <X size={18} color="#6b7280" />
              </Pressable>

              {/* Icon Container with Pulse Effect */}
              <Animated.View style={pulseStyle}>
                <Animated.View
                  style={[
                    {
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      justifyContent: "center",
                      alignItems: "center",
                      marginBottom: 24,
                      alignSelf: "center",
                      position: "relative",
                    },
                    iconContainerStyle,
                  ]}
                >
                  {/* Gradient Background */}
                  <View
                    style={{
                      position: "absolute",
                      width: 100,
                      height: 100,
                      borderRadius: 50,
                      backgroundColor: "#fef2f2",
                      borderWidth: 3,
                      borderColor: "#fecaca",
                    }}
                  />

                  {/* Inner Glow */}
                  <View
                    style={{
                      position: "absolute",
                      width: 80,
                      height: 80,
                      borderRadius: 40,
                      backgroundColor: "#fee2e2",
                    }}
                  />

                  {/* Icon */}
                  <LogOut size={36} color="#dc2626" />
                </Animated.View>
              </Animated.View>

              {/* Title */}
              <Text
                style={{
                  color: "#111827",
                  fontSize: 24,
                  fontWeight: "800",
                  textAlign: "center",
                  marginBottom: 12,
                  letterSpacing: -0.5,
                }}
              >
                Confirm Logout
              </Text>

              {/* Message */}
              <Text
                style={{
                  color: "#4b5563",
                  fontSize: 16,
                  textAlign: "center",
                  marginBottom: 32,
                  lineHeight: 24,
                  fontWeight: "500",
                }}
              >
                Are you sure you want to sign out?{"\n"}
                <Text
                  style={{
                    color: "#6b7280",
                    fontSize: 14,
                    fontWeight: "400",
                  }}
                >
                  You'll need to login again to access your account.
                </Text>
              </Text>

              {/* Buttons */}
              <View style={{ flexDirection: "row", gap: 16 }}>
                {/* Cancel Button */}
                <View style={{ flex: 1 }}>
                  <Pressable
                    style={{
                      paddingVertical: 18,
                      paddingHorizontal: 24,
                      borderRadius: 20,
                      backgroundColor: "#f3f4f6",
                      borderWidth: 1,
                      borderColor: "#d1d5db",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={handleCancel}
                    android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  >
                    <Text
                      style={{
                        color: "#000000",
                        fontSize: 16,
                        fontWeight: "bold",
                        textAlign: "center",
                        letterSpacing: 0.5,
                        includeFontPadding: false,
                        textAlignVertical: "center",
                      }}
                    >
                      Cancel
                    </Text>
                  </Pressable>
                </View>

                {/* Confirm Button */}
                <View style={{ flex: 1 }}>
                  <Pressable
                    style={{
                      paddingVertical: 18,
                      paddingHorizontal: 24,
                      borderRadius: 20,
                      backgroundColor: "#ef4444",
                      shadowColor: "#ef4444",
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      elevation: 8,
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                    onPress={handleConfirm}
                    android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    <Text
                      style={{
                        color: "#FFFFFF",
                        fontSize: 16,
                        fontWeight: "bold",
                        textAlign: "center",
                        letterSpacing: 0.5,
                        includeFontPadding: false,
                        textAlignVertical: "center",
                      }}
                    >
                      Logout
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Security Badge */}
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: 20,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: "rgba(0, 0, 0, 0.1)",
                }}
              >
                <Shield size={16} color="#10b981" />
                <Text
                  style={{
                    color: "#10b981",
                    fontSize: 12,
                    fontWeight: "600",
                    marginLeft: 6,
                    letterSpacing: 0.5,
                  }}
                >
                  Secure Logout
                </Text>
              </View>
            </View>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
};

export default LogoutConfirmationDialog;
