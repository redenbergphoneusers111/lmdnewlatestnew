import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Check, Phone, Calendar } from "lucide-react-native";
import { TransferOrder } from "../../services/apiService";

interface TransferOrderItemProps {
  order: TransferOrder;
  isSelected: boolean;
  onToggleSelection: () => void;
  onLongPress: () => void;
}

const TransferOrderItem: React.FC<TransferOrderItemProps> = ({
  order,
  isSelected,
  onToggleSelection,
  onLongPress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "open":
        return "#10B981"; // Green
      case "picked":
        return "#F59E0B"; // Yellow
      case "delivered":
        return "#3B82F6"; // Blue
      case "cancelled":
        return "#EF4444"; // Red
      default:
        return "#6B7280"; // Gray
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatPhoneNumber = (phone: string) => {
    if (!phone || phone === "-") return "";
    // Format phone number for display
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  };

  return (
    <TouchableOpacity
      style={[styles.container, isSelected && styles.selectedContainer]}
      onPress={onToggleSelection}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      {/* Order Content */}
      <View style={styles.content}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text
            style={styles.orderNumber}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {order.docNum}
          </Text>
          <View style={styles.headerRight}>
            <View style={styles.dateText}>
              <Calendar size={12} color="#8B5CF6" />
              <Text
                style={{
                  marginLeft: 4,
                  fontSize: 11,
                  color: "#8B5CF6",
                  fontWeight: "500",
                }}
              >
                {formatDate(order.doDate)}
              </Text>
            </View>
            {/* Selection Checkbox */}
            <View style={styles.checkboxContainer}>
              {isSelected && (
                <View style={styles.checkbox}>
                  <Check size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Main Content Row */}
        <View style={styles.mainContentRow}>
          {/* Left Column - Name, Mobile, Amount */}
          <View style={styles.leftColumn}>
            {/* Customer Name */}
            <Text
              style={styles.customerName}
              numberOfLines={2}
              ellipsizeMode="tail"
            >
              {order.cardName}
            </Text>

            {/* Contact Info */}
            {order.mobileNo && order.mobileNo !== "-" && (
              <View style={styles.contactRow}>
                <Phone size={12} color="#3B82F6" />
                <Text
                  style={styles.contactText}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {formatPhoneNumber(order.mobileNo)}
                </Text>
              </View>
            )}

            {/* Amount */}
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Amount:</Text>
              <Text style={styles.amountValue}>
                ${order.docTotal.toFixed(2)}
              </Text>
            </View>
          </View>

          {/* Right Column - Customer Code and Status */}
          <View style={styles.rightColumn}>
            <Text
              style={styles.customerCode}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {order.cardCode}
            </Text>

            <View style={styles.statusContainer}>
              <Text style={styles.statusLabel}>Status:</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(order.status) },
                ]}
              >
                <Text style={styles.statusText} numberOfLines={1}>
                  {order.status}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginHorizontal: 8,
    marginVertical: 4,
    padding: 20,
    flexDirection: "row",
    alignItems: "flex-start",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
    minHeight: 120,
  },
  selectedContainer: {
    borderColor: "#8B5CF6",
    backgroundColor: "#F8FAFF",
    borderWidth: 2,
  },
  checkboxContainer: {
    width: 28,
    height: 28,
    marginRight: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#8B5CF6",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    flex: 1,
    paddingRight: 8,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  orderNumber: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1F2937",
    flex: 1,
    marginRight: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  dateText: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 0,
  },
  mainContentRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  leftColumn: {
    flex: 1,
    marginRight: 16,
  },
  rightColumn: {
    alignItems: "flex-end",
    justifyContent: "space-between",
    minHeight: 60,
  },
  customerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#374151",
    lineHeight: 20,
    marginBottom: 6,
  },
  customerCode: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    textAlign: "right",
  },
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  contactText: {
    fontSize: 12,
    color: "#3B82F6",
    marginLeft: 6,
    fontWeight: "500",
  },
  amountContainer: {
    marginTop: 4,
  },
  amountLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    color: "#059669",
    fontWeight: "700",
  },
  statusContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  statusLabel: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    minWidth: 60,
    alignItems: "center",
  },
  statusText: {
    fontSize: 10,
    color: "#FFFFFF",
    fontWeight: "600",
    textTransform: "uppercase",
    textAlign: "center",
  },
});

export default TransferOrderItem;
