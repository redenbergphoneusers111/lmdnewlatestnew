import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { CheckCircle2, X } from "lucide-react-native";
import * as Haptics from "expo-haptics";

interface SuccessDialogProps {
  visible: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
  type?: "success" | "confirmation";
}

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SuccessDialog: React.FC<SuccessDialogProps> = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirm",
  cancelText = "Cancel",
  showCancel = true,
  type = "success",
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotation = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    console.log(
      "SuccessDialog useEffect - visible:",
      visible,
      "title:",
      title,
      "message:",
      message
    );
    if (visible) {
      // Trigger haptic feedback
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Set initial values immediately for testing
      opacity.value = 1;
      scale.value = 1;
      iconScale.value = 1;
      iconRotation.value = 0;

      // Animate dialog appearance
      // opacity.value = withTiming(1, { duration: 300 });
      // scale.value = withSpring(1, {
      //   damping: 15,
      //   stiffness: 150,
      //   mass: 1,
      // });

      // Animate icon with delay
      // iconScale.value = withDelay(
      //   200,
      //   withSequence(
      //     withSpring(1.2, { damping: 8, stiffness: 100 }),
      //     withSpring(1, { damping: 8, stiffness: 100 })
      //   )
      // );

      // Animate icon rotation for success type
      // if (type === "success") {
      //   iconRotation.value = withDelay(400, withTiming(360, { duration: 600 }));
      // }
    } else {
      // Set values to 0 immediately for testing
      opacity.value = 0;
      scale.value = 0;
      iconScale.value = 0;
      iconRotation.value = 0;

      // Animate dialog disappearance
      // opacity.value = withTiming(0, { duration: 200 });
      // scale.value = withTiming(0, { duration: 200 });
      // iconScale.value = withTiming(0, { duration: 200 });
      // iconRotation.value = withTiming(0, { duration: 200 });
    }
  }, [visible]);

  const backgroundStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const dialogStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: `${iconRotation.value}deg` },
    ],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handleConfirm = () => {
    buttonScale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 100 }, () => {
        runOnJS(onConfirm)();
      })
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCancel = () => {
    if (onCancel) {
      buttonScale.value = withSequence(
        withTiming(0.95, { duration: 100 }),
        withTiming(1, { duration: 100 }, () => {
          runOnJS(onCancel)();
        })
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const getIconColor = () => {
    return type === "success" ? "#10b981" : "#3b82f6";
  };

  const getIconBackgroundColor = () => {
    return type === "success" ? "#dcfce7" : "#dbeafe";
  };

  const getConfirmButtonColor = () => {
    return type === "success" ? "#10b981" : "#3b82f6";
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View
        style={[
          {
            flex: 1,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 20,
          },
          backgroundStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              backgroundColor: "white",
              borderRadius: 20,
              padding: 24,
              width: screenWidth * 0.85,
              maxWidth: 400,
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 10,
              },
              shadowOpacity: 0.25,
              shadowRadius: 20,
              elevation: 10,
            },
            dialogStyle,
          ]}
        >
          {/* Close Button */}
          <Pressable
            onPress={onCancel || onConfirm}
            className="absolute top-4 right-4 w-8 h-8 items-center justify-center rounded-full active:bg-gray-100"
            style={{ zIndex: 1 }}
          >
            <X size={20} color="#6b7280" />
          </Pressable>

          {/* Icon */}
          <View className="items-center mb-6">
            <Animated.View
              style={[
                {
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: getIconBackgroundColor(),
                  alignItems: "center",
                  justifyContent: "center",
                },
                iconStyle,
              ]}
            >
              <CheckCircle2 size={40} color={getIconColor()} />
            </Animated.View>
          </View>

          {/* Title */}
          <Text className="text-2xl font-bold text-gray-900 text-center mb-3">
            {title}
          </Text>

          {/* Message */}
          <Text className="text-base text-gray-600 text-center leading-6 mb-8">
            {message}
          </Text>

          {/* Buttons */}
          <View
            className={`flex-row ${showCancel && onCancel ? "space-x-3" : ""}`}
          >
            {showCancel && onCancel && (
              <Animated.View style={[{ flex: 1 }, buttonStyle]}>
                <Pressable
                  onPress={handleCancel}
                  className="flex-1 py-4 px-6 rounded-xl border-2 border-gray-300 active:bg-gray-50"
                >
                  <Text className="text-gray-700 font-semibold text-center text-base">
                    {cancelText}
                  </Text>
                </Pressable>
              </Animated.View>
            )}

            {/* Confirm button */}
            <TouchableOpacity
              onPress={handleConfirm}
              style={{
                flex: 1,
                backgroundColor: getConfirmButtonColor(),
                paddingVertical: 12,
                paddingHorizontal: 16,
                borderRadius: 8,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  color: "white",
                  fontSize: 16,
                  fontWeight: "600",
                }}
              >
                {confirmText || "CONTINUE"}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

export default SuccessDialog;
