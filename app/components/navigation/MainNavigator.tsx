import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  BackHandler,
  StatusBar,
  PanResponder,
} from "react-native";
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
import TransferOrderScreen from "../../screens/TransferOrderScreen";
import ReturnOrderScreen from "../../screens/ReturnOrderScreen";
import DeliveryStageDetailsScreen from "../../screens/DeliveryStageDetailsScreen";
import PickupStageDetailsScreen, {
  PickupStage,
} from "../../screens/PickupStageDetailsScreen";
import TaskStageDetailsScreen, {
  TaskStage,
} from "../../screens/TaskStageDetailsScreen";
import { PickupOrder } from "../../services/pickupOrderService";
import { Task } from "../../services/taskService";
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
      { duration: 200 },
      (finished) => {
        if (finished) {
          runOnJS(setIsDrawerOpen)(!isDrawerOpen);
        }
      }
    );
  };

  const closeDrawer = () => {
    drawerProgress.value = withTiming(0, { duration: 180 }, (finished) => {
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

  // Handle Android back button for main app
  useEffect(() => {
    const backAction = () => {
      console.log(
        "🔙 Back button pressed in main app, standalone route:",
        standaloneRoute
      );

      if (standaloneRoute) {
        // If we're in a standalone route (details screen), close it
        setStandaloneRoute(null);
        return true;
      } else if (isDrawerOpen) {
        // If drawer is open, close it
        toggleDrawer();
        return true;
      } else {
        // If we're on main screen, let the parent handle it (show exit confirmation)
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [standaloneRoute, isDrawerOpen]);

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
    opacity: interpolate(
      drawerProgress.value,
      [0, 0.1, 1],
      [0, 0.3, 0.5],
      "clamp"
    ),
  }));

  const onNavigate = (route: string) => {
    if (route === "wallet") {
      setStandaloneRoute("wallet");
      closeDrawer();
      return;
    }

    if (route === "transfer") {
      setStandaloneRoute("transfer");
      closeDrawer();
      return;
    }

    if (route === "return") {
      setStandaloneRoute("return");
      closeDrawer();
      return;
    }

    // Clear any standalone screen and map drawer routes to bottom tabs
    setStandaloneRoute(null);
    const routeToTab: Record<string, string> = {
      home: "home",
      deliveries: "my deliveries",
      notifications: "notifications",
    };
    const tabId = routeToTab[route];
    if (tabId && tabsRef.current) {
      tabsRef.current.selectTab(tabId);
    }
    closeDrawer();
  };

  const navigateToDeliveryStage = (orderData: any, currentStage: any) => {
    setStandaloneRoute("delivery-stage");
    setStandaloneRouteData({ orderData, currentStage });
  };

  const navigateToPickupStage = (
    orderData: PickupOrder,
    currentStage: PickupStage
  ) => {
    setStandaloneRoute("pickup-stage");
    setStandaloneRouteData({ orderData, currentStage });
  };

  const navigateToTaskStage = (taskData: Task, currentStage: TaskStage) => {
    setStandaloneRoute("task-stage");
    setStandaloneRouteData({ taskData, currentStage });
  };

  const [standaloneRouteData, setStandaloneRouteData] = useState<any>(null);

  // Pan responder for swipe-to-open drawer gesture on main content - DISABLED
  const mainContentPanResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: () => false,
    onPanResponderMove: () => {},
    onPanResponderRelease: () => {},
  });

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4F46E5" />
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
            style={[
              backdropStyle,
              {
                zIndex: 5,
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              },
            ]}
            pointerEvents={isDrawerOpen ? "box-none" : "none"}
          >
            <StyledPressable
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
              onPress={() => {
                console.log("🎯 Backdrop touched - closing drawer");
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                closeDrawer();
              }}
              onPressIn={() => console.log("🎯 Backdrop press in")}
              onPressOut={() => console.log("🎯 Backdrop press out")}
            />
          </StyledAnimatedView>

          <StyledAnimatedView
            className="flex-1 bg-primary-500 overflow-hidden"
            style={animatedMainStyle}
            {...mainContentPanResponder.panHandlers}
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
            ) : standaloneRoute === "transfer" ? (
              <StyledView style={{ width: 40, height: 40 }} />
            ) : standaloneRoute === "delivery-stage" ? (
              <StyledView style={{ width: 40, height: 40 }} />
            ) : standaloneRoute === "pickup-stage" ? (
              <StyledView style={{ width: 40, height: 40 }} />
            ) : standaloneRoute === "task-stage" ? (
              <StyledView style={{ width: 40, height: 40 }} />
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
            ) : standaloneRoute === "transfer" ? (
              <TransferOrderScreen onBack={handleBackFromStandalone} />
            ) : standaloneRoute === "return" ? (
              <ReturnOrderScreen onBack={handleBackFromStandalone} />
            ) : standaloneRoute === "delivery-stage" ? (
              <DeliveryStageDetailsScreen
                orderData={standaloneRouteData?.orderData}
                currentStage={standaloneRouteData?.currentStage}
                onBack={handleBackFromStandalone}
                onStageChange={(newStage) => {
                  setStandaloneRouteData((prev: any) => ({
                    ...prev,
                    currentStage: newStage,
                  }));
                }}
              />
            ) : standaloneRoute === "pickup-stage" ? (
              <PickupStageDetailsScreen
                orderData={standaloneRouteData?.orderData}
                currentStage={standaloneRouteData?.currentStage}
                onBack={handleBackFromStandalone}
                onStageChange={(newStage) => {
                  setStandaloneRouteData((prev: any) => ({
                    ...prev,
                    currentStage: newStage,
                  }));
                }}
              />
            ) : standaloneRoute === "task-stage" ? (
              <TaskStageDetailsScreen
                taskData={standaloneRouteData?.taskData}
                currentStage={standaloneRouteData?.currentStage}
                onBack={handleBackFromStandalone}
                onStageChange={(newStage) => {
                  setStandaloneRouteData((prev: any) => ({
                    ...prev,
                    currentStage: newStage,
                  }));
                }}
              />
            ) : (
              <BottomTabNavigator
                ref={tabsRef}
                navigateToDeliveryStage={navigateToDeliveryStage}
                navigateToPickupStage={navigateToPickupStage}
                navigateToTaskStage={navigateToTaskStage}
              />
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
