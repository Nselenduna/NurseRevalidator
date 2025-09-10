import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
  Alert,
  Linking,
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
  withSpring,
  cancelAnimation,
} from 'react-native-reanimated';

// Components
import HeaderBar from '../../components/dashboard/HeaderBar';
import WelcomeSection from '../../components/dashboard/WelcomeSection';
import NextTaskCard from '../../components/dashboard/NextTaskCard';
import FeatureTile from '../../components/dashboard/FeatureTile';
import QuickStats from '../../components/dashboard/QuickStats';
import OfflineBanner from '../../components/common/OfflineBanner';

// Hooks and Services
import useDashboardData from '../../hooks/useDashboardData';
import useReducedMotion from '../../hooks/useReducedMotion';

// Constants and Types
import { COLORS } from '../../utils/constants/colors';
import { ROUTES } from '../../utils/constants/routes';
import { DashboardScreenProps, FeatureTileData } from '../../types/dashboard.types';

// Networking
import { useNetInfo } from '@react-native-community/netinfo';

const DashboardScreen: React.FC<DashboardScreenProps> = ({ navigation }) => {
  const netInfo = useNetInfo();
  const isReducedMotion = useReducedMotion();
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  // Data
  const {
    user,
    stats,
    nextTask,
    isLoading,
    error,
    refreshing,
    lastSync,
    onRefresh,
    greeting,
  } = useDashboardData();

  // Screen entry animation
  useEffect(() => {
    if (!isReducedMotion) {
      fadeAnim.value = withTiming(1, { duration: 600 });
      slideAnim.value = withDelay(200, withSpring(0, {
        damping: 15,
        stiffness: 100,
      }));
    } else {
      fadeAnim.value = 1;
      slideAnim.value = 0;
    }

    return () => {
      cancelAnimation(fadeAnim);
      cancelAnimation(slideAnim);
    };
  }, [isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: fadeAnim.value,
      transform: [{ translateY: slideAnim.value }],
    };
  });

  // Navigation handlers
  const handleProfilePress = () => {
    navigation.navigate(ROUTES.Profile as never);
  };

  const handleNotificationPress = () => {
    navigation.navigate(ROUTES.Notifications as never);
  };

  const handleLogoPress = async () => {
    if (!isReducedMotion) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    // Easter egg - scroll to top with fun animation
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };

  // Feature tiles configuration
  const getFeatureTiles = (): FeatureTileData[] => [
    {
      id: 'registration',
      icon: 'registration',
      title: 'Registration Status',
      subtitle: 'View your NMC registration and renewal details',
      onPress: () => navigation.navigate(ROUTES.RegistrationStatus as never),
      badge: user && !user.revalidationDate ? 1 : undefined,
    },
    {
      id: 'cpd',
      icon: 'cpd',
      title: 'CPD Tracker',
      subtitle: 'Log and manage your continuing professional development',
      onPress: () => navigation.navigate(ROUTES.CPD as never),
      badge: stats && stats.cpdHoursLogged < 35 ? 1 : undefined,
      glowColor: stats && stats.cpdHoursLogged >= 35 ? COLORS.secondary : undefined,
    },
    {
      id: 'standards',
      icon: 'standards',
      title: 'Professional Standards',
      subtitle: 'Review NMC codes and professional requirements',
      onPress: () => navigation.navigate(ROUTES.Standards as never),
      isNew: true,
    },
    {
      id: 'profile',
      icon: 'profile',
      title: 'My Profile',
      subtitle: 'Update your personal and professional information',
      onPress: handleProfilePress,
    },
  ];

  // Task action handler
  const handleTaskAction = () => {
    if (!nextTask) return;
    
    switch (nextTask.type) {
      case 'revalidation':
        navigation.navigate(ROUTES.RegistrationStatus as never);
        break;
      case 'cpd':
        navigation.navigate(ROUTES.CPD as never);
        break;
      case 'compliance':
        navigation.navigate(ROUTES.Standards as never);
        break;
      default:
        handleProfilePress();
    }
  };

  // Error handling
  const handleError = () => {
    Alert.alert(
      'Connection Error',
      error || 'Something went wrong. Please try again.',
      [
        { text: 'Retry', onPress: onRefresh },
        { text: 'OK', style: 'cancel' },
      ]
    );
  };

  useEffect(() => {
    if (error) {
      handleError();
    }
  }, [error]);

  // Deep linking support
  useEffect(() => {
    const handleDeepLink = (url: string) => {
      // Handle notification deep links
      if (url.includes('notifications')) {
        handleNotificationPress();
      }
    };

    const linkingListener = Linking.addEventListener('url', ({ url }) => {
      handleDeepLink(url);
    });

    return () => {
      linkingListener.remove();
    };
  }, []);

  // Loading state
  if (isLoading || !user || !stats) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your dashboard...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  const featureTiles = getFeatureTiles();

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        {/* Offline Banner */}
        {!netInfo.isConnected && <OfflineBanner />}

        {/* Header */}
        <HeaderBar
          greeting={greeting}
          userInitials={user.initials}
          notificationCount={3} // This would come from notification service
          onProfilePress={handleProfilePress}
          onNotificationPress={handleNotificationPress}
          onLogoPress={handleLogoPress}
        />

        {/* Main Content */}
        <Animated.View style={[styles.content, animatedStyle]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.white}
                titleColor={COLORS.white}
                title="Pull to refresh"
                colors={[COLORS.white]}
                progressBackgroundColor={COLORS.primary}
              />
            }
            scrollEventThrottle={16}
          >
            {/* Welcome Section */}
            <WelcomeSection userName={user.fullName} stats={stats} />

            {/* Next Task Card */}
            {nextTask && (
              <NextTaskCard task={nextTask} onAction={handleTaskAction} />
            )}

            {/* Feature Tiles */}
            <View style={styles.featuresSection}>
              <Text style={styles.sectionTitle}>Quick Access</Text>
              <View style={styles.tilesGrid}>
                {featureTiles.map((tile, index) => (
                  <FeatureTile key={tile.id} {...tile} index={index} />
                ))}
              </View>
            </View>

            {/* Quick Stats */}
            <QuickStats stats={stats} lastSync={lastSync} />

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
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  featuresSection: {
    paddingHorizontal: 20,
    marginTop: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  tilesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  bottomPadding: {
    height: 20,
  },
});

export default DashboardScreen;