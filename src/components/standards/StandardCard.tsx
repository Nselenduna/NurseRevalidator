import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
} from 'react-native-reanimated';

import { StandardCardProps } from '../../types/standards.types';
import { COLORS } from '../../utils/constants/colors';

const StandardCard: React.FC<StandardCardProps> = ({
  standard,
  onPress,
  isExpanded = false,
}) => {
  const scaleValue = useSharedValue(1);
  const expandedHeight = useSharedValue(isExpanded ? 1 : 0);

  const handlePressIn = () => {
    scaleValue.value = withSpring(0.98);
  };

  const handlePressOut = () => {
    scaleValue.value = withSpring(1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const expandedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(expandedHeight.value, { duration: 300 }),
    height: expandedHeight.value === 0 ? 0 : undefined,
  }));

  React.useEffect(() => {
    expandedHeight.value = isExpanded ? 1 : 0;
  }, [isExpanded]);

  const getPriorityConfig = () => {
    switch (standard.priority) {
      case 'high':
        return {
          color: '#DC2626',
          label: 'High Priority',
          icon: '🔥',
        };
      case 'medium':
        return {
          color: '#F59E0B',
          label: 'Medium Priority',
          icon: '⚡',
        };
      case 'low':
        return {
          color: '#059669',
          label: 'Low Priority',
          icon: '📝',
        };
    }
  };

  const priorityConfig = getPriorityConfig();

  const formatLastUpdated = (date: Date): string => {
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Updated today';
    if (diffDays === 1) return 'Updated yesterday';
    if (diffDays < 30) return `Updated ${diffDays} days ago`;
    if (diffDays < 365) return `Updated ${Math.floor(diffDays / 30)} months ago`;
    return `Updated ${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        onPress={() => onPress(standard)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.15)', 'rgba(255, 255, 255, 0.05)']}
          style={styles.gradient}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryIcon}>{standard.category.icon}</Text>
              <Text style={styles.categoryName}>{standard.category.name}</Text>
            </View>
            
            <View style={[styles.priorityBadge, { backgroundColor: priorityConfig.color }]}>
              <Text style={styles.priorityIcon}>{priorityConfig.icon}</Text>
              <Text style={styles.priorityText}>{priorityConfig.label}</Text>
            </View>
          </View>

          {/* Title and Description */}
          <View style={styles.content}>
            <Text style={styles.title}>{standard.title}</Text>
            <Text style={styles.description} numberOfLines={3}>
              {standard.description}
            </Text>
          </View>

          {/* Keywords */}
          <View style={styles.keywordsContainer}>
            {standard.keywords.slice(0, 4).map((keyword, index) => (
              <View key={index} style={styles.keywordTag}>
                <Text style={styles.keywordText}>#{keyword}</Text>
              </View>
            ))}
            {standard.keywords.length > 4 && (
              <View style={styles.keywordTag}>
                <Text style={styles.keywordText}>+{standard.keywords.length - 4}</Text>
              </View>
            )}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.lastUpdated}>
              {formatLastUpdated(standard.lastUpdated)}
            </Text>
            <Text style={styles.expandHint}>
              {isExpanded ? 'Tap to collapse' : 'Tap to expand'}
            </Text>
          </View>

          {/* Expanded Content */}
          <Animated.View style={[styles.expandedContent, expandedStyle]}>
            <View style={styles.divider} />
            <Text style={styles.expandedTitle}>Full Content:</Text>
            <Text style={styles.fullContent}>{standard.content}</Text>
            
            {standard.relatedStandards.length > 0 && (
              <View style={styles.relatedSection}>
                <Text style={styles.relatedTitle}>Related Standards:</Text>
                <Text style={styles.relatedText}>
                  {standard.relatedStandards.join(', ')}
                </Text>
              </View>
            )}
          </Animated.View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  gradient: {
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    flex: 1,
    marginRight: 8,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.white,
    flex: 1,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  priorityIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: COLORS.white,
  },
  content: {
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },
  keywordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
    gap: 6,
  },
  keywordTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  keywordText: {
    fontSize: 11,
    color: COLORS.white,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastUpdated: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  expandHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontStyle: 'italic',
  },
  expandedContent: {
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginVertical: 16,
  },
  expandedTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 12,
  },
  fullContent: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    marginBottom: 16,
  },
  relatedSection: {
    marginTop: 12,
  },
  relatedTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 6,
  },
  relatedText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default StandardCard;