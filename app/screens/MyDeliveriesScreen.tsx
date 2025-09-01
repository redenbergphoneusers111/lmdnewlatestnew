import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import {
  Package,
  Utensils,
  FileText,
  ShoppingBasket,
  Gift,
  Pill
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AnimatedHeader from '../components/ui/AnimatedHeader';

interface MyDeliveriesScreenProps {
  onMenuPress: () => void;
}

interface Category {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  colors: readonly [string, string, ...string[]];
}

const categories: Category[] = [
  { id: '1', title: 'Packages', icon: Package, colors: ['#8E2DE2', '#4A00E0'] },
  { id: '2', title: 'Food', icon: Utensils, colors: ['#F97794', '#623AA2'] },
  { id: '3', title: 'Documents', icon: FileText, colors: ['#00c6ff', '#0072ff'] },
  { id: '4', title: 'Groceries', icon: ShoppingBasket, colors: ['#11998e', '#38ef7d'] },
  { id: '5', title: 'Gifts', icon: Gift, colors: ['#fd746c', '#ff9068'] },
  { id: '6', title: 'Pharmacy', icon: Pill, colors: ['#4e54c8', '#8f94fb'] },
];

const MyDeliveriesScreen: React.FC<MyDeliveriesScreenProps> = ({ onMenuPress }) => {

  const handleCategoryPress = (category: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Navigate to a detailed category screen or perform an action
  };

  return (
      <LinearGradient colors={['#6C63FF', '#5b54d9']} className="flex-1">
        <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
        >
          <AnimatedHeader
              onMenuPress={onMenuPress}
              title="Categories"
              subtitle="Select a delivery type"
          />

          <View className="px-6 py-4">
            <View className="flex-row flex-wrap justify-between">
              {categories.map((category, index) => (
                  <Animated.View
                      key={category.id}
                      entering={FadeInUp.delay(300 + (index * 100)).duration(600)}
                      className="w-[48%] mb-5"
                  >
                    <Pressable
                        onPress={() => handleCategoryPress(category)}
                        className="rounded-2xl shadow-lg"
                    >
                      <LinearGradient
                          colors={category.colors}
                          className="h-40 rounded-2xl p-4 justify-between items-start"
                      >
                        <View className="bg-white/20 p-3 rounded-full">
                          <category.icon size={24} color="#FFFFFF" />
                        </View>
                        <Text className="text-white font-nunito font-bold text-lg">
                          {category.title}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>
              ))}
            </View>
          </View>
        </ScrollView>
      </LinearGradient>
  );
};

export default MyDeliveriesScreen;
