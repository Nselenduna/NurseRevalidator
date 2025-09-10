import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
  interpolateColor,
  withSequence,
  withRepeat,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DashboardStats } from '../../types/dashboard.types';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

interface QuickStatsProps {
  stats: DashboardStats;
  lastSync?: Date | null;
}

interface StatItemProps {
  title: string;
  value: string | number;
  subtitle: string;
  color: string;
  icon: string;
  index: number;
  trend?: 'up' | 'down' | 'neutral';
}

const StatItem: React.FC<StatItemProps> = ({
  title,
  value,
  subtitle,
  color,
  icon,
  index,
  trend = 'neutral'
}) => {
  const isReducedMotion = useReducedMotion();
  const entryValue = useSharedValue(0);
  const pulseValue = useSharedValue(0);
  
  useEffect(() => {
    const staggerDelay = index * 150;
    
    if (!isReducedMotion) {
      // Entry animation
      entryValue.value = withDelay(
        staggerDelay,
        withSpring(1, {
          damping: 15,
          stiffness: 120,
        })
      );

      // Subtle pulse for important stats
      if (index === 0 || trend === 'up') {
        pulseValue.value = withDelay(
          staggerDelay + 1000,
          withRepeat(
            withSequence(
              withTiming(0, { duration: 2000 }),
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
      cancelAnimation(pulseValue);
    };
  }, [index, trend, isReducedMotion]);

  const entryStyle = useAnimatedStyle(() => {
    return {
      opacity: entryValue.value,
      transform: [
        { translateY: (1 - entryValue.value) * 20 },
        { scale: entryValue.value },
      ],
    };
  });

  const pulseStyle = useAnimatedStyle(() => {
    return {
      shadowColor: color,
      shadowOpacity: pulseValue.value * 0.3,
      shadowRadius: 8 + (pulseValue.value * 4),
      elevation: 2 + (pulseValue.value * 2),
    };
  });

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      default:
        return '';
    }
  };

  return (
    <Animated.View style={[styles.statItem, entryStyle, pulseStyle]}>
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.85)']}
        style={styles.statGradient}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${color}20` }]}>
          <Text style={styles.statIcon}>{icon}</Text>
          {trend !== 'neutral' && (
            <Text style={styles.trendIcon}>{getTrendIcon()}</Text>
          )}
        </View>
        
        <View style={styles.statContent}>
          <Text style={styles.statTitle}>{title}</Text>
          <Text style={[styles.statValue, { color }]}>{value}</Text>
          <Text style={styles.statSubtitle}>{subtitle}</Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

const QuickStats: React.FC<QuickStatsProps> = ({ stats, lastSync }) => {
  const formatLastSync = (date: Date | null | undefined) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const getComplianceColor = (score: number) => {
    if (score >= 90) return COLORS.secondary;
    if (score >= 75) return '#F59E0B';
    return COLORS.error;
  };

  const getRevalidationColor = (days: number) => {
    if (days <= 30) return COLORS.error;
    if (days <= 90) return '#F59E0B';
    return COLORS.secondary;
  };

  const statsData = [
    {
      title: 'CPD Hours',
      value: stats.cpdHoursLogged,
      subtitle: 'This cycle',
      color: COLORS.primary,
      icon: '📚',
      trend: 'neutral' as const,
    },
    {
      title: 'Days Left',
      value: stats.daysUntilRevalidation,
      subtitle: 'Until revalidation',
      color: getRevalidationColor(stats.daysUntilRevalidation),
      icon: '⏰',
      trend: stats.daysUntilRevalidation <= 90 ? 'down' as const : 'neutral' as const,
    },
    {
      title: 'Activities',
      value: stats.completedActivities,
      subtitle: 'Completed',
      color: COLORS.secondary,
      icon: '✅',
      trend: 'up' as const,
    },
    {
      title: 'Compliance',
      value: `${stats.complianceScore}%`,
      subtitle: 'Overall score',
      color: getComplianceColor(stats.complianceScore),
      icon: '🏆',
      trend: stats.complianceScore >= 85 ? 'up' as const : 'down' as const,
    },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.sectionTitle}>Quick Stats</Text>
        <Text style={styles.syncStatus}>
          Last updated: {formatLastSync(lastSync)}
        </Text>
      </View>
      
      <View style={styles.statsGrid}>
        {statsData.map((stat, index) => (
          <StatItem
            key={stat.title}
            {...stat}
            index={index}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  syncStatus: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statItem: {
    width: '48%',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statGradient: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.15)',
    minHeight: 100,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  statIcon: {
    fontSize: 18,
  },
  trendIcon: {
    fontSize: 12,
    position: 'absolute',
    right: -2,
    top: -2,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 2,
    fontWeight: '500',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  statSubtitle: {
    fontSize: 10,
    color: COLORS.textSecondary,
  },
});

export default QuickStats;