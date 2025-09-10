import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

import { RenewalCountdownProps } from '../../types/registration.types';
import { COLORS } from '../../utils/constants/colors';

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const RenewalCountdown: React.FC<RenewalCountdownProps> = ({
  targetDate,
  onExpire,
  status,
}) => {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>({ 
    days: 0, 
    hours: 0, 
    minutes: 0, 
    seconds: 0 
  });
  const [isExpired, setIsExpired] = useState(false);
  
  const pulseValue = useSharedValue(1);
  const progressValue = useSharedValue(0);

  // Calculate time remaining
  const calculateTimeRemaining = (target: Date): TimeRemaining => {
    const now = new Date().getTime();
    const targetTime = target.getTime();
    const difference = targetTime - now;

    if (difference <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0 };
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
  };

  // Update countdown every second
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(targetDate);
      setTimeRemaining(remaining);

      if (remaining.days === 0 && remaining.hours === 0 && remaining.minutes === 0 && remaining.seconds === 0) {
        if (!isExpired) {
          setIsExpired(true);
          onExpire?.();
        }
      }

      // Calculate progress (assuming 3 years = 1095 days total registration period)
      const totalDays = 1095; // 3 years
      const daysRemaining = remaining.days;
      const progress = Math.max(0, Math.min(1, (totalDays - daysRemaining) / totalDays));
      progressValue.value = withTiming(progress, { duration: 1000 });

    }, 1000);

    return () => clearInterval(interval);
  }, [targetDate, isExpired, onExpire]);

  // Pulse animation for urgent countdown
  useEffect(() => {
    if (timeRemaining.days < 30 && !isExpired) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.05, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        false
      );
    } else {
      pulseValue.value = withTiming(1, { duration: 300 });
    }
  }, [timeRemaining.days, isExpired]);

  // Get color scheme based on time remaining
  const getColorScheme = () => {
    if (isExpired) {
      return {
        colors: ['#DC2626', '#B91C1C'],
        textColor: '#FEE2E2',
        accentColor: '#DC2626',
      };
    }
    
    if (timeRemaining.days <= 7) {
      return {
        colors: ['#DC2626', '#B91C1C'],
        textColor: '#FEE2E2',
        accentColor: '#DC2626',
      };
    }
    
    if (timeRemaining.days <= 30) {
      return {
        colors: ['#F59E0B', '#D97706'],
        textColor: '#FEF3C7',
        accentColor: '#F59E0B',
      };
    }
    
    return {
      colors: [COLORS.secondary, '#10B981'],
      textColor: '#D1FAE5',
      accentColor: COLORS.secondary,
    };
  };

  const colorScheme = getColorScheme();

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value * 100}%`,
  }));

  const formatTimeUnit = (value: number, unit: string): string => {
    return `${value.toString().padStart(2, '0')} ${unit}${value !== 1 ? 's' : ''}`;
  };

  if (isExpired) {
    return (
      <Animated.View style={[styles.container, pulseStyle]}>
        <LinearGradient colors={colorScheme.colors} style={styles.gradient}>
          <View style={styles.expiredContainer}>
            <Text style={styles.expiredIcon}>⏰</Text>
            <Text style={[styles.expiredTitle, { color: colorScheme.textColor }]}>
              Registration Expired
            </Text>
            <Text style={[styles.expiredSubtitle, { color: colorScheme.textColor }]}>
              Please renew immediately
            </Text>
          </View>
        </LinearGradient>
      </Animated.View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={colorScheme.colors} style={styles.gradient}>
        <Animated.View style={pulseStyle}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colorScheme.textColor }]}>
              Registration Renewal
            </Text>
            <Text style={[styles.subtitle, { color: colorScheme.textColor }]}>
              {targetDate.toLocaleDateString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.countdownContainer}>
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, { color: colorScheme.textColor }]}>
                {timeRemaining.days.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.timeLabel, { color: colorScheme.textColor }]}>
                Days
              </Text>
            </View>
            
            <Text style={[styles.separator, { color: colorScheme.textColor }]}>:</Text>
            
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, { color: colorScheme.textColor }]}>
                {timeRemaining.hours.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.timeLabel, { color: colorScheme.textColor }]}>
                Hours
              </Text>
            </View>
            
            <Text style={[styles.separator, { color: colorScheme.textColor }]}>:</Text>
            
            <View style={styles.timeUnit}>
              <Text style={[styles.timeValue, { color: colorScheme.textColor }]}>
                {timeRemaining.minutes.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.timeLabel, { color: colorScheme.textColor }]}>
                Minutes
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={[styles.progressTrack, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { backgroundColor: 'rgba(255, 255, 255, 0.8)' },
                  progressStyle
                ]} 
              />
            </View>
            <Text style={[styles.progressText, { color: colorScheme.textColor }]}>
              Registration period progress
            </Text>
          </View>
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    marginVertical: 8,
  },
  gradient: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    opacity: 0.9,
  },
  countdownContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  timeUnit: {
    alignItems: 'center',
    minWidth: 60,
  },
  timeValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontVariant: ['tabular-nums'],
  },
  timeLabel: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 4,
  },
  separator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 8,
    opacity: 0.7,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    opacity: 0.8,
  },
  expiredContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  expiredIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  expiredTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  expiredSubtitle: {
    fontSize: 16,
    opacity: 0.9,
  },
});

export default RenewalCountdown;