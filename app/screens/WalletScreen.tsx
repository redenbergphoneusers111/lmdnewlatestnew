import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withSequence,
  withDelay,
  interpolate,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import { styled } from "nativewind";
import {
  Wallet,
  CreditCard,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  EyeOff,
  Filter,
  Search,
  FileText,
  Calendar,
  User,
} from "lucide-react-native";
import { useAuth } from "../contexts/AuthContext";
import apiService from "../services/apiService";

const { width } = Dimensions.get("window");

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

interface WalletDetailDTO {
  doid: number;
  docNum: string;
  dostr: string;
  alreadyPaid: number;
  balance: number;
  paid: number;
  totalInvAmount: number;
}

interface WalletReport {
  id: number;
  date: string;
  totalAmount: number;
  remarks: string;
  pendingAmount: number;
  userID: number;
  userName: string;
  cby: string;
  enteredAmount: number;
  walletDetailDTO: WalletDetailDTO[];
}

interface Transaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
  category: string;
  status: "completed" | "pending" | "failed";
}

const WalletScreen: React.FC = () => {
  const { selectedVehicle } = useAuth();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [walletData, setWalletData] = useState<WalletReport[]>([]);
  const [loading, setLoading] = useState(false);

  // Animation values
  const balanceScale = useSharedValue(0);
  const balanceOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const historyTranslateY = useSharedValue(100);
  const historyOpacity = useSharedValue(0);
  const filterScale = useSharedValue(0);

  // Calculate total amount from wallet data
  const currentBalance = walletData.length > 0 ? walletData[0].totalAmount : 0;
  const pendingAmount = walletData.length > 0 ? walletData[0].pendingAmount : 0;

  // Fetch wallet data
  const fetchWalletData = async () => {
    try {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD
      const userId = 1; // You can get this from auth context or props

      const response = await fetch(
        `http://194.195.87.226:8090/api/WalletReportNew?fdate=${today}&tdate=${today}&userID=${userId}`
      );

      if (response.ok) {
        const data = await response.json();
        setWalletData(data);
        console.log("Wallet data loaded:", data);
      } else {
        throw new Error("Failed to fetch wallet data");
      }
    } catch (error) {
      console.error("Error fetching wallet data:", error);
      Alert.alert("Error", "Failed to load wallet data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
    startAnimations();
  }, []);

  const startAnimations = () => {
    // Balance card animation
    balanceScale.value = withSpring(1, { damping: 15, stiffness: 100 });
    balanceOpacity.value = withTiming(1, { duration: 800 });
    cardTranslateY.value = withSpring(0, { damping: 15, stiffness: 100 });
    cardOpacity.value = withTiming(1, { duration: 600 });

    // History animation with delay
    historyTranslateY.value = withDelay(
      300,
      withSpring(0, { damping: 15, stiffness: 100 })
    );
    historyOpacity.value = withDelay(300, withTiming(1, { duration: 800 }));

    // Filter animation
    filterScale.value = withDelay(
      500,
      withSpring(1, { damping: 15, stiffness: 100 })
    );
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  // Animated styles
  const balanceAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: balanceScale.value }],
    opacity: balanceOpacity.value,
  }));

  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: cardTranslateY.value }],
    opacity: cardOpacity.value,
  }));

  const historyAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: historyTranslateY.value }],
    opacity: historyOpacity.value,
  }));

  const filterAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: filterScale.value }],
  }));

  return (
    <StyledSafeAreaView className="flex-1 bg-gray-50">
      {/* Fixed Header with Balance Card */}
      <StyledView className="px-6 pt-1 pb-2">
        {/* Balance Card */}
        <StyledAnimatedView
          className="bg-indigo-600 rounded-3xl p-6 mb-2"
          style={[balanceAnimatedStyle, cardAnimatedStyle]}
        >
          <StyledView className="flex-row items-center justify-between mb-4">
            <StyledView className="flex-row items-center">
              <StyledView className="w-12 h-12 bg-white/20 rounded-full items-center justify-center mr-3">
                <Wallet size={24} color="#FFFFFF" />
              </StyledView>
              <StyledView>
                <StyledText className="text-white/80 text-sm">
                  Current Balance
                </StyledText>
                <StyledText className="text-white text-lg font-semibold">
                  KWD
                </StyledText>
              </StyledView>
            </StyledView>
            <StyledPressable
              onPress={toggleBalanceVisibility}
              className="w-10 h-10 bg-white/20 rounded-full items-center justify-center"
            >
              {isBalanceVisible ? (
                <Eye size={20} color="#FFFFFF" />
              ) : (
                <EyeOff size={20} color="#FFFFFF" />
              )}
            </StyledPressable>
          </StyledView>

          <StyledView className="mb-4">
            <StyledText className="text-white/80 text-sm mb-1">
              Total Available
            </StyledText>
            {loading ? (
              <StyledView className="flex-row items-center">
                <ActivityIndicator size="small" color="#FFFFFF" />
                <StyledText className="text-white text-lg ml-2">
                  Loading...
                </StyledText>
              </StyledView>
            ) : (
              <StyledText className="text-white text-3xl font-bold">
                {isBalanceVisible
                  ? `KWD ${currentBalance.toFixed(2)}`
                  : "••••••"}
              </StyledText>
            )}
          </StyledView>
        </StyledAnimatedView>
      </StyledView>

      {/* Scrollable Wallet Details */}
      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Wallet Details */}
        <StyledAnimatedView className="px-6 pb-6" style={historyAnimatedStyle}>
          <StyledView className="flex-row items-center justify-between mb-4">
            <StyledText className="text-lg font-semibold text-gray-800">
              Wallet Details
            </StyledText>
            <StyledView className="flex-row items-center">
              <Calendar size={16} color="#6B7280" />
              <StyledText className="text-gray-500 text-sm ml-1">
                {new Date().toLocaleDateString()}
              </StyledText>
            </StyledView>
          </StyledView>

          {loading ? (
            <StyledView className="bg-white rounded-xl p-8 items-center">
              <ActivityIndicator size="large" color="#4F46E5" />
              <StyledText className="text-gray-600 text-lg font-medium mt-4">
                Loading wallet data...
              </StyledText>
            </StyledView>
          ) : walletData.length > 0 ? (
            walletData.map((wallet, walletIndex) => (
              <StyledView key={wallet.id} className="mb-4">
                {/* Document Details List */}
                {wallet.walletDetailDTO &&
                  wallet.walletDetailDTO.length > 0 && (
                    <StyledView>
                      {wallet.walletDetailDTO.map((detail, detailIndex) => (
                        <StyledView
                          key={detail.doid}
                          className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                        >
                          <StyledView className="flex-row items-center justify-between mb-2">
                            <StyledView className="flex-row items-center">
                              <StyledView className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                                <FileText size={16} color="#3B82F6" />
                              </StyledView>
                              <StyledView>
                                <StyledText className="text-gray-800 font-medium">
                                  {detail.dostr}
                                </StyledText>
                                <StyledText className="text-gray-500 text-sm">
                                  Doc #{detail.docNum}
                                </StyledText>
                              </StyledView>
                            </StyledView>
                            <StyledView className="items-end">
                              <StyledText className="text-blue-600 font-bold">
                                KWD {detail.totalInvAmount.toFixed(2)}
                              </StyledText>
                              <StyledText className="text-gray-400 text-sm">
                                Total Amount
                              </StyledText>
                            </StyledView>
                          </StyledView>

                          <StyledView className="flex-row justify-between mt-2">
                            <StyledView className="flex-1 mr-2">
                              <StyledText className="text-gray-500 text-sm">
                                Paid
                              </StyledText>
                              <StyledText className="text-green-600 font-semibold">
                                KWD {detail.paid.toFixed(2)}
                              </StyledText>
                            </StyledView>
                            <StyledView className="flex-1 ml-2">
                              <StyledText className="text-gray-500 text-sm">
                                Balance
                              </StyledText>
                              <StyledText className="text-orange-600 font-semibold">
                                KWD {detail.balance.toFixed(2)}
                              </StyledText>
                            </StyledView>
                          </StyledView>
                        </StyledView>
                      ))}
                    </StyledView>
                  )}
              </StyledView>
            ))
          ) : (
            <StyledView className="bg-white rounded-xl p-8 items-center">
              <StyledView className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <Wallet size={24} color="#9CA3AF" />
              </StyledView>
              <StyledText className="text-gray-600 text-lg font-medium mb-2">
                No wallet data found
              </StyledText>
              <StyledText className="text-gray-500 text-center">
                No wallet information available for today.
              </StyledText>
            </StyledView>
          )}
        </StyledAnimatedView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
};

export default WalletScreen;
