import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { ArrowRightLeft } from 'lucide-react-native';

const TransferOrderScreen: React.FC = () => {
  return (
    <LinearGradient colors={['#6C63FF', '#5b54d9']} className="flex-1">
      <ScrollView className="flex-1 px-6 pt-12">
        <Animated.View entering={FadeInUp.duration(600)} className="items-center mt-20">
          <ArrowRightLeft size={80} color="#FFFFFF" />
          <Text className="text-white font-nunito font-bold text-2xl mt-6 text-center">
            Transfer Order
          </Text>
          <Text className="text-white/80 font-nunito text-base mt-2 text-center">
            Transfer orders between drivers
          </Text>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
};

export default TransferOrderScreen;
