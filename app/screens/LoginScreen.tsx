import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import {
  User,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Server,
  AlertCircle,
  CheckCircle,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import AsyncStorage from "@react-native-async-storage/async-storage";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onServerConfig: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onServerConfig,
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, activeServer, isLoading: authLoading } = useAuth();

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert(
        "Validation Error",
        "Please enter both username and password"
      );
      return;
    }

    if (!activeServer) {
      Alert.alert(
        "No Active Server",
        "Please configure and select a server first"
      );
      return;
    }

    setIsLoading(true);
    try {
      const success = await login(username.trim(), password.trim());

      if (success) {
        onLoginSuccess();
      } else {
        Alert.alert("Login Failed", "Invalid credentials or server error. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      Alert.alert(
        "Login Error",
        "Failed to connect to server. Please check your server configuration."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getFullServerUrl = () => {
    if (!activeServer) return "";
    return `${activeServer.protocol}://${activeServer.baseUrl}:${activeServer.port}`;
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-indigo-600">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <LinearGradient
          colors={["#4F46E5", "#7C3AED", "#EC4899"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="h-60"
        >
          <StyledView className="flex-1 items-center justify-center px-8">
            <StyledView className="w-20 h-20 bg-white/90 rounded-full items-center justify-center mb-4">
              <Image
                source={require("../../assets/lmdlogo.png")}
                style={{ width: 64, height: 64 }}
                resizeMode="contain"
              />
            </StyledView>
            <StyledText className="text-white text-2xl font-bold text-center">
              Welcome Back
            </StyledText>
            <StyledText className="text-white/80 text-center mt-2">
              Sign in to your delivery agent account
            </StyledText>
          </StyledView>
        </LinearGradient>

        <StyledScrollView className="flex-1 px-6 -mt-8">
          {/* Server Status Card */}
          <StyledView className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <StyledView className="flex-row items-center justify-between mb-4">
              <StyledText className="text-lg font-semibold text-gray-800">
                Server Status
              </StyledText>
              <StyledPressable
                onPress={onServerConfig}
                className="flex-row items-center bg-indigo-100 rounded-lg px-3 py-2 active:bg-indigo-200"
              >
                <Server size={16} color="#4F46E5" />
                <StyledText className="text-indigo-600 font-medium ml-2">
                  Configure
                </StyledText>
              </StyledPressable>
            </StyledView>

            {activeServer ? (
              <StyledView className="bg-green-50 border border-green-200 rounded-lg p-4">
                <StyledView className="flex-row items-center">
                  <CheckCircle size={20} color="#059669" />
                  <StyledText className="text-green-800 font-medium ml-2">
                    Connected to: {activeServer.name}
                  </StyledText>
                </StyledView>
                <StyledText className="text-green-700 text-sm mt-2">
                  {getFullServerUrl()}
                </StyledText>
              </StyledView>
            ) : (
              <StyledView className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <StyledView className="flex-row items-center">
                  <AlertCircle size={20} color="#D97706" />
                  <StyledText className="text-yellow-800 font-medium ml-2">
                    No active server configured
                  </StyledText>
                </StyledView>
                <StyledText className="text-yellow-700 text-sm mt-2">
                  Please configure a server to continue
                </StyledText>
              </StyledView>
            )}
          </StyledView>

          {/* Login Form */}
          <StyledView className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <StyledText className="text-lg font-semibold text-gray-800 mb-6">
              Login Details
            </StyledText>

            {/* Username */}
            <StyledView className="mb-4">
              <StyledText className="text-gray-700 font-medium mb-2">
                Username
              </StyledText>
              <StyledView className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                <User size={20} color="#6B7280" />
                <StyledTextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter your username"
                  className="flex-1 ml-3 text-gray-800"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </StyledView>
            </StyledView>

            {/* Password */}
            <StyledView className="mb-6">
              <StyledText className="text-gray-700 font-medium mb-2">
                Password
              </StyledText>
              <StyledView className="flex-row items-center border border-gray-300 rounded-lg px-4 py-3">
                <Lock size={20} color="#6B7280" />
                <StyledTextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  className="flex-1 ml-3 text-gray-800"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <StyledPressable
                  onPress={() => setShowPassword(!showPassword)}
                  className="p-1"
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#6B7280" />
                  ) : (
                    <Eye size={20} color="#6B7280" />
                  )}
                </StyledPressable>
              </StyledView>
            </StyledView>

            {/* Login Button */}
            <StyledPressable
              onPress={handleLogin}
              disabled={isLoading || !activeServer}
              className={`rounded-lg py-4 items-center ${
                isLoading || !activeServer
                  ? "bg-gray-300"
                  : "bg-indigo-600 active:bg-indigo-700"
              }`}
            >
              <StyledView className="flex-row items-center">
                <LogIn
                  size={20}
                  color={isLoading || !activeServer ? "#9CA3AF" : "#FFFFFF"}
                />
                <StyledText
                  className={`font-semibold ml-2 ${
                    isLoading || !activeServer ? "text-gray-500" : "text-white"
                  }`}
                >
                  {isLoading ? "Signing In..." : "Sign In"}
                </StyledText>
              </StyledView>
            </StyledPressable>

            {!activeServer && (
              <StyledText className="text-red-500 text-sm text-center mt-3">
                Please configure a server before logging in
              </StyledText>
            )}
          </StyledView>

          {/* Help Text */}
          <StyledView className="bg-blue-50 rounded-lg p-4 mb-6">
            <StyledText className="text-blue-800 text-sm leading-5">
              💡 <StyledText className="font-semibold">Need help?</StyledText>{" "}
              If you&apos;re having trouble connecting, check your server
              configuration or contact your system administrator.
            </StyledText>
          </StyledView>
        </StyledScrollView>
      </KeyboardAvoidingView>
    </StyledSafeAreaView>
  );
};

export default LoginScreen;
