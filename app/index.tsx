import React, { useEffect } from "react";
import { View, BackHandler, Alert } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainNavigator from "./components/navigation/MainNavigator";
import AuthNavigator from "./components/navigation/AuthNavigator";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import locationService from "./services/locationService";

function AppContent() {
  const { isAuthenticated, logout, selectedVehicle } = useAuth();

  useEffect(() => {
    console.log("🔄 App state changed:", {
      isAuthenticated,
      hasVehicle: !!selectedVehicle,
    });

    // Start location tracking when user is authenticated and has selected a vehicle
    if (isAuthenticated && selectedVehicle) {
      console.log("📍 Starting location tracking...");
      locationService.startTracking().catch((error) => {
        console.error("❌ Failed to start location tracking:", error);
      });
    } else {
      // Stop tracking if user logs out or no vehicle selected
      console.log("📍 Stopping location tracking...");
      locationService.stopTracking().catch((error) => {
        console.error("❌ Failed to stop location tracking:", error);
      });
    }
  }, [isAuthenticated, selectedVehicle]);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (isAuthenticated) {
        // If user is authenticated, show exit confirmation
        Alert.alert("Exit App", "Are you sure you want to exit the app?", [
          {
            text: "Cancel",
            onPress: () => null,
            style: "cancel",
          },
          {
            text: "Exit",
            onPress: () => BackHandler.exitApp(),
            style: "destructive",
          },
        ]);
        return true; // Prevent default behavior
      } else {
        // If not authenticated, allow default behavior (exit app)
        return false;
      }
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, [isAuthenticated]);

  return (
    <View className="flex-1">
      {isAuthenticated ? (
        <>
          {console.log("🏠 Rendering Main Navigator")}
          <MainNavigator onLogout={logout} />
        </>
      ) : (
        <>
          {console.log("🔐 Rendering Auth Navigator")}
          <AuthNavigator onAuthComplete={() => {}} />
        </>
      )}
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
