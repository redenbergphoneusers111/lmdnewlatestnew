import React, { useState, forwardRef, useImperativeHandle } from "react";
import { View, Pressable } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { Home, History, Bell, Grid3X3, User } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { styled } from "nativewind";

// Screens
import HomeScreen from "../../screens/HomeScreen";
import DeliveryStatusScreen from "../../screens/DeliveryStatusScreen";
import NotificationsScreen from "../../screens/NotificationsScreen";
import ProfileScreen from "../../screens/ProfileScreen";
import DashboardScreen from "../../screens/DashboardScreen";
import WalletScreen from "../../screens/WalletScreen";
import RecentOrdersScreen from "../../screens/RecentOrdersScreen";

const StyledView = styled(View);
const StyledPressable = styled(Pressable);
const StyledAnimatedView = styled(Animated.View);
const StyledBlurView = styled(BlurView);

interface TabItem {
  id: string;
  icon: React.ComponentType<any>;
  screen: React.ComponentType<any>;
}

export interface BottomTabHandle {
  selectTab: (tabId: string) => void;
}

const tabs: TabItem[] = [
  { id: "home", icon: Home, screen: HomeScreen },
  { id: "recent order", icon: History, screen: RecentOrdersScreen },
  { id: "my deliveries", icon: Grid3X3, screen: DeliveryStatusScreen },
  { id: "notifications", icon: Bell, screen: NotificationsScreen },
  { id: "profile", icon: User, screen: ProfileScreen },
];

const BottomTabNavigator = forwardRef<BottomTabHandle>((props, ref) => {
  const [activeTab, setActiveTab] = useState("home");
  const tabAnimations = tabs.map(() => useSharedValue(0));

  useImperativeHandle(ref, () => ({
    selectTab: (tabId: string) => {
      const index = tabs.findIndex((t) => t.id === tabId);
      if (index !== -1) {
        setActiveTab(tabId);
        tabAnimations.forEach((anim) => (anim.value = 0));
        tabAnimations[index].value = withSpring(1);
      }
    },
  }));

  const handleTabPress = (tabId: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveTab(tabId);
    tabAnimations.forEach((anim) => (anim.value = 0));
    tabAnimations[index].value = withSpring(1);
  };

  const CurrentScreen =
    tabs.find((tab) => tab.id === activeTab)?.screen || HomeScreen;

  return (
    <StyledView className="flex-1">
      {/* Screen Content */}
      <StyledView className="flex-1">
        <CurrentScreen />
      </StyledView>

      {/* Bottom Tab Bar */}
      <StyledView className="absolute bottom-0 left-0 right-0">
        <StyledBlurView intensity={80} tint="light" className="px-0">
          <StyledView className="flex-row items-center justify-around py-3 bg-white/90">
            {tabs.map((tab, index) => {
              const isActive =
                tabs.find((t) => t.id === activeTab)?.id === tab.id;
              const animatedStyle = useAnimatedStyle(() => ({
                transform: [{ scale: withSpring(isActive ? 1.2 : 1) }],
              }));

              return (
                <StyledPressable
                  key={tab.id}
                  className="items-center justify-center w-16 h-12 rounded-xl active:bg-primary-50"
                  onPress={() => handleTabPress(tab.id, index)}
                  android_ripple={{ color: "#f0f0ff" }}
                >
                  <StyledAnimatedView style={animatedStyle}>
                    <tab.icon
                      size={24}
                      color={isActive ? "#6C63FF" : "#ACB1C0"}
                    />
                  </StyledAnimatedView>
                </StyledPressable>
              );
            })}
          </StyledView>
        </StyledBlurView>
      </StyledView>
    </StyledView>
  );
});

export default BottomTabNavigator;
