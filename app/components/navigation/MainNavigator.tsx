import React, { useState, useRef } from "react";
import { View, Text, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { Menu, LogOut, ArrowLeft } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { styled } from "nativewind";
import AnimatedDrawer from "./AnimatedDrawer";
import BottomTabNavigator, { BottomTabHandle } from "./BottomTabNavigator";
import WalletScreen from "../../screens/WalletScreen";
import LogoutConfirmationDialog from "../ui/LogoutConfirmationDialog";

// Styled components with NativeWind
const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledAnimatedView = styled(Animated.View);

interface MainNavigatorProps {
  onLogout: () => void;
}

const MainNavigator: React.FC<MainNavigatorProps> = ({ onLogout }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const drawerProgress = useSharedValue(0);
  const tabsRef = useRef<BottomTabHandle>(null);
  const [standaloneRoute, setStandaloneRoute] = useState<string | null>(null);

  const toggleDrawer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const targetValue = isDrawerOpen ? 0 : 1;
    drawerProgress.value = withTiming(
      targetValue,
      { duration: 280 },
      (finished) => {
        if (finished) {
          runOnJS(setIsDrawerOpen)(!isDrawerOpen);
        }
      }
    );
  };

  const closeDrawer = () => {
    drawerProgress.value = withTiming(0, { duration: 240 }, (finished) => {
      if (finished) runOnJS(setIsDrawerOpen)(false);
    });
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    onLogout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  const handleBackFromStandalone = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setStandaloneRoute(null);
  };

  const animatedMainStyle = useAnimatedStyle(() => {
    const scale = interpolate(drawerProgress.value, [0, 1], [1, 0.88]);
    const translateX = interpolate(drawerProgress.value, [0, 1], [0, 280]);
    const borderRadius = interpolate(drawerProgress.value, [0, 1], [0, 24]);

    return {
      transform: [{ scale }, { translateX }],
      borderRadius,
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(drawerProgress.value, [0, 1], [0, 0.5]),
    pointerEvents: drawerProgress.value > 0 ? ("auto" as any) : ("none" as any),
  }));

  const onNavigate = (route: string) => {
    if (route === "wallet") {
      setStandaloneRoute("wallet");
      closeDrawer();
      return;
    }

    // Clear any standalone screen and map drawer routes to bottom tabs
    setStandaloneRoute(null);
    const routeToTab: Record<string, string> = {
      home: "home",
      deliveries: "my deliveries",
      notifications: "notifications",
      transfer: "home",
      return: "home",
    };
    const tabId = routeToTab[route];
    if (tabId && tabsRef.current) {
      tabsRef.current.selectTab(tabId);
    }
    closeDrawer();
  };

  return (
    <>
      <StyledSafeAreaView className="flex-1 bg-primary-500">
        <StyledView className="flex-1">
          <AnimatedDrawer
            isOpen={isDrawerOpen}
            onClose={closeDrawer}
            drawerProgress={drawerProgress}
            onNavigate={onNavigate}
            onLogout={handleLogout}
          />
          {/* Backdrop */}
          <StyledAnimatedView
            className="absolute inset-0 bg-black"
            style={backdropStyle}
          >
            <StyledPressable className="flex-1" onPress={closeDrawer} />
          </StyledAnimatedView>

          <StyledAnimatedView
            className="flex-1 bg-primary-500 overflow-hidden"
            style={animatedMainStyle}
          >
            {standaloneRoute === "wallet" ? (
              <StyledView className="flex-row items-center justify-between px-6 pt-4 pb-2">
                <StyledView className="flex-row items-center">
                  <StyledPressable
                    className="w-10 h-10 items-center justify-center rounded-lg active:bg-white/20"
                    onPress={handleBackFromStandalone}
                    android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    <ArrowLeft size={24} color="#FFFFFF" />
                  </StyledPressable>
                  <StyledText className="text-white text-xl font-bold ml-2">
                    Wallet
                  </StyledText>
                </StyledView>
                <StyledView style={{ width: 40, height: 40 }} />
              </StyledView>
            ) : (
              <StyledView className="flex-row items-center justify-between px-6 pt-4 pb-2">
                <StyledView className="flex-row items-center">
                  <StyledPressable
                    className="w-10 h-10 items-center justify-center rounded-lg active:bg-white/20"
                    onPress={toggleDrawer}
                    android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                  >
                    <Menu size={24} color="#FFFFFF" />
                  </StyledPressable>
                  <StyledText className="text-white text-xl font-bold ml-2">
                    Dashboard
                  </StyledText>
                </StyledView>

                {/* Logout Button */}
                <StyledPressable
                  className="w-10 h-10 items-center justify-center rounded-lg active:bg-white/20"
                  onPress={handleLogout}
                  android_ripple={{ color: "rgba(255,255,255,0.2)" }}
                >
                  <LogOut size={24} color="#FFFFFF" />
                </StyledPressable>
              </StyledView>
            )}
            {standaloneRoute === "wallet" ? (
              <WalletScreen />
            ) : (
              <BottomTabNavigator ref={tabsRef} />
            )}
          </StyledAnimatedView>
        </StyledView>
      </StyledSafeAreaView>

      {/* Logout Confirmation Dialog - Outside main container for proper positioning */}
      <LogoutConfirmationDialog
        isVisible={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </>
  );
};

// @ts-ignore
export default MainNavigator;
