import React, { useEffect } from 'react';
import { Text, TouchableOpacity, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  withSpring,
  Easing,
  interpolateColor,
  runOnJS,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { FeatureTileData, IconName } from '../../types/dashboard.types';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

interface FeatureTileProps extends FeatureTileData {
  index: number; // For stagger delay
}

const FeatureTile: React.FC<FeatureTileProps> = ({
  icon,
  title,
  subtitle,
  badge,
  onPress,
  isNew = false,
  glowColor,
  index
}) => {
  const isReducedMotion = useReducedMotion();
  const scale = useSharedValue(1);
  const glowValue = useSharedValue(0);
  const entryValue = useSharedValue(0);
  const pressValue = useSharedValue(1);

  // Icon mapping
  const getIconEmoji = (iconName: string): string => {
    const iconMap: Record<string, string> = {
      registration: '📋',
      cpd: '📚',
      standards: '⚖️',
      profile: '👤',
      notifications: '🔔',
      settings: '⚙️',
      help: '❓',
    };
    return iconMap[iconName] || '📱';
  };

  useEffect(() => {
    // Entry animation with stagger
    const staggerDelay = index * 100;
    
    if (!isReducedMotion) {
      entryValue.value = withDelay(
        staggerDelay,
        withSpring(1, {
          damping: 15,
          stiffness: 150,
        })
      );

      // Glow pulse animation
      if (glowColor) {
        glowValue.value = withDelay(
          staggerDelay + 500,
          withRepeat(
            withSequence(
              withTiming(0, { duration: 1000 }),
              withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
              withTiming(0, { duration: 1000 })
            ),
            -1,
            true
          )
        );
      }
    } else {
      entryValue.value = 1;
    }

    return () => {
      cancelAnimation(entryValue);
      cancelAnimation(glowValue);
      cancelAnimation(scale);
      cancelAnimation(pressValue);
    };
  }, [index, glowColor, isReducedMotion]);

  const handlePressIn = () => {
    if (!isReducedMotion) {
      pressValue.value = withTiming(0.98, { duration: 100 });
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handlePressOut = () => {
    if (!isReducedMotion) {
      pressValue.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    }
  };

  const handlePress = () => {
    onPress();
  };

  const entryStyle = useAnimatedStyle(() => {
    return {
      opacity: entryValue.value,
      transform: [
        { scale: entryValue.value },
        { scale: pressValue.value },
      ],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    if (!glowColor) return {};
    
    return {
      shadowColor: glowColor,
      shadowOpacity: glowValue.value * 0.6,
      shadowRadius: 16 + (glowValue.value * 8),
      elevation: 4 + (glowValue.value * 4),
    };
  });

  const newBadgeStyle = useAnimatedStyle(() => {
    if (!isNew) return { opacity: 0 };
    
    const pulse = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.7, { duration: 1000 })
      ),
      -1,
      true
    );
    
    return {
      opacity: isReducedMotion ? 1 : pulse,
    };
  });

  return (
    <Animated.View style={[styles.container, entryStyle, glowStyle]}>
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${subtitle}`}
        accessibilityHint={`Navigate to ${title} section`}
        {...(badge && badge > 0 && { accessibilityValue: { text: `${badge} items` } })}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.tile}
        >
          {/* New Badge */}
          {isNew && (
            <Animated.View style={[styles.newBadge, newBadgeStyle]}>
              <Text style={styles.newText}>NEW</Text>
            </Animated.View>
          )}

          {/* Notification Badge */}
          {badge && badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {badge > 99 ? '99+' : badge.toString()}
              </Text>
            </View>
          )}

          {/* Icon */}
          <View style={[styles.iconContainer, glowColor && { backgroundColor: `${glowColor}20` }]}>
            <Text style={styles.icon}>{getIconEmoji(icon)}</Text>
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={1}>
              {title}
            </Text>
            <Text style={styles.subtitle} numberOfLines={2}>
              {subtitle}
            </Text>
          </View>

          {/* Arrow Indicator */}
          <View style={styles.arrow}>
            <Text style={styles.arrowIcon}>→</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minWidth: '48%',
    maxWidth: '48%',
    marginBottom: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  touchable: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  tile: {
    padding: 20,
    minHeight: 140,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.15)',
    position: 'relative',
  },
  newBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: COLORS.error,
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  newText: {
    fontSize: 8,
    fontWeight: 'bold',
    color: COLORS.white,
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: COLORS.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    zIndex: 1,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${COLORS.primary}20`,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  arrow: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: `${COLORS.primary}15`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowIcon: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
});

export default FeatureTile;