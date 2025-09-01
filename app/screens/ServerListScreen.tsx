import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import {
  ArrowLeft,
  Plus,
  Server,
  CheckCircle,
  Circle,
  Trash2,
  Edit,
  Globe,
  Settings,
  Loader,
} from "lucide-react-native";
import { StorageManager, ServerConfig } from "../utils/storage";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);

interface ServerListScreenProps {
  onBack: () => void;
  onServerSelected: () => void;
  onCreateNew: () => void;
}

const ServerListScreen: React.FC<ServerListScreenProps> = ({
  onBack,
  onServerSelected,
  onCreateNew,
}) => {
  const [servers, setServers] = useState<ServerConfig[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activatingServer, setActivatingServer] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    try {
      const configs = await StorageManager.getServerConfigs();
      setServers(configs);
    } catch (error) {
      console.error("Error loading servers:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadServers();
    setRefreshing(false);
  };

  const handleServerSelect = async (serverId: string) => {
    try {
      setActivatingServer(serverId);

      // First, set all servers as inactive
      const updatedConfigs = servers.map((config) => ({
        ...config,
        isActive: false,
      }));

      // Then set the selected server as active
      const updatedConfigsWithActive = updatedConfigs.map((config) => ({
        ...config,
        isActive: config.id === serverId,
      }));

      // Save all updated configs
      await StorageManager.setActiveServer(serverId);

      // Reload servers to reflect changes
      await loadServers();

      // Show success message
      Alert.alert("Success", "Server activated successfully!", [
        { text: "OK", onPress: onServerSelected },
      ]);
    } catch (error) {
      console.error("Error selecting server:", error);
      Alert.alert("Error", "Failed to select server. Please try again.");
    } finally {
      setActivatingServer(null);
    }
  };

  const handleDeleteServer = async (serverId: string, serverName: string) => {
    Alert.alert(
      "Delete Server",
      `Are you sure you want to delete "${serverName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await StorageManager.deleteServerConfig(serverId);
              await loadServers();
              Alert.alert("Success", "Server deleted successfully");
            } catch (error) {
              Alert.alert(
                "Error",
                "Failed to delete server. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  const getFullUrl = (server: ServerConfig) => {
    return `${server.protocol}://${server.baseUrl}:${server.port}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <StyledSafeAreaView className="flex-1 bg-gray-50">
      <LinearGradient
        colors={["#4F46E5", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        className="h-32"
      >
        <StyledView className="flex-row items-center justify-between px-6 pt-4">
          <StyledView className="flex-row items-center">
            <StyledPressable
              onPress={onBack}
              className="w-10 h-10 items-center justify-center rounded-lg active:bg-white/20"
            >
              <ArrowLeft size={24} color="#FFFFFF" />
            </StyledPressable>
            <StyledText className="text-white text-xl font-bold ml-4">
              Server List
            </StyledText>
          </StyledView>
          <StyledPressable
            onPress={onCreateNew}
            className="w-10 h-10 bg-white/20 rounded-lg items-center justify-center active:bg-white/30"
          >
            <Plus size={24} color="#FFFFFF" />
          </StyledPressable>
        </StyledView>
      </LinearGradient>

      <StyledScrollView
        className="flex-1 px-6 -mt-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {servers.length === 0 ? (
          <StyledView className="bg-white rounded-2xl shadow-lg p-8 items-center">
            <StyledView className="w-20 h-20 bg-gray-100 rounded-full items-center justify-center mb-4">
              <Server size={32} color="#9CA3AF" />
            </StyledView>
            <StyledText className="text-gray-600 text-lg font-medium mb-2">
              No Servers Found
            </StyledText>
            <StyledText className="text-gray-500 text-center mb-6">
              You haven't configured any servers yet. Tap the + button to add
              your first server configuration.
            </StyledText>
            <StyledPressable
              onPress={onCreateNew}
              className="bg-indigo-600 rounded-lg px-6 py-3 active:bg-indigo-700"
            >
              <StyledText className="text-white font-semibold">
                Add First Server
              </StyledText>
            </StyledPressable>
          </StyledView>
        ) : (
          <>
            {/* Active Server Info */}
            <StyledView className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <StyledText className="text-lg font-semibold text-gray-800 mb-4">
                Active Server
              </StyledText>
              {servers.find((s) => s.isActive) ? (
                <StyledView className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <StyledView className="flex-row items-center justify-between">
                    <StyledView className="flex-row items-center">
                      <CheckCircle size={20} color="#059669" />
                      <StyledText className="text-green-800 font-medium ml-2">
                        {servers.find((s) => s.isActive)?.name}
                      </StyledText>
                    </StyledView>
                    <StyledText className="text-green-600 text-sm font-medium">
                      ACTIVE
                    </StyledText>
                  </StyledView>
                  <StyledText className="text-green-700 text-sm mt-2">
                    {getFullUrl(servers.find((s) => s.isActive)!)}
                  </StyledText>
                </StyledView>
              ) : (
                <StyledView className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <StyledText className="text-yellow-800 text-center">
                    No active server selected. Please select a server from the
                    list below.
                  </StyledText>
                </StyledView>
              )}
            </StyledView>

            {/* Server List */}
            <StyledView className="bg-white rounded-2xl shadow-lg p-6 mb-6">
              <StyledText className="text-lg font-semibold text-gray-800 mb-4">
                All Servers
              </StyledText>
              {servers.map((server) => (
                <StyledView key={server.id} className="mb-4 last:mb-0">
                  <StyledView className="border border-gray-200 rounded-lg p-4">
                    <StyledView className="flex-row items-center justify-between mb-3">
                      <StyledView className="flex-row items-center">
                        <StyledView className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center mr-3">
                          <Server size={20} color="#4F46E5" />
                        </StyledView>
                        <StyledView>
                          <StyledText className="text-gray-800 font-medium">
                            {server.name}
                          </StyledText>
                          <StyledText className="text-gray-500 text-sm">
                            {getFullUrl(server)}
                          </StyledText>
                        </StyledView>
                      </StyledView>
                      <StyledView className="flex-row items-center">
                        {server.isActive ? (
                          <CheckCircle size={20} color="#059669" />
                        ) : (
                          <Circle size={20} color="#D1D5DB" />
                        )}
                      </StyledView>
                    </StyledView>

                    <StyledView className="flex-row items-center justify-between">
                      <StyledView className="flex-row items-center space-x-4">
                        <StyledView className="flex-row items-center">
                          <Globe size={16} color="#6B7280" />
                          <StyledText className="text-gray-600 text-sm ml-1">
                            {server.protocol.toUpperCase()}
                          </StyledText>
                        </StyledView>
                        {/* <StyledText className="text-gray-400 text-sm">
                          Added {formatDate(server.createdAt)}
                        </StyledText> */}
                      </StyledView>

                      <StyledView className="flex-row items-center space-x-2">
                        {!server.isActive && (
                          <StyledPressable
                            onPress={() => handleServerSelect(server.id)}
                            disabled={activatingServer === server.id}
                            className={`rounded-lg px-3 py-2 ${
                              activatingServer === server.id
                                ? "bg-gray-300"
                                : "bg-indigo-600 active:bg-indigo-700"
                            }`}
                          >
                            <StyledView className="flex-row items-center">
                              {activatingServer === server.id ? (
                                <Loader
                                  size={16}
                                  color="#6B7280"
                                  className="animate-spin"
                                />
                              ) : (
                                <StyledText className="text-white text-sm font-medium">
                                  Activate
                                </StyledText>
                              )}
                            </StyledView>
                          </StyledPressable>
                        )}
                        <StyledPressable
                          onPress={() =>
                            handleDeleteServer(server.id, server.name)
                          }
                          className="bg-red-100 rounded-lg p-2 active:bg-red-200"
                        >
                          <Trash2 size={16} color="#DC2626" />
                        </StyledPressable>
                      </StyledView>
                    </StyledView>
                  </StyledView>
                </StyledView>
              ))}
            </StyledView>
          </>
        )}
      </StyledScrollView>
    </StyledSafeAreaView>
  );
};

export default ServerListScreen;
