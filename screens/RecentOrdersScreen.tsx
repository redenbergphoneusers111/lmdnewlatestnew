import React, { useState, useMemo, useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInUp,
    FadeInDown,
    Layout,
    SequencedTransition,
} from 'react-native-reanimated';
import {
    Package,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    Filter,
    Truck
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

import AnimatedHeader from '../components/ui/AnimatedHeader';
import FilterModal from '../components/ui/FilterModal';

type FilterStatus = 'all' | 'completed' | 'in-progress' | 'started';

interface DeliveryRecord {
    id: string;
    customerName: string;
    address: string;
    amount: string;
    status: 'completed' | 'in-progress' | 'started';
    time: string;
    distance: string;
}

const allDeliveryRecords: DeliveryRecord[] = [
    { id: '1', customerName: 'Sarah Johnson', address: '123 Oak Street', amount: '$45.80', status: 'completed', time: '2:30 PM', distance: '3.2 km' },
    { id: '2', customerName: 'Mike Chen', address: '456 Pine Avenue', amount: '$67.25', status: 'in-progress', time: '3:45 PM', distance: '5.1 km' },
    { id: '3', customerName: 'Emily Davis', address: '789 Maple Road', amount: '$32.50', status: 'started', time: '4:15 PM', distance: '2.8 km' },
    { id: '4', customerName: 'James Wilson', address: '321 Elm Street', amount: '$89.75', status: 'completed', time: '5:00 PM', distance: '4.5 km' },
    { id: '5', customerName: 'Lisa Anderson', address: '654 Cedar Lane', amount: '$28.00', status: 'in-progress', time: '5:30 PM', distance: '6.2 km' },
    { id: '6', customerName: 'David Brown', address: '987 Birch Drive', amount: '$55.40', status: 'started', time: '6:00 PM', distance: '3.9 km' },
    { id: '7', customerName: 'Jessica Miller', address: '159 Spruce Way', amount: '$112.00', status: 'completed', time: '1:00 PM', distance: '7.8 km' },
];

const statusConfig = {
    completed: { icon: CheckCircle, color: '#43C337', label: 'Completed' },
    'in-progress': { icon: Truck, color: '#E8B73A', label: 'In Progress' },
    started: { icon: Clock, color: '#6C93E5', label: 'Started' },
};

interface RecentOrdersScreenProps {
    onMenuPress: () => void;
}

const RecentOrdersScreen: React.FC<RecentOrdersScreenProps> = ({ onMenuPress }) => {
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);
    const [activeFilter, setActiveFilter] = useState<FilterStatus>('all');

    const filteredRecords = useMemo(() => {
        if (activeFilter === 'all') {
            return allDeliveryRecords;
        }
        return allDeliveryRecords.filter(record => record.status === activeFilter);
    }, [activeFilter]);

    const stats = useMemo(() => {
        return [
            { id: 'all', title: 'All', count: allDeliveryRecords.length, color: '#6C63FF' },
            { id: 'completed', title: 'Completed', count: allDeliveryRecords.filter(r => r.status === 'completed').length, color: '#43C337' },
            { id: 'in-progress', title: 'In Progress', count: allDeliveryRecords.filter(r => r.status === 'in-progress').length, color: '#E8B73A' },
            { id: 'started', title: 'Started', count: allDeliveryRecords.filter(r => r.status === 'started').length, color: '#6C93E5' },
        ];
    }, []);

    return (
        <>
            <LinearGradient colors={['#6C63FF', '#5b54d9']} className="flex-1">
                <ScrollView
                    className="flex-1"
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={{ paddingBottom: 80 }}
                >
                    <AnimatedHeader
                        onMenuPress={onMenuPress}
                        title="Recent Orders"
                        subtitle="Track your delivery history"
                    />

                    {/* Stats Bar */}
                    <View className="pl-6 mb-6">
                        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                            {stats.map((stat, index) => (
                                <Animated.View
                                    key={stat.id}
                                    entering={FadeInUp.delay(400 + (index * 100)).duration(500)}
                                >
                                    <Pressable
                                        onPress={() => setActiveFilter(stat.id as FilterStatus)}
                                        className={`p-4 rounded-xl mr-3 ${activeFilter === stat.id ? 'bg-white' : 'bg-white/20'}`}
                                    >
                                        <Text className={`font-nunito font-bold text-xl mb-1 ${activeFilter === stat.id ? 'text-primary-500' : 'text-white'}`}>
                                            {stat.count}
                                        </Text>
                                        <Text className={`font-nunito text-sm ${activeFilter === stat.id ? 'text-text-secondary' : 'text-white/80'}`}>
                                            {stat.title}
                                        </Text>
                                    </Pressable>
                                </Animated.View>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Delivery Records */}
                    <Animated.View
                        layout={SequencedTransition.delay(300)}
                        className="bg-card mx-6 rounded-2xl shadow-lg"
                    >
                        <View className="flex-row items-center justify-between px-5 py-4 border-b border-gray-100">
                            <Text className="text-text-primary font-nunito font-semibold text-lg">
                                {filteredRecords.length} Orders Found
                            </Text>
                            <Pressable
                                className="bg-primary-50 p-2 rounded-lg active:bg-primary-100"
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setFilterModalVisible(true);
                                }}
                                android_ripple={{ color: '#e4e4ff' }}
                            >
                                <Filter size={20} color="#6C63FF" />
                            </Pressable>
                        </View>

                        <View className="px-5 py-2">
                            {filteredRecords.map((delivery, index) => {
                                const config = statusConfig[delivery.status];
                                return (
                                    <Animated.View
                                        key={delivery.id}
                                        layout={Layout.springify()}
                                        entering={FadeInDown.delay(index * 50).duration(400)}
                                        exiting={FadeInDown.duration(200)}
                                    >
                                        <Pressable
                                            className="py-4 active:bg-gray-50 rounded-lg"
                                            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                            android_ripple={{ color: '#f9fafb' }}
                                        >
                                            <View className="flex-row items-start">
                                                <View
                                                    className="w-12 h-12 rounded-full items-center justify-center mr-4 mt-1"
                                                    style={{ backgroundColor: config.color + '20' }}
                                                >
                                                    <config.icon size={20} color={config.color} />
                                                </View>
                                                <View className="flex-1">
                                                    <View className="flex-row items-center justify-between mb-2">
                                                        <Text className="text-text-primary font-sf-display font-bold text-base">
                                                            {delivery.customerName}
                                                        </Text>
                                                        <Text className="text-text-primary font-nunito font-semibold text-base">
                                                            {delivery.amount}
                                                        </Text>
                                                    </View>
                                                    <View className="flex-row items-center mb-2">
                                                        <MapPin size={14} color="#ACB1C0" />
                                                        <Text className="text-text-secondary font-nunito text-sm ml-1 flex-1">
                                                            {delivery.address}
                                                        </Text>
                                                    </View>
                                                    <View className="flex-row items-center justify-between">
                                                        <View className="flex-row items-center">
                                                            <Clock size={12} color="#ACB1C0" />
                                                            <Text className="text-text-muted font-nunito text-xs ml-1">{delivery.time}</Text>
                                                            <Text className="text-text-muted font-nunito text-xs ml-4">{delivery.distance}</Text>
                                                        </View>
                                                        <View className="px-3 py-1 rounded-full" style={{ backgroundColor: config.color + '20' }}>
                                                            <Text className="font-nunito font-semibold text-xs capitalize" style={{ color: config.color }}>
                                                                {config.label}
                                                            </Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            </View>
                                            {index !== filteredRecords.length - 1 && (
                                                <View className="h-px bg-background mt-4 ml-16" />
                                            )}
                                        </Pressable>
                                    </Animated.View>
                                );
                            })}
                        </View>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>
            <FilterModal
                isVisible={isFilterModalVisible}
                onClose={() => setFilterModalVisible(false)}
                activeFilter={activeFilter}
                onFilterChange={setActiveFilter}
            />
        </>
    );
};

export default RecentOrdersScreen;
