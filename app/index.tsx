import React from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import MainNavigator from "../components/navigation/MainNavigator";
import AuthNavigator from "../components/navigation/AuthNavigator";
import { AuthProvider, useAuth } from "../contexts/AuthContext";

function AppContent() {
  const { isAuthenticated, logout } = useAuth();

  return (
    <View className="flex-1">
      {isAuthenticated ? (
        <MainNavigator onLogout={logout} />
      ) : (
        <AuthNavigator onAuthComplete={() => {}} />
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
