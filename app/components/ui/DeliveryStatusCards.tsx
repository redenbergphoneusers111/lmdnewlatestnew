import React from 'react';
import { View, Text, Image, Pressable, FlatList } from 'react-native';
import { styled } from 'nativewind';
import { QrCode, Search, Package, Truck, CheckCircle } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);

interface DeliveryCardData {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

const deliveryData: DeliveryCardData[] = [
  {
    id: '1',
    title: 'Picked',
    description: 'View Order Picking Details & Remarks',
    icon: Package,
  },
  {
    id: '2',
    title: 'Dispatching',
    description: 'Track delivery status and location',
    icon: Truck,
  },
  {
    id: '3',
    title: 'Confirmation',
    description: 'Verify delivery completion and feedback',
    icon: CheckCircle,
  },
];

interface DeliveryStatusCardProps {
  item: DeliveryCardData;
  onPress: (id: string) => void;
}

const DeliveryStatusCard: React.FC<DeliveryStatusCardProps> = ({ item, onPress }) => {
  return (
    <StyledPressable
      className="bg-white rounded-xl shadow-md mb-4 p-5"
      onPress={() => onPress(item.id)}
      android_ripple={{ color: '#f0f0ff' }}
    >
      <StyledView className="flex-row justify-between items-center">
        <StyledView className="flex-1 pr-4">
          <StyledText className="text-status-cancelled font-nunito font-bold text-lg mb-1">
            {item.title}
          </StyledText>
          <StyledText className="text-text-secondary font-nunito text-sm mb-4">
            {item.description}
          </StyledText>

          <StyledView className="flex-row items-center mt-2">
            <StyledPressable
              className="w-9 h-9 bg-status-cancelled/10 rounded-lg items-center justify-center mr-3"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              android_ripple={{ color: '#ffcccc' }}
            >
              <QrCode size={18} color="#FF2D55" />
            </StyledPressable>

            <StyledPressable
              className="w-9 h-9 bg-status-cancelled/10 rounded-lg items-center justify-center"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              android_ripple={{ color: '#ffcccc' }}
            >
              <Search size={18} color="#FF2D55" />
            </StyledPressable>
          </StyledView>
        </StyledView>

        <StyledView className="w-20 h-20 bg-primary-50 rounded-xl items-center justify-center">
          <item.icon size={36} color="#6C63FF" />
        </StyledView>
      </StyledView>
    </StyledPressable>
  );
};

interface DeliveryStatusCardsProps {
  onCardPress?: (id: string) => void;
}

const DeliveryStatusCards: React.FC<DeliveryStatusCardsProps> = ({ onCardPress }) => {
  const handleCardPress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onCardPress?.(id);
  };

  return (
    <StyledView className="flex-1">
      <LinearGradient
        colors={['#f8f9fa', '#ffffff']}
        className="flex-1 px-6 py-4"
      >
        <FlatList
          data={deliveryData}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DeliveryStatusCard item={item} onPress={handleCardPress} />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </StyledView>
  );
};

export default DeliveryStatusCards;
