import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  FlatList,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from "react-native";
import { X, Search, Truck } from "lucide-react-native";
import { Vehicle, apiService } from "../../services/apiService";

interface VehicleSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectVehicle: (vehicle: Vehicle) => void;
  currentVehicleId?: number;
}

const VehicleSelectionModal: React.FC<VehicleSelectionModalProps> = ({
  visible,
  onClose,
  onSelectVehicle,
  currentVehicleId,
}) => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filteredVehicles, setFilteredVehicles] = useState<Vehicle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadVehicles();
    }
  }, [visible]);

  useEffect(() => {
    filterVehicles();
  }, [searchQuery, vehicles]);

  const loadVehicles = async () => {
    setLoading(true);
    try {
      const response = await apiService.getFilterVehicle();
      if (response.success && response.data) {
        // Filter out current vehicle
        const availableVehicles = response.data.filter(
          (vehicle) => vehicle.id !== currentVehicleId && vehicle.isActive
        );
        setVehicles(availableVehicles);
      } else {
        Alert.alert("Error", "Failed to load vehicles");
      }
    } catch (error) {
      console.error("Error loading vehicles:", error);
      Alert.alert("Error", "Failed to load vehicles");
    } finally {
      setLoading(false);
    }
  };

  const filterVehicles = () => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(vehicles);
      return;
    }

    const filtered = vehicles.filter(
      (vehicle) =>
        vehicle.vehicleNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        vehicle.vehicleModel
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        vehicle.driverName.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredVehicles(filtered);
  };

  const handleSelectVehicle = (vehicle: Vehicle) => {
    onSelectVehicle(vehicle);
    onClose();
  };

  const renderVehicleItem = ({ item }: { item: Vehicle }) => (
    <TouchableOpacity
      style={styles.vehicleItem}
      onPress={() => handleSelectVehicle(item)}
      activeOpacity={0.7}
    >
      <View style={styles.vehicleIcon}>
        <Truck size={20} color="#8B5CF6" />
      </View>
      <View style={styles.vehicleInfo}>
        <Text style={styles.vehicleNumber}>{item.vehicleNo}</Text>
        <Text style={styles.vehicleModel}>{item.vehicleModel}</Text>
        <Text style={styles.driverName}>{item.driverName}</Text>
      </View>
      <View style={styles.vehicleStatus}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: item.isActive ? "#10B981" : "#EF4444" },
          ]}
        />
        <Text style={styles.statusText}>
          {item.isActive ? "Active" : "Inactive"}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Select Vehicle</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#6B7280" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9CA3AF" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicles..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9CA3AF"
            />
          </View>
        </View>

        {/* Vehicle List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading vehicles...</Text>
            </View>
          ) : filteredVehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Truck size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No vehicles found" : "No vehicles available"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try adjusting your search"
                  : "All vehicles are currently assigned"}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredVehicles}
              renderItem={renderVehicleItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContent}
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: "#FFFFFF",
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  listContainer: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 8,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginVertical: 4,
    padding: 16,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  vehicleIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 2,
  },
  vehicleModel: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 2,
  },
  driverName: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  vehicleStatus: {
    alignItems: "center",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 10,
    color: "#6B7280",
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#6B7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9CA3AF",
    textAlign: "center",
  },
});

export default VehicleSelectionModal;
