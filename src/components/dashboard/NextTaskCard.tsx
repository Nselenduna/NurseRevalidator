import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Task } from '../../types/dashboard.types';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

interface NextTaskCardProps {
  task: Task;
  onAction: () => void;
}

const NextTaskCard: React.FC<NextTaskCardProps> = ({ task, onAction }) => {
  const isReducedMotion = useReducedMotion();
  const shimmerValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    if (!isReducedMotion) {
      // Shimmer effect for CTA button
      shimmerValue.value = withRepeat(
        withSequence(
          withTiming(0, { duration: 0 }),
          withTiming(1, { duration: 1500, easing: Easing.linear }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );

      // Pulse animation for high priority tasks
      if (task.priority === 'high') {
        pulseValue.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 1000 }),
            withTiming(1.02, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
            withTiming(1, { duration: 1000 })
          ),
          -1,
          true
        );
      }
    }

    return () => {
      cancelAnimation(shimmerValue);
      cancelAnimation(pulseValue);
    };
  }, [isReducedMotion, task.priority]);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateX: interpolate(
            shimmerValue.value,
            [0, 1],
            [-100, 300]
          ),
        },
      ],
      opacity: shimmerValue.value * 0.6,
    };
  });

  const cardStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseValue.value }],
    };
  });

  const handlePress = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onAction();
  };

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return COLORS.error;
      case 'medium':
        return '#F59E0B'; // amber
      case 'low':
        return COLORS.secondary;
      default:
        return COLORS.primary;
    }
  };

  const getTypeIcon = (type: Task['type']) => {
    switch (type) {
      case 'revalidation':
        return '🔄';
      case 'cpd':
        return '📚';
      case 'compliance':
        return '✅';
      default:
        return '📋';
    }
  };

  const formatDueDate = (dueDate: Date) => {
    const now = new Date();
    const diffTime = dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return 'Overdue';
    } else if (diffDays === 0) {
      return 'Due today';
    } else if (diffDays === 1) {
      return 'Due tomorrow';
    } else if (diffDays <= 7) {
      return `Due in ${diffDays} days`;
    } else {
      return dueDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  };

  const isUrgent = () => {
    const now = new Date();
    const diffTime = task.dueDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Next Task</Text>
      
      <Animated.View style={[styles.card, cardStyle]}>
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
          style={styles.gradient}
        >
          {/* Priority Indicator */}
          {task.priority === 'high' && (
            <View style={[styles.priorityDot, { backgroundColor: getPriorityColor(task.priority) }]} />
          )}

          <View style={styles.taskHeader}>
            <View style={styles.taskInfo}>
              <View style={styles.taskTypeContainer}>
                <Text style={styles.taskIcon}>{getTypeIcon(task.type)}</Text>
                <Text style={styles.taskType}>{task.type.toUpperCase()}</Text>
              </View>
              
              <Text style={styles.taskTitle} numberOfLines={2}>
                {task.title}
              </Text>
              
              <Text style={[
                styles.dueDate,
                { color: isUrgent() ? COLORS.error : COLORS.textSecondary }
              ]}>
                {formatDueDate(task.dueDate)}
              </Text>
            </View>
          </View>

          {task.description && (
            <Text style={styles.description} numberOfLines={2}>
              {task.description}
            </Text>
          )}

          {/* Countdown Timer for urgent tasks */}
          {isUrgent() && (
            <View style={styles.countdownContainer}>
              <View style={styles.countdownDot} />
              <Text style={styles.countdownText}>
                {task.isOverdue ? 'Action required' : 'Urgent - Complete soon'}
              </Text>
            </View>
          )}

          {/* Action Button */}
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityLabel={`${task.actionLabel} for ${task.title}`}
            accessibilityHint="Double tap to start this task"
          >
            <LinearGradient
              colors={[COLORS.primary, COLORS.purple2]}
              style={styles.buttonGradient}
            >
              <Text style={styles.actionText}>{task.actionLabel}</Text>
              
              {/* Shimmer Effect */}
              {!isReducedMotion && (
                <Animated.View style={[styles.shimmer, shimmerStyle]}>
                  <LinearGradient
                    colors={['transparent', 'rgba(255, 255, 255, 0.4)', 'transparent']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.shimmerGradient}
                  />
                </Animated.View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  gradient: {
    padding: 20,
    borderWidth: 2,
    borderColor: 'rgba(107, 70, 193, 0.3)',
  },
  priorityDot: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 12,
    height: 12,
    borderRadius: 6,
    zIndex: 1,
  },
  taskHeader: {
    marginBottom: 12,
  },
  taskInfo: {
    flex: 1,
  },
  taskTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  taskIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  taskType: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  taskTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    lineHeight: 24,
    marginBottom: 6,
  },
  dueDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  countdownDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.error,
    marginRight: 8,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.error,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  actionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 100,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
  },
});

export default NextTaskCard;