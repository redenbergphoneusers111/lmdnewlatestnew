import React from "react";
import {
  View,
  Text,
  FlatList,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import {
  Truck,
  MapPin,
  User,
  CheckCircle,
  AlertCircle,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import { Vehicle } from "../utils/storage";
import apiService from "../services/apiService";

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);

interface VehicleSelectionScreenProps {
  onVehicleSelected: () => void;
}

const VehicleSelectionScreen: React.FC<VehicleSelectionScreenProps> = ({
  onVehicleSelected,
}) => {
  const { vehicles, selectedVehicle, selectVehicle, isLoading, userDetails } = useAuth();

  const handleVehicleSelect = async (vehicle: Vehicle) => {
    try {
      console.log('🚗 Vehicle selection initiated for:', vehicle.vehicleNo);
      
      await selectVehicle(vehicle);
      
      // Get user role for Statistics API (equivalent to Java code after vehicle selection)
      const userRole = userDetails.length > 0 ? userDetails[0].roleName : 'admin';
      console.log('👤 User Role for Statistics API:', userRole);
      
      // Call Statistics API after vehicle selection (like Java SelectVehicleActivity) new
      console.log('📊 Calling Statistics API after vehicle selection...');
      const statisticsResponse = await apiService.getStatistics(vehicle.id, userRole);
      
      if (statisticsResponse.success) {
        console.log('✅ Statistics API called successfully after vehicle selection');
      } else {
        console.warn('⚠️ Statistics API failed but continuing:', statisticsResponse.error);
      }
      
    } catch (error) {
      console.error("❌ Error selecting vehicle:", error);
      Alert.alert("Error", "Failed to select vehicle. Please try again.");
    }
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <StyledPressable
      onPress={() => handleVehicleSelect(item)}
      className={`mx-6 mb-4 rounded-2xl p-4 ${
        selectedVehicle?.id === item.id
          ? "bg-green-100 border-2 border-green-500"
          : "bg-white border border-gray-200"
      } active:bg-gray-50`}
      android_ripple={{ color: "#f3f4f6" }}
    >
      <StyledView className="flex-row items-center justify-between">
        <StyledView className="flex-row items-center flex-1">
          <StyledView className="w-12 h-12 rounded-full bg-blue-100 items-center justify-center mr-4">
            <Truck size={24} color="#3B82F6" />
          </StyledView>

          <StyledView className="flex-1">
            <StyledText className="text-lg font-semibold text-gray-800 mb-1">
              {item.vehicleNo}
            </StyledText>
            <StyledText className="text-sm text-gray-600 mb-1">
              Model: {item.vehicleModel}
            </StyledText>
            <StyledView className="flex-row items-center">
              <User size={14} color="#6B7280" />
              <StyledText className="text-sm text-gray-600 ml-1">
                {item.driverName}
              </StyledText>
            </StyledView>
          </StyledView>
        </StyledView>

        <StyledView className="items-end">
          {selectedVehicle?.id === item.id ? (
            <CheckCircle size={24} color="#10B981" />
          ) : (
            <StyledView className="w-6 h-6 rounded-full border-2 border-gray-300" />
          )}

          <StyledView className="flex-row items-center mt-2">
            <MapPin size={14} color="#6B7280" />
            <StyledText className="text-xs text-gray-500 ml-1">
              {item.whsCode}
            </StyledText>
          </StyledView>
        </StyledView>
      </StyledView>
    </StyledPressable>
  );

  if (isLoading) {
    return (
      <StyledSafeAreaView className="flex-1 bg-gray-50">
        <StyledView className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <StyledText className="text-gray-600 mt-4">Loading vehicles...</StyledText>
        </StyledView>
      </StyledSafeAreaView>
    );
  }

  return (
    <StyledSafeAreaView className="flex-1 bg-indigo-600">
      <LinearGradient
        colors={["#4F46E5", "#7C3AED", "#EC4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="h-60"
      >
        <StyledView className="flex-1 items-center justify-center px-8">
          <StyledView className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-4">
            <Truck size={40} color="#FFFFFF" />
          </StyledView>
          <StyledText className="text-white text-2xl font-bold text-center">
            Select Your Vehicle
          </StyledText>
          <StyledText className="text-white/80 text-center mt-2">
            Choose the vehicle you'll be using today
          </StyledText>
        </StyledView>
      </LinearGradient>

      <StyledView className="flex-1 -mt28">
        {vehicles.length === 0 ? (
          <StyledView className="flex-1 items-center justify-center px-6">
            <StyledView className="w-16 h-16 bg-yellow-100 rounded-full items-center justify-center mb-4">
              <AlertCircle size={32} color="#F59E0B" />
            </StyledView>
            <StyledText className="text-xl font-semibold text-white-800 text-center mb-2">
              No Vehicles Available
            </StyledText>
            <StyledText className="text-gray-600 text-center">
              There are no vehicles assigned to your account. Please contact your administrator.
            </StyledText>
          </StyledView>
        ) : (
          <FlatList
            data={vehicles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderVehicleItem}
            contentContainerStyle={{ paddingTop: 24, paddingBottom: 24 }}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <StyledView className="px-6 mb-4">
                <StyledText className="text-lg font-semibold text-white">
                  Available Vehicles ({vehicles.length})
                </StyledText>
                <StyledText className="text-sm text-white/60 mt-1">
                  Tap on a vehicle to select it
                </StyledText>
              </StyledView>
            }
          />
        )}

        {selectedVehicle && (
          <StyledPressable
            className="bg-indigo-500 rounded-lg py-4 px-4 items-center mx-6 mb-6"
            onPress={onVehicleSelected}
          >
            <StyledText className="text-white font-semibold">Confirm</StyledText>
          </StyledPressable>
        )}
      </StyledView>
    </StyledSafeAreaView>
  );
};

export default VehicleSelectionScreen;
