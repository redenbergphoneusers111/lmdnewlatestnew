import React, { useEffect } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainNavigator from "./components/navigation/MainNavigator";
import AuthNavigator from "./components/navigation/AuthNavigator";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import locationService from "./services/locationService";

function AppContent() {
  const { isAuthenticated, logout, selectedVehicle } = useAuth();

  useEffect(() => {
    console.log('🔄 App state changed:', { isAuthenticated, hasVehicle: !!selectedVehicle });

    // Start location tracking when user is authenticated and has selected a vehicle
    if (isAuthenticated && selectedVehicle) {
      console.log('📍 Starting location tracking...');
      locationService.startTracking().catch((error) => {
        console.error('❌ Failed to start location tracking:', error);
      });
    } else {
      // Stop tracking if user logs out or no vehicle selected
      console.log('📍 Stopping location tracking...');
      locationService.stopTracking().catch((error) => {
        console.error('❌ Failed to stop location tracking:', error);
      });
    }
  }, [isAuthenticated, selectedVehicle]);

  return (
    <View className="flex-1">
      {isAuthenticated ? (
        <>
          {console.log('🏠 Rendering Main Navigator')}
          <MainNavigator onLogout={logout} />
        </>
      ) : (
        <>
          {console.log('🔐 Rendering Auth Navigator')}
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
