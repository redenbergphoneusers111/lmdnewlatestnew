import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInLeft } from 'react-native-reanimated';

interface AnimatedHeaderProps {
    title?: string;
    subtitle?: string;
    onMenuPress?: () => void;
}

const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({
                                                           title,
                                                           subtitle
                                                       }) => {
    return (
        <View className="px-6 pt-2 pb-6">
            <Animated.View entering={FadeInLeft.delay(200).duration(600)}>
                <View>
                    {title && (
                        <Text className="text-white font-nunito-bold text-xl">{title}</Text>
                    )}
                    {subtitle && (
                        <Text className="text-white/80 font-nunito text-sm">{subtitle}</Text>
                    )}
                </View>
            </Animated.View>
        </View>
    );
};

export default AnimatedHeader;