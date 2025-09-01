import React, { useState, useEffect } from "react";
import { View, Text, ScrollView, Pressable, Dimensions } from "react-native";
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
} from "lucide-react-native";

const { width } = Dimensions.get("window");

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledPressable = styled(Pressable);
const StyledSafeAreaView = styled(SafeAreaView);
const StyledScrollView = styled(ScrollView);
const StyledAnimatedView = styled(Animated.View);

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
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<
    "all" | "credit" | "debit"
  >("all");

  // Animation values
  const balanceScale = useSharedValue(0);
  const balanceOpacity = useSharedValue(0);
  const cardTranslateY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const historyTranslateY = useSharedValue(100);
  const historyOpacity = useSharedValue(0);
  const filterScale = useSharedValue(0);

  // Sample data
  const currentBalance = 1250.75;
  const transactions: Transaction[] = [
    {
      id: "1",
      type: "credit",
      amount: 150.0,
      description: "Delivery Payment",
      date: "2024-01-15",
      category: "Delivery",
      status: "completed",
    },
    {
      id: "2",
      type: "debit",
      amount: 25.5,
      description: "Service Fee",
      date: "2024-01-14",
      category: "Fees",
      status: "completed",
    },
    {
      id: "3",
      type: "credit",
      amount: 89.99,
      description: "Express Delivery",
      date: "2024-01-13",
      category: "Delivery",
      status: "completed",
    },
    {
      id: "4",
      type: "debit",
      amount: 12.0,
      description: "Transaction Fee",
      date: "2024-01-12",
      category: "Fees",
      status: "completed",
    },
    {
      id: "5",
      type: "credit",
      amount: 200.0,
      description: "Bulk Order Payment",
      date: "2024-01-11",
      category: "Delivery",
      status: "completed",
    },
    {
      id: "6",
      type: "debit",
      amount: 8.5,
      description: "Processing Fee",
      date: "2024-01-10",
      category: "Fees",
      status: "completed",
    },
  ];

  // Individual transaction animation values - created after transactions array
  const transactionAnimations = transactions.map(() => ({
    translateY: useSharedValue(50),
    opacity: useSharedValue(0),
  }));

  useEffect(() => {
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

    // Animate transactions with staggered delay
    transactionAnimations.forEach((animation, index) => {
      animation.translateY.value = withDelay(
        600 + index * 100,
        withSpring(0, { damping: 15, stiffness: 100 })
      );
      animation.opacity.value = withDelay(
        600 + index * 100,
        withTiming(1, { duration: 600 })
      );
    });
  };

  const toggleBalanceVisibility = () => {
    setIsBalanceVisible(!isBalanceVisible);
  };

  const getFilteredTransactions = () => {
    if (selectedFilter === "all") return transactions;
    return transactions.filter((t) => t.type === selectedFilter);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "#059669";
      case "pending":
        return "#D97706";
      case "failed":
        return "#DC2626";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
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
      <StyledScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <StyledView className="px-6 pt-4 pb-6">
          <StyledView className="flex-row items-center justify-between mb-6">
            <StyledView>
              <StyledText className="text-2xl font-bold text-gray-800">
                Wallet
              </StyledText>
              <StyledText className="text-gray-500">
                Manage your payments
              </StyledText>
            </StyledView>
            {/* <StyledPressable className="w-10 h-10 bg-indigo-100 rounded-full items-center justify-center">
              <Plus size={20} color="#4F46E5" />
            </StyledPressable> */}
          </StyledView>

          {/* Balance Card */}
          <StyledAnimatedView
            className="bg-indigo-600 rounded-3xl p-6 mb-6"
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
              <StyledText className="text-white text-3xl font-bold">
                {isBalanceVisible
                  ? `KWD ${currentBalance.toFixed(2)}`
                  : "••••••"}
              </StyledText>
            </StyledView>

            <StyledView className="flex-row items-center justify-between">
              <StyledView className="flex-row items-center">
                <StyledView className="w-8 h-8 bg-green-500/20 rounded-full items-center justify-center mr-2">
                  <TrendingUp size={16} color="#10B981" />
                </StyledView>
                <StyledView>
                  <StyledText className="text-white/80 text-xs">
                    This Month
                  </StyledText>
                  <StyledText className="text-white font-semibold">
                    +KWD 450.25
                  </StyledText>
                </StyledView>
              </StyledView>
              <StyledView className="flex-row items-center">
                <StyledView className="w-8 h-8 bg-red-500/20 rounded-full items-center justify-center mr-2">
                  <TrendingDown size={16} color="#EF4444" />
                </StyledView>
                <StyledView>
                  <StyledText className="text-white/80 text-xs">
                    Spent
                  </StyledText>
                  <StyledText className="text-white font-semibold">
                    -KWD 89.50
                  </StyledText>
                </StyledView>
              </StyledView>
            </StyledView>
          </StyledAnimatedView>

          {/* Quick Actions */}
          {/* <StyledAnimatedView
            className="flex-row space-x-3 mb-6"
            style={filterAnimatedStyle}
          >
            <StyledPressable
              onPress={() => setSelectedFilter("all")}
              className={`flex-1 py-3 px-4 rounded-xl items-center ${
                selectedFilter === "all"
                  ? "bg-indigo-600"
                  : "bg-white border border-gray-200"
              }`}
            >
              <StyledText
                className={`font-medium ${
                  selectedFilter === "all" ? "text-white" : "text-gray-700"
                }`}
              >
                All
              </StyledText>
            </StyledPressable>
            <StyledPressable
              onPress={() => setSelectedFilter("credit")}
              className={`flex-1 py-3 px-4 rounded-xl items-center ${
                selectedFilter === "credit"
                  ? "bg-green-600"
                  : "bg-white border border-gray-200"
              }`}
            >
              <StyledText
                className={`font-medium ${
                  selectedFilter === "credit" ? "text-white" : "text-gray-700"
                }`}
              >
                Income
              </StyledText>
            </StyledPressable>
            <StyledPressable
              onPress={() => setSelectedFilter("debit")}
              className={`flex-1 py-3 px-4 rounded-xl items-center ${
                selectedFilter === "debit"
                  ? "bg-red-600"
                  : "bg-white border border-gray-200"
              }`}
            >
              <StyledText
                className={`font-medium ${
                  selectedFilter === "debit" ? "text-white" : "text-gray-700"
                }`}
              >
                Expenses
              </StyledText>
            </StyledPressable>
          </StyledAnimatedView> */}
        </StyledView>

        {/* Transaction History */}
        <StyledAnimatedView className="px-6 pb-6" style={historyAnimatedStyle}>
          <StyledView className="flex-row items-center justify-between mb-4">
            <StyledText className="text-lg font-semibold text-gray-800">
              Recent Transactions
            </StyledText>
            {/* <StyledPressable className="flex-row items-center">
              <Filter size={16} color="#6B7280" />
              <StyledText className="text-gray-500 text-sm ml-1">
                Filter
              </StyledText>
            </StyledPressable> */}
          </StyledView>

          {getFilteredTransactions().map((transaction, index) => {
            const animation = transactionAnimations[index];
            if (!animation) return null;

            const transactionAnimatedStyle = useAnimatedStyle(() => ({
              transform: [{ translateY: animation.translateY.value }],
              opacity: animation.opacity.value,
            }));

            return (
              <StyledAnimatedView
                key={transaction.id}
                className="bg-white rounded-xl p-4 mb-3 shadow-sm border border-gray-100"
                style={transactionAnimatedStyle}
              >
                <StyledView className="flex-row items-center justify-between">
                  <StyledView className="flex-row items-center flex-1">
                    <StyledView
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        transaction.type === "credit"
                          ? "bg-green-100"
                          : "bg-red-100"
                      }`}
                    >
                      {transaction.type === "credit" ? (
                        <ArrowUpRight size={20} color="#059669" />
                      ) : (
                        <ArrowDownRight size={20} color="#DC2626" />
                      )}
                    </StyledView>
                    <StyledView className="flex-1">
                      <StyledText className="text-gray-800 font-medium mb-1">
                        {transaction.description}
                      </StyledText>
                      <StyledView className="flex-row items-center">
                        <StyledText className="text-gray-500 text-sm mr-3">
                          {transaction.category}
                        </StyledText>
                        <StyledView
                          className="px-2 py-1 rounded-full"
                          style={{
                            backgroundColor: `${getStatusColor(
                              transaction.status
                            )}20`,
                          }}
                        >
                          <StyledText
                            className="text-xs font-medium"
                            style={{
                              color: getStatusColor(transaction.status),
                            }}
                          >
                            {getStatusText(transaction.status)}
                          </StyledText>
                        </StyledView>
                      </StyledView>
                    </StyledView>
                  </StyledView>
                  <StyledView className="items-end">
                    <StyledText
                      className={`text-lg font-bold ${
                        transaction.type === "credit"
                          ? "text-green-600"
                          : "text-red-600"
                      }`}
                    >
                      {transaction.type === "credit" ? "+" : "-"}KWD{" "}
                      {transaction.amount.toFixed(2)}
                    </StyledText>
                    <StyledText className="text-gray-400 text-sm">
                      {formatDate(transaction.date)}
                    </StyledText>
                  </StyledView>
                </StyledView>
              </StyledAnimatedView>
            );
          })}

          {getFilteredTransactions().length === 0 && (
            <StyledView className="bg-white rounded-xl p-8 items-center">
              <StyledView className="w-16 h-16 bg-gray-100 rounded-full items-center justify-center mb-4">
                <CreditCard size={24} color="#9CA3AF" />
              </StyledView>
              <StyledText className="text-gray-600 text-lg font-medium mb-2">
                No transactions found
              </StyledText>
              <StyledText className="text-gray-500 text-center">
                {selectedFilter === "all"
                  ? "You haven't made any transactions yet."
                  : `No ${selectedFilter} transactions found.`}
              </StyledText>
            </StyledView>
          )}
        </StyledAnimatedView>
      </StyledScrollView>
    </StyledSafeAreaView>
  );
};

export default WalletScreen;
