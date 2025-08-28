import React from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface DeliveryItemProps {
  name: string;
  amount: string;
  status: 'delivered' | 'cancelled' | 'pending';
  note?: string;
  isLast?: boolean;
}

const statusColors = {
  delivered: '#43C337',
  cancelled: '#FF2D55',
  pending: '#6C93E5',
};

const statusLabels = {
  delivered: 'Delivered',
  cancelled: 'Cancelled',
  pending: 'Pending',
};

const DeliveryItem: React.FC<DeliveryItemProps> = ({ 
  name, 
  amount, 
  status, 
  note, 
  isLast = false 
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

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        className="py-4 active:bg-gray-50 rounded-lg"
        onPress={handlePress}
        android_ripple={{ color: '#f9fafb' }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1">
            <Text className="text-text-primary font-sf-display font-bold text-base mb-1">
              {name}
            </Text>
            <Text 
              className="font-nunito font-normal text-base"
              style={{ color: statusColors[status] }}
            >
              {statusLabels[status]}
            </Text>
          </View>
          
          <View className="items-end">
            {amount ? (
              <Text className="text-text-primary font-nunito font-semibold text-base">
                {amount}
              </Text>
            ) : note ? (
              <Text className="text-text-secondary font-nunito font-semibold text-xs uppercase tracking-wider">
                {note}
              </Text>
            ) : null}
          </View>
        </View>
        
        {!isLast && (
          <View className="h-px bg-background mt-4" />
        )}
      </Pressable>
    </Animated.View>
  );
};

export default DeliveryItem;
