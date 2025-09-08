import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  FadeInUp, 
  FadeInDown,
} from 'react-native-reanimated';
import { 
  User, Edit3, Settings, Bell, Shield, HelpCircle,
  Star, MapPin, Phone, Mail, Calendar, Award, ChevronRight, LogOut
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import AnimatedHeader from '../components/ui/AnimatedHeader';
import LogoutConfirmationDialog from '../components/ui/LogoutConfirmationDialog';
import { useAuth } from '../contexts/AuthContext';

interface ProfileScreenProps {
  onMenuPress: () => void;
}

const profileMenuItems = [
  { id: '1', title: 'Account Settings', icon: Settings, color: '#6C63FF' },
  { id: '2', title: 'Notifications', icon: Bell, color: '#6C93E5' },
  { id: '3', title: 'Security & Privacy', icon: Shield, color: '#43C337' },
  { id: '4', title: 'Help & Support', icon: HelpCircle, color: '#E8B73A' },
];

const profileStats = [
  { id: '1', label: 'Total Deliveries', value: '1,247', icon: MapPin },
  { id: '2', label: 'Rating', value: '4.9', icon: Star },
  { id: '3', label: 'Years Active', value: '3.2', icon: Calendar },
  { id: '4', label: 'Achievements', value: '12', icon: Award },
];

const ProfileScreen: React.FC<ProfileScreenProps> = ({ onMenuPress }) => {
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowLogoutDialog(true);
  };

  const handleLogoutConfirm = () => {
    setShowLogoutDialog(false);
    logout();
  };

  const handleLogoutCancel = () => {
    setShowLogoutDialog(false);
  };

  return (
    <LinearGradient colors={['#6C63FF', '#5b54d9']} className="flex-1">
      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-24"
      >
        <AnimatedHeader 
            onMenuPress={onMenuPress}
            title="Profile"
            subtitle="Manage your account and preferences"
        />

        <Animated.View entering={FadeInUp.delay(200).duration(600)} className="mx-6 mb-6">
          <View className="bg-white/20 rounded-2xl p-6">
            <View className="items-center mb-6">
              <View className="w-24 h-24 bg-white rounded-full items-center justify-center mb-4 shadow-lg">
                <User size={40} color="#6C63FF" />
              </View>
              <Text className="text-white font-nunito font-bold text-xl mb-1">Connor Davidson</Text>
              <Text className="text-white/80 font-nunito text-base mb-1">Senior Delivery Partner</Text>
            </View>
            <View className="space-y-3 mb-6">
              <View className="flex-row items-center"><Mail size={16} color="rgba(255,255,255,0.7)" /><Text className="text-white/70 font-nunito text-sm ml-3">connor.d@example.com</Text></View>
              <View className="flex-row items-center"><Phone size={16} color="rgba(255,255,255,0.7)" /><Text className="text-white/70 font-nunito text-sm ml-3">+1 (555) 123-4567</Text></View>
            </View>
            <Pressable className="bg-white/30 py-3 rounded-lg active:bg-white/40" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)} android_ripple={{ color: 'rgba(255,255,255,0.4)' }}>
              <View className="flex-row items-center justify-center">
                <Edit3 size={18} color="#FFFFFF" />
                <Text className="text-white font-nunito font-semibold text-base ml-2">Edit Profile</Text>
              </View>
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(500).duration(600)} className="mx-6 mb-6">
          <View className="flex-row flex-wrap justify-between">
            {profileStats.map((stat, index) => (
              <Animated.View key={stat.id} entering={FadeInUp.delay(700 + (index * 100)).duration(500)} className="w-[48%] mb-3">
                <View className="bg-white/20 rounded-xl p-4">
                  <View className="flex-row items-center mb-2">
                    <stat.icon size={18} color="#FFFFFF" />
                    <Text className="text-white/80 font-nunito text-xs ml-2 flex-1">{stat.label}</Text>
                  </View>
                  <Text className="text-white font-nunito font-bold text-2xl">{stat.value}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(900).duration(600)} className="bg-card mx-6 rounded-2xl shadow-lg">
          <View className="px-5 py-4 border-b border-gray-100">
            <Text className="text-text-primary font-nunito font-semibold text-lg">Settings & Support</Text>
          </View>
          <View className="px-5 py-2">
            {profileMenuItems.map((item, index) => (
              <Animated.View key={item.id} entering={FadeInDown.delay(1100 + (index * 100)).duration(400)}>
                <Pressable className="flex-row items-center py-4 active:bg-gray-50 rounded-lg" onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)} android_ripple={{ color: '#f9fafb' }}>
                  <View className="w-10 h-10 rounded-full items-center justify-center mr-4" style={{ backgroundColor: item.color + '20' }}>
                    <item.icon size={20} color={item.color} />
                  </View>
                  <View className="flex-1">
                    <Text className="text-text-primary font-sf-display font-semibold text-base">{item.title}</Text>
                  </View>
                  <ChevronRight size={20} color="#ACB1C0" />
                </Pressable>
                {index !== profileMenuItems.length - 1 && <View className="h-px bg-background ml-14" />}
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* Logout Section */}
        <Animated.View entering={FadeInUp.delay(1300).duration(600)} className="mx-6 mb-6">
          <View className="bg-red-500/20 rounded-2xl p-6 border border-red-300/30">
            <View className="items-center">
              <View className="w-16 h-16 bg-red-100 rounded-full items-center justify-center mb-4">
                <LogOut size={24} color="#ef4444" />
              </View>
              <Text className="text-red-700 font-nunito font-semibold text-lg mb-2">Sign Out</Text>
              <Text className="text-red-600 font-nunito text-sm text-center mb-4">
                Sign out of your account to secure your data
              </Text>
              <Pressable 
                className="bg-red-500 py-3 px-6 rounded-xl active:bg-red-600" 
                onPress={handleLogout}
                android_ripple={{ color: 'rgba(255,255,255,0.2)' }}
              >
                <View className="flex-row items-center">
                  <LogOut size={18} color="#FFFFFF" />
                  <Text className="text-white font-nunito font-semibold text-base ml-2">Logout</Text>
                </View>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Logout Confirmation Dialog */}
      <LogoutConfirmationDialog
        isVisible={showLogoutDialog}
        onConfirm={handleLogoutConfirm}
        onCancel={handleLogoutCancel}
      />
    </LinearGradient>
  );
};

export default ProfileScreen;
