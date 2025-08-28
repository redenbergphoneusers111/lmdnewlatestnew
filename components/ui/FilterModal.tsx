import React from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import Animated, { useAnimatedStyle, withTiming, FadeIn, FadeOut } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

type FilterStatus = 'all' | 'completed' | 'in-progress' | 'started';

interface FilterModalProps {
    isVisible: boolean;
    onClose: () => void;
    activeFilter: FilterStatus;
    onFilterChange: (filter: FilterStatus) => void;
}

const filterOptions: { label: string; value: FilterStatus }[] = [
    { label: 'All Orders', value: 'all' },
    { label: 'Completed', value: 'completed' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Started', value: 'started' },
];

const FilterModal: React.FC<FilterModalProps> = ({
                                                     isVisible,
                                                     onClose,
                                                     activeFilter,
                                                     onFilterChange,
                                                 }) => {
    const animatedContainerStyle = useAnimatedStyle(() => ({
        transform: [{ translateY: withTiming(isVisible ? 0 : 300, { duration: 300 }) }],
    }));

    const handleFilterPress = (filter: FilterStatus) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onFilterChange(filter);
        onClose();
    };

    return (
        <Modal transparent visible={isVisible} onRequestClose={onClose} animationType="none">
            <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(300)} className="flex-1">
                <Pressable className="flex-1" onPress={onClose}>
                    <BlurView intensity={20} tint="dark" className="absolute inset-0" />
                </Pressable>
            </Animated.View>

            <Animated.View
                style={animatedContainerStyle}
                className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-6"
            >
                <View className="items-center mb-6">
                    <View className="w-10 h-1 bg-gray-200 rounded-full" />
                </View>
                <Text className="text-text-primary font-nunito font-bold text-xl mb-4">Filter Orders</Text>

                {filterOptions.map((option, index) => {
                    const isActive = activeFilter === option.value;
                    return (
                        <Pressable
                            key={option.value}
                            onPress={() => handleFilterPress(option.value)}
                            className={`py-4 px-4 rounded-xl mb-2 ${isActive ? 'bg-primary-50' : 'active:bg-gray-100'}`}
                            android_ripple={{ color: '#f0f0ff' }}
                        >
                            <Text className={`font-nunito font-semibold text-base ${isActive ? 'text-primary-500' : 'text-text-primary'}`}>
                                {option.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </Animated.View>
        </Modal>
    );
};

export default FilterModal;
