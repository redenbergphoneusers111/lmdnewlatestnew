import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { ArrowLeft, Save, Server, Globe, Settings } from "lucide-react-native";
import { StorageManager, ServerConfig } from "../utils/storage";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTextInput = styled(TextInput);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

interface ServerSetupScreenProps {
  onBack: () => void;
  onServerSaved: () => void;
}

const ServerSetupScreen: React.FC<ServerSetupScreenProps> = ({
  onBack,
  onServerSaved,
}) => {
  const [serverName, setServerName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [port, setPort] = useState("");
  const [protocol, setProtocol] = useState<"http" | "https">("https");
  const [isLoading, setIsLoading] = useState(false);

  // Minimal page opening animation
  const pageOpacity = useSharedValue(0);
  const pageTranslateY = useSharedValue(20);

  useEffect(() => {
    // Simple page opening animation
    pageOpacity.value = withTiming(1, { duration: 500 });
    pageTranslateY.value = withTiming(0, { duration: 500 });
  }, []);

  // Animated style for page opening
  const pageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: pageOpacity.value,
    transform: [{ translateY: pageTranslateY.value }],
  }));

  const handleSave = async () => {
    if (!serverName.trim() || !baseUrl.trim() || !port.trim()) {
      Alert.alert("Validation Error", "Please fill in all fields");
      return;
    }

    if (!baseUrl.match(/^[a-zA-Z0-9.-]+$/)) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid base URL (e.g., api.example.com)"
      );
      return;
    }

    if (!port.match(/^\d+$/) || parseInt(port) < 1 || parseInt(port) > 65535) {
      Alert.alert(
        "Validation Error",
        "Please enter a valid port number (1-65535)"
      );
      return;
    }

    setIsLoading(true);
    try {
      const newConfig: Omit<ServerConfig, "id" | "createdAt"> = {
        name: serverName.trim(),
        baseUrl: baseUrl.trim(),
        port: port.trim(),
        protocol,
        isActive: true, // New server will be active
      };

      // Save the new server configuration
      const savedConfig = await StorageManager.saveServerConfig(newConfig);
      console.log("✅ Server saved:", savedConfig);

      // Set this server as the active one (this will deactivate others)
      await StorageManager.setActiveServer(savedConfig.id);
      console.log("✅ Server set as active:", savedConfig.id);

      // Verify the server is active
      const activeServer = await StorageManager.getActiveServer();
      console.log("✅ Active server after setting:", activeServer);

      Alert.alert("Success", "Server configuration saved successfully!", [
        { text: "OK", onPress: onServerSaved },
      ]);
    } catch (error) {
      Alert.alert(
        "Error",
        "Failed to save server configuration. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const toggleProtocol = () => {
    setProtocol((prev) => (prev === "http" ? "https" : "http"));
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-gray-50">
      <StyledAnimatedView style={[{ flex: 1 }, pageAnimatedStyle]}>
        <LinearGradient
          colors={["#4F46E5", "#7C3AED"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          className="h-32"
        >
          <StyledView className="flex-row items-center px-6 pt-4">
            <StyledPressable
              onPress={onBack}
              className="w-10 h-10 items-center justify-center rounded-lg active:bg-white/20"
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </StyledPressable>
            <StyledText className="text-white text-xl font-bold ml-4">
              Server Setup
            </StyledText>
          </StyledView>
        </LinearGradient>

        <StyledScrollView className="flex-1 px-6 -mt-8">
          <StyledView className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <StyledView className="flex-row items-center mb-6">
              <StyledView className="w-12 h-12 bg-indigo-100 rounded-full items-center justify-center mr-4">
                <Server size={24} color="#4F46E5" />
              </StyledView>
              <StyledView>
                <StyledText className="text-lg font-semibold text-gray-800">
                  Server Configuration
                </StyledText>
                <StyledText className="text-gray-500">
                  Configure your delivery server
                </StyledText>
              </StyledView>
            </StyledView>

            {/* Server Name */}
            <StyledView className="mb-4">
              <StyledText className="text-gray-700 font-medium mb-2">
                Server Name
              </StyledText>
              <StyledTextInput
                value={serverName}
                onChangeText={setServerName}
                placeholder="e.g., Production Server"
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
              />
            </StyledView>

            {/* Base URL */}
            <StyledView className="mb-4">
              <StyledText className="text-gray-700 font-medium mb-2">
                Base URL
              </StyledText>
              <StyledTextInput
                value={baseUrl}
                onChangeText={setBaseUrl}
                placeholder="e.g., api.example.com"
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </StyledView>

            {/* Port */}
            <StyledView className="mb-4">
              <StyledText className="text-gray-700 font-medium mb-2">
                Port
              </StyledText>
              <StyledTextInput
                value={port}
                onChangeText={setPort}
                placeholder="e.g., 8080"
                className="border border-gray-300 rounded-lg px-4 py-3 text-gray-800"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
              />
            </StyledView>

            {/* Protocol */}
            <StyledView className="mb-6">
              <StyledText className="text-gray-700 font-medium mb-2">
                Protocol
              </StyledText>
              <StyledPressable
                onPress={toggleProtocol}
                className="flex-row items-center justify-between border border-gray-300 rounded-lg px-4 py-3 active:bg-gray-50"
              >
                <StyledView className="flex-row items-center">
                  <Globe size={20} color="#6B7280" />
                  <StyledText className="text-gray-800 ml-2">
                    {protocol.toUpperCase()}
                  </StyledText>
                </StyledView>
                <Settings size={20} color="#6B7280" />
              </StyledPressable>
            </StyledView>

            {/* Save Button */}
            <StyledPressable
              onPress={handleSave}
              disabled={isLoading}
              className={`bg-indigo-600 rounded-lg py-4 items-center ${
                isLoading ? "opacity-50" : "active:bg-indigo-700"
              }`}
            >
              <StyledView className="flex-row items-center">
                <Save size={20} color="#FFFFFF" />
                <StyledText className="text-white font-semibold ml-2">
                  {isLoading ? "Saving..." : "Save Configuration"}
                </StyledText>
              </StyledView>
            </StyledPressable>
          </StyledView>

          {/* Help Text */}
          <StyledView className="bg-blue-50 rounded-lg p-4 mb-6">
            <StyledText className="text-blue-800 text-sm leading-5">
              💡 <StyledText className="font-semibold">Tip:</StyledText> Make
              sure your server is accessible and the credentials are correct.
              You can always modify these settings later from the server list.
            </StyledText>
          </StyledView>
        </StyledScrollView>
      </StyledAnimatedView>
    </StyledSafeAreaView>
  );
};

export default ServerSetupScreen;
