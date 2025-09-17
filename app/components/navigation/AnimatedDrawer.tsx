import React from "react";
import { View, Text, Pressable, PanResponder } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  SharedValue,
  runOnJS,
} from "react-native-reanimated";
import {
  Home,
  Package,
  Bell,
  ArrowRightLeft,
  Wallet,
  RotateCcw,
  LogOut,
  User,
  Truck,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useAuth } from "../../contexts/AuthContext";

interface DrawerItem {
  id: string;
  title: string;
  icon: React.ComponentType<any>;
  route: string;
}

interface AnimatedDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drawerProgress: SharedValue<number>;
  onNavigate?: (route: string) => void;
  onLogout: () => void;
}

const drawerItems: DrawerItem[] = [
  { id: "1", title: "Home", icon: Home, route: "home" },
  { id: "2", title: "My Deliveries", icon: Package, route: "deliveries" },
  { id: "3", title: "Notifications", icon: Bell, route: "notifications" },
  { id: "4", title: "Transfer Order", icon: ArrowRightLeft, route: "transfer" },
  { id: "5", title: "Wallet", icon: Wallet, route: "wallet" },
  { id: "6", title: "Return Order", icon: RotateCcw, route: "return" },
];

const AnimatedDrawer: React.FC<AnimatedDrawerProps> = ({
  isOpen,
  onClose,
  drawerProgress,
  onNavigate,
}) => {
  const { user, userDetails, selectedVehicle } = useAuth();

  // Pan responder for swipe-to-close gesture
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => isOpen,
    onMoveShouldSetPanResponder: (_, gestureState) => {
      // Only respond to horizontal swipes when drawer is open
      return isOpen && Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
    },
    onPanResponderMove: (_, gestureState) => {
      if (isOpen && gestureState.dx < 0) {
        // Swiping left (closing direction)
        const progress = Math.max(0, Math.min(1, 1 + gestureState.dx / 280));
        drawerProgress.value = progress;
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (isOpen) {
        if (gestureState.dx < -50 || gestureState.vx < -0.5) {
          // Swipe left with enough distance or velocity - close drawer
          runOnJS(onClose)();
        } else {
          // Snap back to open position
          drawerProgress.value = withTiming(1, { duration: 150 });
        }
      }
    },
  });
  const animatedDrawerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(drawerProgress.value, [0, 1], [-280, 0]);
    return {
      transform: [{ translateX }],
    };
  });

  const getItemAnimatedStyle = (index: number) =>
    useAnimatedStyle(() => {
      const t = drawerProgress.value; // 0..1
      // create a slight stagger based on index
      const offset = Math.min(1, Math.max(0, t - index * 0.06));
      const opacity = offset;
      const translateX = interpolate(offset, [0, 1], [-40, 0]);
      return { opacity, transform: [{ translateX }] };
    });

  const handleItemPress = (route: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onNavigate?.(route);
    onClose();
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClose();
  };

  return (
    <Animated.View
      className="absolute top-0 left-0 w-70 h-full bg-white z-20"
      style={[animatedDrawerStyle, { width: 280 }]}
      {...panResponder.panHandlers}
    >
      <View className="flex-1 pt-16 px-6">
        {/* Profile Section */}
        <View className="mb-8">
          <View className="w-16 h-16 bg-primary-100 rounded-full items-center justify-center mb-4">
            <User size={32} color="#6C63FF" />
          </View>
          <Text className="text-text-primary font-nunito font-bold text-xl">
            Admin
          </Text>
          {selectedVehicle && (
            <Text className="text-text-muted font-nunito text-sm">
              {selectedVehicle.vehicleNo} - {selectedVehicle.driverName}
            </Text>
          )}
        </View>

        {/* Menu Items */}
        <View className="flex-1">
          {drawerItems.map((item, index) => {
            const itemStyle = getItemAnimatedStyle(index);
            return (
              <Animated.View key={item.id} style={itemStyle}>
                <Pressable
                  className="flex-row items-center py-4 px-4 rounded-xl mb-2 active:bg-primary-50"
                  onPress={() => handleItemPress(item.route)}
                  android_ripple={{ color: "#f0f0ff" }}
                >
                  <item.icon size={24} color="#6C63FF" />
                  <Text className="text-text-primary font-nunito font-semibold text-base ml-4">
                    {item.title}
                  </Text>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        {/* Logout */}
        <Animated.View
          style={getItemAnimatedStyle(drawerItems.length)}
          className="border-t border-gray-200 pt-6"
        >
          <Pressable
            className="flex-row items-center py-4 px-4 rounded-xl active:bg-red-50"
            onPress={handleLogout}
            android_ripple={{ color: "#fee2e2" }}
          >
            <LogOut size={24} color="#FF2D55" />
            <Text className="text-status-cancelled font-nunito font-semibold text-base ml-4">
              Logout
            </Text>
          </Pressable>
        </Animated.View>
      </View>
    </Animated.View>
  );
};

export default AnimatedDrawer;
