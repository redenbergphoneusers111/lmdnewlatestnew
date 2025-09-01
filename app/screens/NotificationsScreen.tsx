import React, { useEffect } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInUp,
  FadeInDown,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay
} from 'react-native-reanimated';
import {
  Bell,
  Package,
  AlertCircle,
  CheckCircle,
  Clock,
  MessageSquare
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'delivery' | 'alert' | 'success' | 'info';
  time: string;
  isRead: boolean;
}

const notifications: Notification[] = [
  {
    id: '1',
    title: 'New Delivery Assigned',
    message: 'You have been assigned a new delivery to 123 Oak Street.',
    type: 'delivery',
    time: '5 min ago',
    isRead: false
  },
  {
    id: '2',
    title: 'Delivery Completed',
    message: 'Your delivery to Sarah Johnson has been marked as completed.',
    type: 'success',
    time: '1 hour ago',
    isRead: false
  },
  {
    id: '3',
    title: 'Route Update',
    message: 'Your delivery route has been optimized. Check the new route.',
    type: 'info',
    time: '2 hours ago',
    isRead: true
  },
  {
    id: '4',
    title: 'Payment Received',
    message: 'Payment of $278.47 has been added to your wallet.',
    type: 'success',
    time: '3 hours ago',
    isRead: true
  },
  {
    id: '5',
    title: 'Delivery Delayed',
    message: 'Delivery to Mike Chen has been delayed due to traffic.',
    type: 'alert',
    time: '5 hours ago',
    isRead: true
  },
];

const notificationIcons = {
  delivery: Package,
  alert: AlertCircle,
  success: CheckCircle,
  info: MessageSquare,
};

const notificationColors = {
  delivery: '#6C63FF',
  alert: '#E8B73A',
  success: '#43C337',
  info: '#6C93E5',
};

const NotificationsScreen: React.FC = () => {
  const headerOpacity = useSharedValue(0);
  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    headerOpacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedHeaderStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
  }));

  const handleNotificationPress = (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleMarkAllRead = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
      <LinearGradient colors={['#6C63FF', '#5b54d9']} className="flex-1">
        <ScrollView
            className="flex-1"
            showsVerticalScrollIndicator={false}
            contentContainerClassName="pb-20"
        >
          {/* Header */}
          <Animated.View style={animatedHeaderStyle} className="px-6 pt-8 pb-6">
            <View className="flex-row items-center justify-between">
              <View>
                <Text className="text-white font-nunito font-bold text-2xl mb-2">
                  Notifications
                </Text>
                <Text className="text-white/80 font-nunito text-base">
                  {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
                </Text>
              </View>

              {unreadCount > 0 && (
                  <Pressable
                      className="bg-white/20 px-4 py-2 rounded-lg active:bg-white/30"
                      onPress={handleMarkAllRead}
                      android_ripple={{ color: 'rgba(255,255,255,0.3)' }}
                  >
                    <Text className="text-white font-nunito font-semibold text-sm">
                      Mark All Read
                    </Text>
                  </Pressable>
              )}
            </View>
          </Animated.View>

          {/* Notifications List */}
          <Animated.View
              entering={FadeInUp.delay(300).duration(600)}
              className="bg-white mx-6 rounded-xl shadow-lg"
          >
            <View className="px-5 py-4 border-b border-gray-100">
              <Text className="text-text-primary font-nunito font-semibold text-lg">
                Recent Notifications
              </Text>
            </View>

            <View className="px-5 py-2">
              {notifications.map((notification, index) => {
                const NotificationIcon = notificationIcons[notification.type];
                const iconColor = notificationColors[notification.type];

                return (
                    <Animated.View
                        key={notification.id}
                        entering={FadeInDown.delay(500 + (index * 100)).duration(400)}
                    >
                      <Pressable
                          className="py-4 active:bg-gray-50 rounded-lg"
                          onPress={() => handleNotificationPress(notification)}
                          android_ripple={{ color: '#f9fafb' }}
                      >
                        <View className="flex-row items-start">
                          <View
                              className="w-10 h-10 rounded-full items-center justify-center mr-3"
                              style={{ backgroundColor: iconColor + '20' }}
                          >
                            <NotificationIcon size={20} color={iconColor} />
                          </View>

                          <View className="flex-1">
                            <View className="flex-row items-center justify-between mb-1">
                              <Text className="text-text-primary font-sf-display font-bold text-base flex-1">
                                {notification.title}
                              </Text>
                              {!notification.isRead && (
                                  <View className="w-2 h-2 bg-primary-500 rounded-full ml-2" />
                              )}
                            </View>

                            <Text className="text-text-secondary font-nunito text-sm mb-2 leading-5">
                              {notification.message}
                            </Text>

                            <View className="flex-row items-center">
                              <Clock size={12} color="#ACB1C0" />
                              <Text className="text-text-muted font-nunito text-xs ml-1">
                                {notification.time}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {index !== notifications.length - 1 && (
                            <View className="h-px bg-background mt-4" />
                        )}
                      </Pressable>
                    </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Empty State (if no notifications) */}
          {notifications.length === 0 && (
              <Animated.View
                  entering={FadeInUp.delay(400).duration(600)}
                  className="items-center mt-20"
              >
                <Bell size={80} color="rgba(255,255,255,0.3)" />
                <Text className="text-white/60 font-nunito font-semibold text-lg mt-4 text-center">
                  No notifications yet
                </Text>
                <Text className="text-white/40 font-nunito text-sm mt-2 text-center">
                  We'll notify you when something important happens
                </Text>
              </Animated.View>
          )}
        </ScrollView>
      </LinearGradient>
  );
};

export default NotificationsScreen;
