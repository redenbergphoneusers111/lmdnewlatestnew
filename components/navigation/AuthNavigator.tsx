import React, { useState, useEffect } from "react";
import { View } from "react-native";
import { styled } from "nativewind";
import SplashScreen from "../../screens/SplashScreen";
import ServerSetupScreen from "../../screens/ServerSetupScreen";
import ServerListScreen from "../../screens/ServerListScreen";
import LoginScreen from "../../screens/LoginScreen";
import { StorageManager } from "../../utils/storage";
import { useAuth } from "../../contexts/AuthContext";

const StyledView = styled(View);

type AuthScreen = "splash" | "serverSetup" | "serverList" | "login";

interface AuthNavigatorProps {
  onAuthComplete: () => void;
}

const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthComplete }) => {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>("splash");
  const [isFirstTime, setIsFirstTime] = useState(true);
  const { refreshAuthState } = useAuth();

  useEffect(() => {
    checkInitialState();
  }, []);

  const checkInitialState = async () => {
    try {
      const firstTimeSetup = await StorageManager.isFirstTimeSetup();
      const userAuth = await StorageManager.getUserAuth();
      const servers = await StorageManager.getServerConfigs();

      setIsFirstTime(firstTimeSetup);

      if (userAuth.isLoggedIn && servers.length > 0) {
        // User is already logged in and has servers - go to main app
        await refreshAuthState();
        onAuthComplete();
      } else {
        // Always start with splash, then go to login
        setCurrentScreen("splash");
      }
    } catch (error) {
      console.error("Error checking initial state:", error);
      setCurrentScreen("splash");
    }
  };

  const handleSplashFinish = () => {
    // Always go to login after splash
    setCurrentScreen("login");
  };

  const handleServerSetupComplete = () => {
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
    await refreshAuthState();
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
        return <SplashScreen onFinish={handleSplashFinish} />;

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

      default:
        return <SplashScreen onFinish={handleSplashFinish} />;
    }
  };

  return <StyledView className="flex-1">{renderScreen()}</StyledView>;
};

export default AuthNavigator;
