import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { CPDEntry } from '../../types/cpd.types';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

const { width: screenWidth } = Dimensions.get('window');

interface CPDEntryCardProps {
  entry: CPDEntry;
  onEdit: (entry: CPDEntry) => void;
  onDelete: (entryId: string) => void;
  onToggleExpand?: (entryId: string) => void;
  isExpanded?: boolean;
  style?: any;
}

const CPDEntryCard: React.FC<CPDEntryCardProps> = ({
  entry,
  onEdit,
  onDelete,
  onToggleExpand,
  isExpanded = false,
  style,
}) => {
  const isReducedMotion = useReducedMotion();
  const [isPressed, setIsPressed] = useState(false);

  // Animations
  const scaleValue = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const expandValue = useSharedValue(isExpanded ? 1 : 0);

  // Update expand animation when prop changes
  React.useEffect(() => {
    if (!isReducedMotion) {
      expandValue.value = withTiming(isExpanded ? 1 : 0, {
        duration: 300,
        easing: Easing.out(Easing.ease),
      });
    } else {
      expandValue.value = isExpanded ? 1 : 0;
    }
  }, [isExpanded, isReducedMotion]);

  // Handle press animations
  const handlePressIn = () => {
    setIsPressed(true);
    if (!isReducedMotion) {
      scaleValue.value = withSpring(0.98);
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
    if (!isReducedMotion) {
      scaleValue.value = withSpring(1);
    }
  };

  // Handle card tap
  const handleCardPress = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onToggleExpand?.(entry.id);
  };

  // Handle edit
  const handleEdit = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onEdit(entry);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }

    Alert.alert(
      'Delete CPD Entry',
      `Are you sure you want to delete "${entry.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(entry.id),
        },
      ]
    );
  };

  // Get category color
  const getCategoryColor = (type: string): string => {
    switch (type) {
      case 'course':
        return '#10B981';
      case 'conference':
        return '#3B82F6';
      case 'reflection':
        return '#8B5CF6';
      case 'mentoring':
        return '#F59E0B';
      case 'other':
        return '#6B7280';
      default:
        return COLORS.primary;
    }
  };

  // Get category icon
  const getCategoryIcon = (type: string): string => {
    switch (type) {
      case 'course':
        return 'school-outline';
      case 'conference':
        return 'people-outline';
      case 'reflection':
        return 'bulb-outline';
      case 'mentoring':
        return 'person-add-outline';
      case 'other':
        return 'document-text-outline';
      default:
        return 'bookmark-outline';
    }
  };

  // Format date
  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format duration
  const formatDuration = (hours: number): string => {
    if (hours < 1) {
      return `${Math.round(hours * 60)} mins`;
    }
    return hours % 1 === 0 ? `${hours}h` : `${hours.toFixed(1)}h`;
  };

  // Animation styles
  const cardAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleValue.value }],
  }));

  const expandAnimatedStyle = useAnimatedStyle(() => ({
    height: expandValue.value * 120, // Approximate expanded content height
    opacity: expandValue.value,
  }));

  const chevronAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${withTiming(isExpanded ? 180 : 0, { duration: 200 })}deg`,
      },
    ],
  }));

  return (
    <Animated.View style={[cardAnimatedStyle, style]}>
      <TouchableOpacity
        style={styles.card}
        onPress={handleCardPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        accessibilityRole="button"
        accessibilityLabel={`CPD Entry: ${entry.title}`}
        accessibilityHint={`${entry.duration} hours on ${formatDate(entry.date)}. Tap to expand details.`}
      >
        <LinearGradient
          colors={['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.9)']}
          style={styles.cardGradient}
        >
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.headerLeft}>
              <View style={[styles.categoryIcon, { backgroundColor: getCategoryColor(entry.type) }]}>
                <Ionicons
                  name={getCategoryIcon(entry.type) as any}
                  size={18}
                  color={COLORS.white}
                />
              </View>
              <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={2}>
                  {entry.title}
                </Text>
                <Text style={styles.category}>
                  {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.headerRight}>
              <View style={styles.durationBadge}>
                <Text style={styles.durationText}>{formatDuration(entry.duration)}</Text>
              </View>
              <Animated.View style={chevronAnimatedStyle}>
                <Ionicons name="chevron-down" size={20} color="#6B7280" />
              </Animated.View>
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.metadata}>
            <View style={styles.metadataItem}>
              <Ionicons name="calendar-outline" size={14} color="#6B7280" />
              <Text style={styles.metadataText}>{formatDate(entry.date)}</Text>
            </View>
            
            {entry.nmcCategories && entry.nmcCategories.length > 0 && (
              <View style={styles.metadataItem}>
                <Ionicons name="star-outline" size={14} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {entry.nmcCategories.length} NMC {entry.nmcCategories.length === 1 ? 'category' : 'categories'}
                </Text>
              </View>
            )}

            {entry.evidence && entry.evidence.length > 0 && (
              <View style={styles.metadataItem}>
                <Ionicons name="attach-outline" size={14} color="#6B7280" />
                <Text style={styles.metadataText}>
                  {entry.evidence.length} {entry.evidence.length === 1 ? 'file' : 'files'}
                </Text>
              </View>
            )}
          </View>

          {/* Expanded Content */}
          {isExpanded && (
            <Animated.View style={[styles.expandedContent, expandAnimatedStyle]}>
              {/* Description */}
              {entry.description && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Description</Text>
                  <Text style={styles.descriptionText} numberOfLines={3}>
                    {entry.description}
                  </Text>
                </View>
              )}

              {/* Learning Outcomes */}
              {entry.learningOutcomes && entry.learningOutcomes.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Learning Outcomes</Text>
                  <Text style={styles.outcomesText} numberOfLines={2}>
                    {entry.learningOutcomes.slice(0, 2).join(' • ')}
                    {entry.learningOutcomes.length > 2 && ` • +${entry.learningOutcomes.length - 2} more`}
                  </Text>
                </View>
              )}

              {/* Voice Recording Indicator */}
              {entry.audioRecording && (
                <View style={styles.section}>
                  <View style={styles.audioIndicator}>
                    <Ionicons name="mic-outline" size={16} color={COLORS.primary} />
                    <Text style={styles.audioText}>
                      Voice recording ({Math.round(entry.audioRecording.duration / 60)}min)
                    </Text>
                  </View>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.editButton]}
                  onPress={handleEdit}
                  accessibilityRole="button"
                  accessibilityLabel="Edit CPD entry"
                >
                  <Ionicons name="pencil-outline" size={16} color={COLORS.primary} />
                  <Text style={styles.editButtonText}>Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionButton, styles.deleteButton]}
                  onPress={handleDelete}
                  accessibilityRole="button"
                  accessibilityLabel="Delete CPD entry"
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* Sync Status Indicator */}
          <View style={styles.syncStatus}>
            <View style={[
              styles.syncIndicator,
              {
                backgroundColor: entry.syncStatus === 'synced'
                  ? '#10B981'
                  : entry.syncStatus === 'pending'
                  ? '#F59E0B'
                  : '#6B7280'
              }
            ]} />
            <Text style={styles.syncText}>
              {entry.syncStatus === 'synced' ? 'Synced' :
               entry.syncStatus === 'pending' ? 'Pending' : 'Local'}
            </Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardGradient: {
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    lineHeight: 22,
  },
  category: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  durationBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  durationText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  metadata: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 8,
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metadataText: {
    fontSize: 12,
    color: '#6B7280',
  },
  expandedContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  descriptionText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  outcomesText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  audioIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 8,
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  audioText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  editButton: {
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
    borderColor: COLORS.primary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    marginTop: 8,
    gap: 4,
  },
  syncIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  syncText: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
  },
});

export default CPDEntryCard;