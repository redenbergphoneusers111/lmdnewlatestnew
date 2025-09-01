import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  FadeInDown,
} from 'react-native-reanimated';
import { 
  TrendingUp, 
  DollarSign, 
  Clock, 
  MapPin,
  Calendar,
  Award,
  Target,
  BarChart3
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AnimatedHeader from '../components/ui/AnimatedHeader';

interface DashboardScreenProps {
  onMenuPress: () => void;
}

interface MetricCard {
  id: string;
  title: string;
  value: string;
  subtitle: string;
  icon: React.ComponentType<any>;
  color: string;
  trend?: string;
}

const dashboardMetrics: MetricCard[] = [
  { id: '1', title: 'Today\'s Earnings', value: '$342.75', subtitle: '+12% from yesterday', icon: DollarSign, color: '#43C337', trend: 'up' },
  { id: '2', title: 'Deliveries Done', value: '28', subtitle: 'Out of 32 assigned', icon: Target, color: '#6C63FF' },
  { id: '3', title: 'Average Time', value: '18 min', subtitle: 'Per delivery', icon: Clock, color: '#6C93E5' },
  { id: '4', title: 'Distance Covered', value: '124 km', subtitle: 'Today\'s total', icon: MapPin, color: '#E8B73A' },
];

const weeklyData = [
  { day: 'Mon', earnings: 280 }, { day: 'Tue', earnings: 340 }, { day: 'Wed', earnings: 290 },
  { day: 'Thu', earnings: 410 }, { day: 'Fri', earnings: 380 }, { day: 'Sat', earnings: 450 },
  { day: 'Sun', earnings: 320 },
];

const DashboardScreen: React.FC<DashboardScreenProps> = ({ onMenuPress }) => {
  const handleMetricPress = (metric: MetricCard) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const maxEarnings = Math.max(...weeklyData.map(d => d.earnings));

  return (
    <LinearGradient colors={['#6C63FF', '#5b54d9']} className="flex-1">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 96 }}
      >
        <AnimatedHeader 
            onMenuPress={onMenuPress}
            title="Dashboard"
            subtitle="Your performance overview"
        />

        <View className="px-6 mb-6">
          <View className="flex-row flex-wrap justify-between">
            {dashboardMetrics.map((metric, index) => (
              <Animated.View
                key={metric.id}
                entering={FadeInUp.delay(400 + (index * 100)).duration(500)}
                className="w-[48%] mb-4"
              >
                <Pressable
                  className="bg-white/20 rounded-2xl p-4 active:bg-white/30"
                  onPress={() => handleMetricPress(metric)}
                  android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                >
                  <View className="flex-row items-center justify-between mb-3">
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: metric.color + '30' }}>
                      <metric.icon size={20} color={metric.color} />
                    </View>
                    {metric.trend && <TrendingUp size={16} color="#43C337" />}
                  </View>
                  <Text className="text-white font-nunito font-bold text-2xl mb-1">{metric.value}</Text>
                  <Text className="text-white/70 font-nunito text-xs mb-1">{metric.title}</Text>
                  <Text className="text-white/60 font-nunito text-xs">{metric.subtitle}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </View>

        <Animated.View 
          entering={FadeInUp.delay(800).duration(600)}
          className="bg-card mx-6 rounded-2xl shadow-lg mb-6"
        >
          <View className="px-5 py-4 border-b border-gray-100">
            <Text className="text-text-primary font-nunito font-semibold text-lg mb-1">Weekly Performance</Text>
            <Text className="text-text-muted font-nunito text-sm">Earnings this week</Text>
          </View>
          <View className="px-5 py-6">
            <View className="flex-row items-end justify-between h-32 mb-4">
              {weeklyData.map((data, index) => {
                const barHeight = (data.earnings / maxEarnings) * 100;
                return (
                  <Animated.View
                    key={data.day}
                    entering={FadeInUp.delay(1000 + (index * 100)).duration(500)}
                    className="items-center flex-1"
                  >
                    <View className="w-full items-center mb-2">
                      <View className="w-6 bg-primary-500 rounded-t-sm" style={{ height: `${barHeight}%` }} />
                    </View>
                    <Text className="text-text-muted font-nunito text-xs">{data.day}</Text>
                  </Animated.View>
                );
              })}
            </View>
          </View>
        </Animated.View>

        <Animated.View 
          entering={FadeInUp.delay(1200).duration(600)}
          className="bg-card mx-6 rounded-2xl shadow-lg"
        >
          <View className="px-5 py-4 border-b border-gray-100">
            <Text className="text-text-primary font-nunito font-semibold text-lg">Quick Actions</Text>
          </View>
          <View className="px-5 py-4">
            <Pressable className="flex-row items-center py-3 active:bg-gray-50 rounded-lg" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} android_ripple={{ color: '#f9fafb' }}>
              <BarChart3 size={20} color="#6C63FF" />
              <Text className="text-text-primary font-nunito font-medium text-base ml-3">View Detailed Analytics</Text>
            </Pressable>
            <Pressable className="flex-row items-center py-3 active:bg-gray-50 rounded-lg" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} android_ripple={{ color: '#f9fafb' }}>
              <Calendar size={20} color="#6C63FF" />
              <Text className="text-text-primary font-nunito font-medium text-base ml-3">Schedule Management</Text>
            </Pressable>
            <Pressable className="flex-row items-center py-3 active:bg-gray-50 rounded-lg" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} android_ripple={{ color: '#f9fafb' }}>
              <Award size={20} color="#6C63FF" />
              <Text className="text-text-primary font-nunito font-medium text-base ml-3">Achievement Center</Text>
            </Pressable>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default DashboardScreen;
