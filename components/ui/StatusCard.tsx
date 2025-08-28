import React, { useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withSpring,
  withDelay
} from 'react-native-reanimated';
import { Svg, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

interface StatusCardProps {
  count: number;
  label: string;
  color: string;
  delay?: number;
}

const StatusCard: React.FC<StatusCardProps> = ({ count, label, color, delay = 0 }) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const circleProgress = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 15 }));
    circleProgress.value = withDelay(delay + 200, withTiming(1, { duration: 800 }));
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
        className="bg-white rounded-xl p-6 shadow-lg active:shadow-xl"
        onPress={handlePress}
        android_ripple={{ color: '#f0f0ff' }}
      >
        {/* Circular Progress */}
        <View className="items-center mb-4">
          <View className="relative" style={{ width: 60, height: 60 }}>
            <Svg width={60} height={60} className="transform -rotate-90">
              <Circle
                cx={30}
                cy={30}
                r={25}
                stroke="#f3f4f6"
                strokeWidth={4}
                fill="none"
              />
              <Animated.View style={animatedCircleStyle}>
                <Circle
                  cx={30}
                  cy={30}
                  r={25}
                  stroke={color}
                  strokeWidth={4}
                  fill="none"
                  strokeDasharray={`${(count / 30) * 157} 157`}
                  strokeLinecap="round"
                />
              </Animated.View>
            </Svg>
            <View style={styles.countContainer}>
              <Text 
                style={[
                  styles.countText,
                  { color },
                ]}
                className="font-nunito font-bold"
              >
                {count}
              </Text>
            </View>
          </View>
        </View>

        {/* Label */}
        <Text 
          className="text-center font-nunito font-semibold text-base"
          style={{ color }}
        >
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  countContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countText: {
    fontSize: 24,
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    padding: 0,
  },
});

export default StatusCard;