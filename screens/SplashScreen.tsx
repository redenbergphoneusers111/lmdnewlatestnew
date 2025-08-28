import React, { useEffect } from "react";
import { View, Text, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";

const { width, height } = Dimensions.get("window");

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledAnimatedView = styled(Animated.View);

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);
  const textTranslateY = useSharedValue(50);

  useEffect(() => {
    // Animate logo
    logoScale.value = withSequence(
      withTiming(1.2, { duration: 800 }),
      withTiming(1, { duration: 400 })
    );
    logoOpacity.value = withTiming(1, { duration: 600 });

    // Animate text
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(400, withTiming(0, { duration: 600 }));

    // Finish splash after animation
    const timer = setTimeout(() => {
      runOnJS(onFinish)();
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const textAnimatedStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    transform: [{ translateY: textTranslateY.value }],
  }));

  return (
    <StyledSafeAreaView className="flex-1">
      <LinearGradient
        colors={["#4F46E5", "#7C3AED", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="flex-1"
      >
        <StyledView className="flex-1 items-center justify-center px-8">
          {/* Logo */}
          <StyledAnimatedView
            className="w-32 h-32 bg-white/20 rounded-full items-center justify-center mb-8"
            style={logoAnimatedStyle}
          >
            <StyledView className="w-20 h-20 bg-white rounded-full items-center justify-center">
              <StyledText className="text-4xl font-bold text-indigo-600">
                🚚
              </StyledText>
            </StyledView>
          </StyledAnimatedView>

          {/* App Name */}
          <StyledAnimatedView style={textAnimatedStyle}>
            <StyledText className="text-white text-4xl font-bold text-center mb-2">
              Delivery Pro
            </StyledText>
            <StyledText className="text-white/80 text-lg text-center">
              Fast & Reliable Delivery Service
            </StyledText>
          </StyledAnimatedView>

          {/* Loading Indicator */}
          <StyledView className="absolute bottom-20">
            <StyledView className="flex-row space-x-2">
              {[0, 1, 2].map((index) => (
                <StyledView
                  key={index}
                  className="w-3 h-3 bg-white/60 rounded-full"
                  style={{
                    opacity: 0.6,
                  }}
                />
              ))}
            </StyledView>
          </StyledView>
        </StyledView>
      </LinearGradient>
    </StyledSafeAreaView>
  );
};

export default SplashScreen;
