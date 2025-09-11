import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import StethoscopeIcon from '../common/StethoscopeIcon';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

interface HeaderBarProps {
  greeting: string;
  userInitials: string;
  notificationCount?: number;
  onProfilePress: () => void;
  onNotificationPress: () => void;
  onLogoPress?: () => void;
}

const HeaderBar: React.FC<HeaderBarProps> = ({
  greeting,
  userInitials,
  notificationCount = 0,
  onProfilePress,
  onNotificationPress,
  onLogoPress
}) => {
  const isReducedMotion = useReducedMotion();

  const handleLogoPress = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onLogoPress?.();
  };

  const handleProfilePress = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onProfilePress();
  };

  const handleNotificationPress = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onNotificationPress();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        {/* Logo Section */}
        <View style={styles.logoContainer}>
          <StethoscopeIcon
            size={40}
            color={COLORS.white}
            pulseEnabled={true}
            onEasterEggTrigger={handleLogoPress}
          />
        </View>

        {/* Greeting Section */}
        <View style={styles.greetingContainer}>
          <Text style={styles.greeting} numberOfLines={1}>
            {greeting}
          </Text>
        </View>

        {/* Right Section - Profile Avatar & Notifications */}
        <View style={styles.rightSection}>
          {/* Notification Bell */}
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={handleNotificationPress}
            accessibilityRole="button"
            accessibilityLabel={`Notifications${notificationCount > 0 ? `, ${notificationCount} unread` : ''}`}
            accessibilityHint="Tap to view notifications"
          >
            <View style={styles.bellIcon}>
              <Text style={styles.bellEmoji}>🔔</Text>
              {notificationCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>
                    {notificationCount > 99 ? '99+' : notificationCount.toString()}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>

          {/* Profile Avatar */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handleProfilePress}
            accessibilityRole="button"
            accessibilityLabel="Profile picture"
            accessibilityHint="Tap to view your profile"
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userInitials}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 60,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  logoContainer: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 25,
  },
  greetingContainer: {
    flex: 1,
    marginHorizontal: 16,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  bellIcon: {
    position: 'relative',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellEmoji: {
    fontSize: 20,
  },
  notificationBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

export default HeaderBar;