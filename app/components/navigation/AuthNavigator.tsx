import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { styled } from "nativewind";
import SplashScreen from "../../screens/SplashScreen";
import ServerSetupScreen from "../../screens/ServerSetupScreen";
import ServerListScreen from "../../screens/ServerListScreen";
import LoginScreen from "../../screens/LoginScreen";
import VehicleSelectionScreen from "../../screens/VehicleSelectionScreen";
import { StorageManager } from "../../utils/storage";
import { useAuth } from "../../contexts/AuthContext";

const StyledView = styled(View);

type AuthScreen =
  | "splash"
  | "serverSetup"
  | "serverList"
  | "login"
  | "vehicleSelection";

interface AuthNavigatorProps {
  onAuthComplete: () => void;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>("splash");
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [hasCheckedInitialState, setHasCheckedInitialState] = useState(false);
  const { refreshAuthState, completeAuthentication } = useAuth();

  useEffect(() => {
    // Always start with splash screen for a brief moment
    const timer = setTimeout(() => {
      checkInitialState();
    }, 1500); // Show splash for 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  const checkInitialState = async () => {
    try {
      console.log("🔍 Checking initial app state...");
      const firstTimeSetup = await StorageManager.isFirstTimeSetup();
      const userAuth = await StorageManager.getUserAuth();
      const servers = await StorageManager.getServerConfigs();
      const selectedVehicle = await StorageManager.getSelectedVehicle();

      console.log("📊 Initial state:", {
        firstTimeSetup,
        isLoggedIn: userAuth.isLoggedIn,
        serverCount: servers.length,
        hasSelectedVehicle: !!selectedVehicle,
      });

      setIsFirstTime(firstTimeSetup);
      setHasCheckedInitialState(true);

      if (userAuth.isLoggedIn && servers.length > 0) {
        // User is already logged in and has servers
        console.log("👤 User previously logged in, refreshing auth state...");
        await refreshAuthState();

        if (selectedVehicle) {
          // Vehicle already selected - go to main app
          console.log("🚗 Vehicle already selected, going to main app");
          // Finish splash and go to main app
          handleSplashFinish();
          onAuthComplete();
        } else {
          // No vehicle selected - go to vehicle selection
          console.log("🚗 No vehicle selected, going to vehicle selection");
          // Finish splash and go to vehicle selection
          handleSplashFinish();
          setCurrentScreen("vehicleSelection");
        }
      } else {
        // First time or not logged in - go to login after splash
        console.log("🆕 First time or not logged in, going to login");
        // Finish splash and go to login
        handleSplashFinish();
        setCurrentScreen("login");
      }
    } catch (error) {
      console.error("❌ Error checking initial state:", error);
      // Finish splash and go to login on error
      handleSplashFinish();
      setCurrentScreen("login");
    }
  };

  const handleSplashFinish = () => {
    console.log("🌊 Splash screen finished");
    if (hasCheckedInitialState) {
      // Initial state already checked, screen should already be set
      console.log("📋 Initial state already checked, screen should be set");
      return;
    }
    // Auto-finish case - go to login
    console.log("🆕 Auto-finish splash, going to login");
    setCurrentScreen("login");
  };

  const handleServerSetupComplete = async () => {
    // Refresh auth state to ensure the new server is properly loaded
    await refreshAuthState();
    setCurrentScreen("serverList");
  };

  const handleServerListBack = () => {
    setCurrentScreen("serverSetup");
  };

  const handleServerSelected = async () => {
    // After selecting a server, go back to login
    await refreshAuthState();
    setCurrentScreen("login");
  };

  const handleServerListCreateNew = () => {
    setCurrentScreen("serverSetup");
  };

  const handleLoginSuccess = async () => {
    console.log("🎯 Login successful, navigating to vehicle selection");
    await refreshAuthState();
    setCurrentScreen("vehicleSelection");
  };

  const handleVehicleSelected = async () => {
    console.log("🎯 Vehicle selected, completing authentication");
    await refreshAuthState();
    completeAuthentication();
    onAuthComplete();
  };

  const handleLoginServerConfig = () => {
    setCurrentScreen("serverList");
  };

  const handleServerListBackToLogin = () => {
    setCurrentScreen("login");
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case "splash":
        return (
          <SplashScreen
            onFinish={handleSplashFinish}
            autoFinish={!hasCheckedInitialState}
          />
        );

      case "serverSetup":
        return (
          <ServerSetupScreen
            onBack={handleServerListBackToLogin}
            onServerSaved={handleServerSetupComplete}
          />
        );

      case "serverList":
        return (
          <ServerListScreen
            onBack={handleServerListBackToLogin}
            onServerSelected={handleServerSelected}
            onCreateNew={handleServerListCreateNew}
          />
        );

      case "login":
        return (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onServerConfig={handleLoginServerConfig}
          />
        );

      case "vehicleSelection":
        return (
          <VehicleSelectionScreen onVehicleSelected={handleVehicleSelected} />
        );

      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  return <StyledView className="flex-1">{renderScreen()}</StyledView>;
};

export default AuthNavigator;
