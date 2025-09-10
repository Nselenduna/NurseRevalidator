import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  Alert,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
} from 'react-native-reanimated';

// Components
import StatusCard from '../../components/registration/StatusCard';
import RenewalCountdown from '../../components/registration/RenewalCountdown';
import BackButton from '../../components/forms/BackButton';
import PrimaryButton from '../../components/forms/PrimaryButton';
import OfflineBanner from '../../components/common/OfflineBanner';

// Services and Types
import RegistrationService from '../../services/registration/RegistrationService';
import { 
  RegistrationStatusScreenProps, 
  RegistrationData 
} from '../../types/registration.types';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

// Networking
import { useNetInfo } from '@react-native-community/netinfo';

const RegistrationStatusScreen: React.FC<RegistrationStatusScreenProps> = ({ navigation }) => {
  const netInfo = useNetInfo();
  const isReducedMotion = useReducedMotion();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [registrationData, setRegistrationData] = useState<RegistrationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  // Load registration data
  const loadRegistrationData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);
      
      const data = await RegistrationService.getRegistrationData();
      setRegistrationData(data);
    } catch (err) {
      console.error('Failed to load registration data:', err);
      setError('Failed to load registration data. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadRegistrationData();
  }, []);

  // Screen entry animation
  useEffect(() => {
    if (!isReducedMotion && registrationData) {
      fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
      slideAnim.value = withDelay(300, withTiming(0, { duration: 600 }));
    } else if (registrationData) {
      fadeAnim.value = 1;
      slideAnim.value = 0;
    }
  }, [registrationData, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadRegistrationData(false);
  };

  // Verification handler
  const handleVerifyRegistration = async () => {
    if (!registrationData) return;
    
    setIsVerifying(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      const result = await RegistrationService.verifyRegistration(registrationData.nmcPin);
      
      // Update local state
      setRegistrationData(prev => prev ? {
        ...prev,
        verificationStatus: result,
        lastVerified: new Date(),
      } : null);

      const message = result === 'verified' 
        ? 'Registration verified successfully!'
        : 'Verification failed. Please check your registration details.';
      
      Alert.alert(
        'Verification Complete',
        message,
        [{ text: 'OK' }]
      );

      if (result === 'verified') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch (err) {
      console.error('Verification failed:', err);
      Alert.alert(
        'Verification Error',
        'Failed to verify registration. Please try again later.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsVerifying(false);
    }
  };

  // Renewal action
  const handleRenewalAction = () => {
    Alert.alert(
      'Renew Registration',
      'This will redirect you to the NMC renewal portal.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => {
          // In a real app, this would open NMC renewal URL
          Alert.alert('Info', 'NMC renewal portal integration coming soon!');
        }},
      ]
    );
  };

  // Handle expiry
  const handleExpiry = async () => {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Registration Expired',
      'Your NMC registration has expired. Please renew immediately to continue practicing.',
      [
        { text: 'Renew Now', onPress: handleRenewalAction },
        { text: 'Later', style: 'cancel' },
      ]
    );
  };

  // Schedule notifications
  const handleScheduleReminders = () => {
    Alert.alert(
      'Notification Reminders',
      'Set up automatic reminders for your registration renewal?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Set Reminders', 
          onPress: async () => {
            if (registrationData) {
              try {
                await RegistrationService.scheduleNotifications(
                  [90, 30, 14, 7], // Default reminder days
                  registrationData.expiryDate
                );
                Alert.alert('Success', 'Renewal reminders have been set up!');
                await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              } catch (err) {
                Alert.alert('Error', 'Failed to set up reminders. Please try again.');
              }
            }
          }
        },
      ]
    );
  };

  // Loading state
  if (isLoading || !registrationData) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading registration status...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Error state
  if (error) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <PrimaryButton
              label="Retry"
              onPress={() => loadRegistrationData()}
              style={styles.retryButton}
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        {/* Offline Banner */}
        {!netInfo.isConnected && <OfflineBanner />}

        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>Registration Status</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, animatedStyle]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.white}
                titleColor={COLORS.white}
                colors={[COLORS.white]}
                progressBackgroundColor={COLORS.primary}
              />
            }
          >
            {/* Status Card */}
            <View style={styles.section}>
              <StatusCard
                nmcPin={registrationData.nmcPin}
                status={registrationData.status}
                expiryDate={registrationData.expiryDate}
                lastRenewal={registrationData.renewalHistory[0]?.renewalDate}
                verificationStatus={registrationData.verificationStatus}
              />
            </View>

            {/* Countdown Timer */}
            <View style={styles.section}>
              <RenewalCountdown
                targetDate={registrationData.expiryDate}
                onExpire={handleExpiry}
                status={registrationData.status}
              />
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsSection}>
              <Text style={styles.sectionTitle}>Quick Actions</Text>
              
              <View style={styles.actionButtons}>
                <PrimaryButton
                  label={isVerifying ? "Verifying..." : "Verify Registration"}
                  onPress={handleVerifyRegistration}
                  disabled={isVerifying}
                  loading={isVerifying}
                  style={styles.actionButton}
                />
                
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handleRenewalAction}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Start Renewal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.secondaryButton}
                  onPress={handleScheduleReminders}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Set Reminders</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Information Section */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Important Information</Text>
              <View style={styles.infoCard}>
                <Text style={styles.infoText}>
                  • Keep your registration details up to date
                  {'\n'}• Renew before the expiry date to avoid interruption
                  {'\n'}• Complete required CPD hours annually
                  {'\n'}• Notify NMC of any changes to your details
                </Text>
              </View>
            </View>

            {/* Bottom Padding */}
            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 120,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44, // Match BackButton width
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  actionsSection: {
    marginBottom: 24,
  },
  actionButtons: {
    gap: 12,
  },
  actionButton: {
    marginBottom: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  infoSection: {
    marginBottom: 24,
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  infoText: {
    fontSize: 14,
    color: COLORS.white,
    lineHeight: 20,
    opacity: 0.9,
  },
  bottomPadding: {
    height: 20,
  },
});

export default RegistrationStatusScreen;