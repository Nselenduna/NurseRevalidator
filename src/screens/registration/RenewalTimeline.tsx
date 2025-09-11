import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { COLORS } from '../../utils/constants/colors';
import BackButton from '../../components/forms/BackButton';
import RegistrationService from '../../services/registration/RegistrationService';
import useReducedMotion from '../../hooks/useReducedMotion';

const { width: screenWidth } = Dimensions.get('window');

interface RenewalEvent {
  id: string;
  date: Date;
  type: 'registration' | 'renewal' | 'pending' | 'overdue';
  status: 'completed' | 'pending' | 'overdue' | 'cancelled';
  title: string;
  description?: string;
  nmcPin?: string;
  documents?: string[];
  notes?: string;
}

interface TimelineData {
  events: RenewalEvent[];
  nextRenewalDate?: Date;
  registrationDate: Date;
  currentStatus: 'active' | 'expiring_soon' | 'expired' | 'pending';
}

const RenewalTimeline: React.FC = () => {
  const navigation = useNavigation();
  const isReducedMotion = useReducedMotion();
  
  // State
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);

  // Load timeline data
  const loadTimelineData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      // Get registration data
      const registrationData = await RegistrationService.getRegistrationData();
      
      if (!registrationData) {
        setTimelineData(null);
        return;
      }

      // Generate timeline events
      const events: RenewalEvent[] = [];

      // Add initial registration event
      events.push({
        id: 'initial_registration',
        date: new Date(registrationData.registrationDate),
        type: 'registration',
        status: 'completed',
        title: 'Initial Registration',
        description: 'NMC registration completed',
        nmcPin: registrationData.nmcPin,
      });

      // Add renewal history
      if (registrationData.renewalHistory) {
        registrationData.renewalHistory.forEach((renewal, index) => {
          events.push({
            id: `renewal_${index}`,
            date: new Date(renewal.renewalDate),
            type: 'renewal',
            status: renewal.status as any,
            title: 'Registration Renewal',
            description: `3-year renewal period completed`,
            nmcPin: registrationData.nmcPin,
            documents: renewal.documents,
            notes: renewal.notes,
          });
        });
      }

      // Add next renewal event if applicable
      if (registrationData.expiryDate) {
        const expiryDate = new Date(registrationData.expiryDate);
        const now = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: 'pending' | 'overdue' = 'pending';
        let eventType: 'pending' | 'overdue' = 'pending';
        
        if (daysUntilExpiry < 0) {
          status = 'overdue';
          eventType = 'overdue';
        }

        events.push({
          id: 'next_renewal',
          date: expiryDate,
          type: eventType,
          status: status,
          title: daysUntilExpiry < 0 ? 'Renewal Overdue' : 'Next Renewal Due',
          description: daysUntilExpiry < 0 
            ? `Renewal was due ${Math.abs(daysUntilExpiry)} days ago`
            : `Renewal due in ${daysUntilExpiry} days`,
          nmcPin: registrationData.nmcPin,
        });
      }

      // Sort events by date
      events.sort((a, b) => a.date.getTime() - b.date.getTime());

      const timeline: TimelineData = {
        events,
        nextRenewalDate: registrationData.expiryDate ? new Date(registrationData.expiryDate) : undefined,
        registrationDate: new Date(registrationData.registrationDate),
        currentStatus: registrationData.status as any,
      };

      setTimelineData(timeline);

      // Animate timeline items
      if (!isReducedMotion) {
        fadeAnim.value = withTiming(1, { duration: 600 });
        slideAnim.value = withTiming(0, { 
          duration: 600, 
          easing: Easing.out(Easing.ease) 
        });
      } else {
        fadeAnim.value = 1;
        slideAnim.value = 0;
      }

    } catch (error) {
      console.error('Failed to load timeline data:', error);
      Alert.alert(
        'Error',
        'Failed to load renewal timeline. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [isReducedMotion]);

  // Initial load
  useEffect(() => {
    loadTimelineData();
  }, [loadTimelineData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadTimelineData(true);
  }, [loadTimelineData]);

  // Handle event press
  const handleEventPress = async (eventId: string) => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedEvent(selectedEvent === eventId ? null : eventId);
  };

  // Get status color
  const getStatusColor = (status: string, type: string): string => {
    switch (status) {
      case 'completed':
        return COLORS.success || '#10B981';
      case 'pending':
        return type === 'overdue' ? COLORS.error : COLORS.warning || '#F59E0B';
      case 'overdue':
        return COLORS.error;
      case 'cancelled':
        return '#6B7280';
      default:
        return COLORS.primary;
    }
  };

  // Get status icon
  const getStatusIcon = (status: string, type: string): string => {
    switch (status) {
      case 'completed':
        return '✅';
      case 'overdue':
        return '⚠️';
      case 'pending':
        return type === 'overdue' ? '🔴' : '⏳';
      case 'cancelled':
        return '❌';
      default:
        return '📅';
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

  // Calculate days difference
  const calculateDaysDifference = (date: Date): number => {
    const now = new Date();
    return Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Render timeline event
  const renderTimelineEvent = (event: RenewalEvent, index: number) => {
    const isSelected = selectedEvent === event.id;
    const statusColor = getStatusColor(event.status, event.type);
    const statusIcon = getStatusIcon(event.status, event.type);
    const daysDifference = calculateDaysDifference(event.date);

    const animatedStyle = useAnimatedStyle(() => {
      return {
        opacity: fadeAnim.value,
        transform: [{
          translateY: withDelay(
            index * 100,
            withTiming(slideAnim.value, { duration: 400 })
          )
        }],
      };
    });

    return (
      <Animated.View key={event.id} style={[animatedStyle]}>
        <TouchableOpacity
          style={styles.timelineItem}
          onPress={() => handleEventPress(event.id)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={`${event.title} on ${formatDate(event.date)}`}
          accessibilityHint={`Status: ${event.status}. Tap for details.`}
        >
          {/* Timeline connector */}
          <View style={styles.timelineConnector}>
            <View style={[styles.timelineDot, { backgroundColor: statusColor }]}>
              <Text style={styles.timelineIcon}>{statusIcon}</Text>
            </View>
            {index < (timelineData?.events.length || 0) - 1 && (
              <View style={styles.timelineLine} />
            )}
          </View>

          {/* Event content */}
          <View style={[styles.eventCard, isSelected && styles.eventCardSelected]}>
            <View style={styles.eventHeader}>
              <Text style={styles.eventTitle}>{event.title}</Text>
              <Text style={styles.eventDate}>{formatDate(event.date)}</Text>
            </View>
            
            <Text style={[styles.eventStatus, { color: statusColor }]}>
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </Text>

            {event.description && (
              <Text style={styles.eventDescription}>{event.description}</Text>
            )}

            {/* Additional info for future/overdue events */}
            {(event.type === 'pending' || event.type === 'overdue') && (
              <View style={styles.countdownContainer}>
                <Text style={[
                  styles.countdownText,
                  { color: daysDifference < 0 ? COLORS.error : COLORS.warning }
                ]}>
                  {daysDifference < 0 
                    ? `${Math.abs(daysDifference)} days overdue`
                    : `${daysDifference} days remaining`
                  }
                </Text>
              </View>
            )}

            {/* Expanded details */}
            {isSelected && (
              <View style={styles.eventDetails}>
                {event.nmcPin && (
                  <Text style={styles.detailText}>NMC PIN: {event.nmcPin}</Text>
                )}
                {event.documents && event.documents.length > 0 && (
                  <Text style={styles.detailText}>
                    Documents: {event.documents.length} attached
                  </Text>
                )}
                {event.notes && (
                  <Text style={styles.detailText}>Notes: {event.notes}</Text>
                )}
                
                {event.type === 'pending' && (
                  <TouchableOpacity style={styles.actionButton}>
                    <Text style={styles.actionButtonText}>Prepare Renewal</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyTitle}>No Registration Data</Text>
      <Text style={styles.emptyMessage}>
        Complete your registration to view renewal timeline.
      </Text>
    </View>
  );

  if (isLoading && !timelineData) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={styles.title}>Renewal Timeline</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading timeline...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.title}>Renewal Timeline</Text>
        </View>

        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.white}
              title="Pull to refresh"
              titleColor={COLORS.white}
            />
          }
        >
          {timelineData && timelineData.events.length > 0 ? (
            <>
              {/* Timeline summary */}
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Registration Summary</Text>
                <Text style={styles.summaryText}>
                  Registered: {formatDate(timelineData.registrationDate)}
                </Text>
                {timelineData.nextRenewalDate && (
                  <Text style={styles.summaryText}>
                    Next Renewal: {formatDate(timelineData.nextRenewalDate)}
                  </Text>
                )}
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(timelineData.currentStatus, '') }
                ]}>
                  <Text style={styles.statusBadgeText}>
                    {timelineData.currentStatus.replace('_', ' ').toUpperCase()}
                  </Text>
                </View>
              </View>

              {/* Timeline events */}
              <View style={styles.timelineContainer}>
                {timelineData.events.map((event, index) => 
                  renderTimelineEvent(event, index)
                )}
              </View>
            </>
          ) : (
            renderEmptyState()
          )}
        </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  statusBadgeText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: 'bold',
  },
  timelineContainer: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineConnector: {
    alignItems: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  timelineIcon: {
    fontSize: 18,
  },
  timelineLine: {
    width: 2,
    height: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginTop: 8,
  },
  eventCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  eventCardSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  eventDate: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  eventStatus: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  eventDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  countdownContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  countdownText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  eventDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.6,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default RenewalTimeline;