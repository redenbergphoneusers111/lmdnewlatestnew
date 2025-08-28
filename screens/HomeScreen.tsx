import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  withDelay,
  withSpring,
  FadeInUp,
  FadeInDown
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import AnimatedHeader from '../components/ui/AnimatedHeader';
import StatusCard from '../components/ui/StatusCard';
import DeliveryItem from '../components/ui/DeliveryItem';

interface DeliveryData {
  id: string;
  name: string;
  amount: string;
  status: 'delivered' | 'cancelled' | 'pending';
  note?: string;
}

const deliveryData: DeliveryData[] = [
  { id: '1', name: 'Connor Davidson', amount: '$278.47', status: 'delivered' },
  { id: '2', name: 'Connor Davidson', amount: '$278.47', status: 'delivered' },
  { id: '3', name: 'Connor Davidson', amount: '$0', status: 'cancelled' },
  { id: '4', name: 'Connor Davidson', amount: '', status: 'pending', note: 'invalid address' },
  { id: '5', name: 'Connor Davidson', amount: '$278.47', status: 'delivered' },
  { id: '6', name: 'Connor Davidson', amount: '', status: 'pending', note: 'Bad Weather' },
];

const statusData = [
  { id: '1', count: 20, label: 'Completed', color: '#43C337' },
  { id: '2', count: 6, label: 'Postponed', color: '#E8B73A' },
  { id: '3', count: 8, label: 'Pending', color: '#6C93E5' },
  { id: '4', count: 2, label: 'Cancelled', color: '#FF2D55' },
];

const HomeScreen: React.FC = () => {
  const headerOpacity = useSharedValue(0);
  const cardsOpacity = useSharedValue(0);

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
    cardsOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
  }, []);

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const animatedCardsStyle = useAnimatedStyle(() => ({
    opacity: cardsOpacity.value,
    transform: [{ translateY: withSpring(cardsOpacity.value === 1 ? 0 : 50) }],
  }));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={['#6C63FF', '#5b54d9']}
        className="flex-1"
      >
        <ScrollView 
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 80 }}
        >

          {/* Today Section */}
          <Animated.View 
            entering={FadeInUp.delay(400).duration(600)}
            className="px-6 mb-6 mt-6"
          >
            <Text className="text-white font-nunito font-semibold text-base mb-4">
              TODAY
            </Text>
            
            {/* Status Cards Grid */}
            <Animated.View style={animatedCardsStyle}>
              <View className="flex-row flex-wrap justify-between">
                {statusData.map((status, index) => (
                  <StatusCard
                    key={status.id}
                    count={status.count}
                    label={status.label}
                    color={status.color}
                    delay={index * 100}
                  />
                ))}
              </View>
            </Animated.View>
          </Animated.View>

          {/* Recent Section */}
          <Animated.View 
            entering={FadeInUp.delay(600).duration(600)}
            className="bg-white mx-6 rounded-xl shadow-lg"
          >
            {/* Recent Header */}
            <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
              <Text className="text-text-primary font-nunito font-normal text-xs uppercase tracking-wider">
                RECENT
              </Text>
              <Pressable 
                className="px-3 py-1 rounded-md active:bg-red-50"
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                android_ripple={{ color: '#fee2e2' }}
              >
                <Text className="text-status-cancelled font-sf-display font-medium text-sm">
                  Show all
                </Text>
              </Pressable>
            </View>

            {/* Delivery Items */}
            <View className="px-5 py-2">
              {deliveryData.map((delivery, index) => (
                <Animated.View
                  key={delivery.id}
                  entering={FadeInDown.delay(800 + (index * 100)).duration(400)}
                >
                  <DeliveryItem
                    name={delivery.name}
                    amount={delivery.amount}
                    status={delivery.status}
                    note={delivery.note}
                    isLast={index === deliveryData.length - 1}
                  />
                </Animated.View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

export default HomeScreen;
