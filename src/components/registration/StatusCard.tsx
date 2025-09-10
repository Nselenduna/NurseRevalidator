import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { StatusCardProps } from '../../types/registration.types';
import { COLORS } from '../../utils/constants/colors';
import RegistrationService from '../../services/registration/RegistrationService';

const StatusCard: React.FC<StatusCardProps> = ({
  nmcPin,
  status,
  expiryDate,
  lastRenewal,
  verificationStatus,
}) => {
  const scaleValue = useSharedValue(1);
  const pulseValue = useSharedValue(1);

  // Status-based styling
  const getStatusConfig = () => {
    switch (status) {
      case 'active':
        return {
          colors: [COLORS.secondary, '#10B981'],
          icon: '✓',
          title: 'Active Registration',
          textColor: '#059669',
          borderColor: COLORS.secondary,
        };
      case 'expiring_soon':
        return {
          colors: ['#F59E0B', '#D97706'],
          icon: '⚠',
          title: 'Expiring Soon',
          textColor: '#D97706',
          borderColor: '#F59E0B',
        };
      case 'expired':
        return {
          colors: ['#DC2626', '#B91C1C'],
          icon: '✕',
          title: 'Expired',
          textColor: '#DC2626',
          borderColor: '#DC2626',
        };
      case 'pending':
        return {
          colors: [COLORS.primary, COLORS.purple2],
          icon: '◐',
          title: 'Renewal Pending',
          textColor: COLORS.primary,
          borderColor: COLORS.primary,
        };
      default:
        return {
          colors: [COLORS.primary, COLORS.purple2],
          icon: '?',
          title: 'Unknown Status',
          textColor: COLORS.primary,
          borderColor: COLORS.primary,
        };
    }
  };

  const statusConfig = getStatusConfig();
  const formattedPin = RegistrationService.formatNMCPin(nmcPin);
  const daysUntilExpiry = RegistrationService.getDaysUntilExpiry(expiryDate);

  // Pulse animation for pending status
  React.useEffect(() => {
    if (status === 'pending') {
      const animate = () => {
        pulseValue.value = withSequence(
          withTiming(1.05, { duration: 800 }),
          withTiming(1, { duration: 800 })
        );
      };
      animate();
      const interval = setInterval(animate, 1600);
      return () => clearInterval(interval);
    }
  }, [status]);

  const handlePress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scaleValue.value = withSequence(
      withSpring(0.98, { damping: 15, stiffness: 300 }),
      withSpring(1, { damping: 15, stiffness: 300 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const getVerificationIcon = () => {
    switch (verificationStatus) {
      case 'verified':
        return '🛡️';
      case 'pending':
        return '⏳';
      case 'failed':
        return '❌';
      default:
        return '❓';
    }
  };

  return (
    <Animated.View style={[animatedStyle, status === 'pending' && pulseStyle]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={[styles.container, { borderColor: statusConfig.borderColor }]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
            style={styles.background}
          />
          
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.statusIndicator}>
              <Text style={styles.statusIcon}>{statusConfig.icon}</Text>
              <Text style={[styles.statusTitle, { color: statusConfig.textColor }]}>
                {statusConfig.title}
              </Text>
            </View>
            <View style={styles.verificationBadge}>
              <Text style={styles.verificationIcon}>{getVerificationIcon()}</Text>
            </View>
          </View>

          {/* NMC PIN */}
          <View style={styles.pinSection}>
            <Text style={styles.pinLabel}>NMC PIN</Text>
            <Text style={styles.pinValue}>{formattedPin}</Text>
          </View>

          {/* Expiry Information */}
          <View style={styles.expirySection}>
            <View style={styles.expiryItem}>
              <Text style={styles.expiryLabel}>Expires</Text>
              <Text style={styles.expiryValue}>
                {expiryDate.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.expiryItem}>
              <Text style={styles.expiryLabel}>Days remaining</Text>
              <Text style={[
                styles.expiryValue,
                daysUntilExpiry < 30 && { color: '#DC2626' },
                daysUntilExpiry < 0 && { color: '#DC2626', fontWeight: 'bold' },
              ]}>
                {daysUntilExpiry < 0 ? 'EXPIRED' : `${daysUntilExpiry} days`}
              </Text>
            </View>
          </View>

          {/* Last Renewal */}
          {lastRenewal && (
            <View style={styles.renewalSection}>
              <Text style={styles.renewalLabel}>Last renewed</Text>
              <Text style={styles.renewalValue}>
                {lastRenewal.toLocaleDateString('en-GB', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {/* Verification Status */}
          <View style={styles.verificationSection}>
            <Text style={styles.verificationLabel}>
              Verification: {verificationStatus.charAt(0).toUpperCase() + verificationStatus.slice(1)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: 'hidden',
    marginVertical: 8,
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  verificationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    padding: 8,
  },
  verificationIcon: {
    fontSize: 16,
  },
  pinSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  pinLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  pinValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 2,
  },
  expirySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  expiryItem: {
    flex: 1,
  },
  expiryLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  expiryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  renewalSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  renewalLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  renewalValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.white,
  },
  verificationSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  verificationLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
  },
});

export default StatusCard;