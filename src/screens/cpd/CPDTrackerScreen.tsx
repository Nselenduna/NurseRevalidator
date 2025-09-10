import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Components
import AudioRecorder from '../../components/cpd/AudioRecorder';
import VoiceToTextEditor from '../../components/cpd/VoiceToTextEditor';
import BackButton from '../../components/forms/BackButton';
import PrimaryButton from '../../components/forms/PrimaryButton';
import OfflineBanner from '../../components/common/OfflineBanner';

// Services and Types
import CPDService from '../../services/cpd/CPDService';
import TranscriptionService from '../../services/transcription/TranscriptionService';
import { 
  CPDTrackerScreenProps, 
  CPDEntry, 
  AudioRecording,
  CPDStats,
  TranscriptMetadata,
  CPDType 
} from '../../types/cpd.types';
import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

// Networking
import { useNetInfo } from '@react-native-community/netinfo';

type ViewMode = 'list' | 'record' | 'transcript';

const CPDTrackerScreen: React.FC<CPDTrackerScreenProps> = ({ navigation }) => {
  const netInfo = useNetInfo();
  const isReducedMotion = useReducedMotion();
  const scrollViewRef = useRef<ScrollView>(null);

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [entries, setEntries] = useState<CPDEntry[]>([]);
  const [stats, setStats] = useState<CPDStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentRecording, setCurrentRecording] = useState<AudioRecording | null>(null);
  const [showNewEntryModal, setShowNewEntryModal] = useState(false);

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);
  const fabScale = useSharedValue(1);

  // Load data
  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      setError(null);

      const [entriesData, statsData] = await Promise.all([
        CPDService.getAllEntries(),
        CPDService.getStats(),
      ]);

      setEntries(entriesData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load CPD data:', err);
      setError('Failed to load CPD data. Please try again.');
    } finally {
      if (showLoading) setIsLoading(false);
      setRefreshing(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  // Screen entry animation
  useEffect(() => {
    if (!isReducedMotion && !isLoading) {
      fadeAnim.value = withDelay(200, withTiming(1, { duration: 600 }));
      slideAnim.value = withDelay(300, withTiming(0, { duration: 600 }));
    } else if (!isLoading) {
      fadeAnim.value = 1;
      slideAnim.value = 0;
    }
  }, [isLoading, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ translateY: slideAnim.value }],
  }));

  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  // Refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    loadData(false);
  };

  // Recording complete handler
  const handleRecordingComplete = (recording: AudioRecording) => {
    setCurrentRecording(recording);
    setViewMode('transcript');
  };

  // Save CPD entry
  const handleSaveCPDEntry = async (transcript: string, metadata: TranscriptMetadata) => {
    try {
      const learningOutcomes = TranscriptionService.extractLearningOutcomes(transcript);
      const title = TranscriptionService.generateSummary(transcript, 60);
      
      // Create new CPD entry
      const newEntry: Omit<CPDEntry, 'id' | 'createdAt' | 'updatedAt'> = {
        title: title || 'CPD Reflection',
        date: new Date(),
        duration: Math.max(0.5, currentRecording!.duration / 3600), // Convert to hours, minimum 0.5
        type: 'reflection',
        description: transcript,
        learningOutcomes,
        audioRecording: {
          ...currentRecording!,
          transcript,
        },
        evidence: [],
        nmcCategories: [], // User can add these later
        syncStatus: 'local',
        isStarred: false,
      };

      await CPDService.createEntry(newEntry);
      await loadData(false);
      
      setCurrentRecording(null);
      setViewMode('list');
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'CPD Entry Saved',
        'Your reflection has been saved successfully!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to save CPD entry:', error);
      Alert.alert(
        'Save Failed',
        'Failed to save your CPD entry. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  // FAB press handler
  const handleFABPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fabScale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    fabScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    
    setShowNewEntryModal(true);
  };

  // New entry type selection
  const handleNewEntryType = (type: 'voice' | 'manual') => {
    setShowNewEntryModal(false);
    
    if (type === 'voice') {
      setViewMode('record');
    } else {
      // Navigate to manual entry form (would be implemented)
      Alert.alert('Coming Soon', 'Manual entry form will be available in the next update!');
    }
  };

  // Entry item press
  const handleEntryPress = (entry: CPDEntry) => {
    Alert.alert(
      entry.title,
      `Duration: ${entry.duration} hours\nDate: ${entry.date.toLocaleDateString()}\n\n${entry.description.substring(0, 150)}...`,
      [
        { text: 'Close', style: 'cancel' },
        { text: 'Edit', onPress: () => {
          // Navigate to edit form (would be implemented)
          Alert.alert('Coming Soon', 'Edit functionality will be available in the next update!');
        }},
      ]
    );
  };

  // Cancel recording
  const handleCancelRecording = () => {
    setCurrentRecording(null);
    setViewMode('list');
  };

  // Format hours for display
  const formatHours = (hours: number): string => {
    if (hours >= 1) {
      return `${hours.toFixed(1)}h`;
    }
    return `${Math.round(hours * 60)}m`;
  };

  // Get progress color
  const getProgressColor = (percentage: number): string => {
    if (percentage >= 100) return COLORS.secondary;
    if (percentage >= 75) return '#F59E0B';
    return COLORS.error;
  };

  // Loading state
  if (isLoading) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading your CPD tracker...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Recording mode
  if (viewMode === 'record') {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
          
          <View style={styles.header}>
            <BackButton onPress={() => setViewMode('list')} />
            <Text style={styles.headerTitle}>Record Reflection</Text>
            <View style={styles.headerSpacer} />
          </View>

          <View style={styles.recordingContainer}>
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              maxDuration={3600} // 1 hour
            />
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Transcript editing mode
  if (viewMode === 'transcript' && currentRecording) {
    return (
      <VoiceToTextEditor
        audioRecording={currentRecording}
        onSave={handleSaveCPDEntry}
        onCancel={handleCancelRecording}
      />
    );
  }

  // Main list view
  return (
    <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        
        {/* Offline Banner */}
        {!netInfo.isConnected && <OfflineBanner />}

        {/* Header */}
        <View style={styles.header}>
          <BackButton onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>CPD Tracker</Text>
          <TouchableOpacity onPress={() => Alert.alert('Sync', 'Cloud sync coming soon!')}>
            <Text style={styles.syncButton}>📊</Text>
          </TouchableOpacity>
        </View>

        {/* Content */}
        <Animated.View style={[styles.content, animatedStyle]}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={COLORS.white}
                titleColor={COLORS.white}
                colors={[COLORS.white]}
                progressBackgroundColor={COLORS.primary}
              />
            }
          >
            {/* Stats Overview */}
            {stats && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Your Progress</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{formatHours(stats.hoursThisYear)}</Text>
                    <Text style={styles.statLabel}>This Year</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{stats.entriesCount}</Text>
                    <Text style={styles.statLabel}>Entries</Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressHeader}>
                    <Text style={styles.progressLabel}>Annual Progress</Text>
                    <Text style={[styles.progressPercentage, { color: getProgressColor(stats.compliancePercentage) }]}>
                      {stats.compliancePercentage}%
                    </Text>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${Math.min(100, stats.compliancePercentage)}%`,
                          backgroundColor: getProgressColor(stats.compliancePercentage)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {stats.hoursNeeded > 0 ? 
                      `${formatHours(stats.hoursNeeded)} needed to reach 35 hours` :
                      'Annual requirement completed! 🎉'
                    }
                  </Text>
                </View>
              </View>
            )}

            {/* Entries List */}
            <View style={styles.entriesContainer}>
              <Text style={styles.entriesTitle}>Recent Reflections</Text>
              
              {entries.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateEmoji}>📝</Text>
                  <Text style={styles.emptyStateTitle}>No CPD entries yet</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Start by recording your first reflection or adding a manual entry
                  </Text>
                </View>
              ) : (
                <View style={styles.entriesList}>
                  {entries.map((entry, index) => (
                    <TouchableOpacity
                      key={entry.id}
                      style={styles.entryCard}
                      onPress={() => handleEntryPress(entry)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.entryHeader}>
                        <View style={styles.entryTypeIndicator}>
                          <Text style={styles.entryTypeEmoji}>
                            {entry.type === 'reflection' ? '💭' :
                             entry.type === 'course' ? '📚' :
                             entry.type === 'conference' ? '🎯' :
                             entry.type === 'mentoring' ? '👥' : '📋'}
                          </Text>
                        </View>
                        <View style={styles.entryInfo}>
                          <Text style={styles.entryTitle} numberOfLines={2}>
                            {entry.title}
                          </Text>
                          <Text style={styles.entryMeta}>
                            {formatHours(entry.duration)} • {entry.date.toLocaleDateString()}
                            {entry.audioRecording && ' 🎤'}
                            {entry.isStarred && ' ⭐'}
                          </Text>
                        </View>
                        <View style={styles.syncIndicator}>
                          <Text style={styles.syncStatus}>
                            {entry.syncStatus === 'synced' ? '✓' :
                             entry.syncStatus === 'pending' ? '⏳' : '📱'}
                          </Text>
                        </View>
                      </View>
                      
                      <Text style={styles.entryDescription} numberOfLines={2}>
                        {entry.description}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </Animated.View>

        {/* Floating Action Button */}
        <Animated.View style={[styles.fabContainer, fabAnimatedStyle]}>
          <TouchableOpacity
            style={styles.fab}
            onPress={handleFABPress}
            activeOpacity={0.8}
          >
            <LinearGradient colors={[COLORS.secondary, '#10B981']} style={styles.fabGradient}>
              <Text style={styles.fabIcon}>+</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* New Entry Modal */}
        <Modal
          visible={showNewEntryModal}
          transparent
          animationType="fade"
          onRequestClose={() => setShowNewEntryModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Add New CPD Entry</Text>
              <Text style={styles.modalSubtitle}>Choose how you'd like to create your entry</Text>
              
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleNewEntryType('voice')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonIcon}>🎤</Text>
                  <Text style={styles.modalButtonText}>Voice Recording</Text>
                  <Text style={styles.modalButtonSubtext}>Record your reflection</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => handleNewEntryType('manual')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.modalButtonIcon}>✏️</Text>
                  <Text style={styles.modalButtonText}>Manual Entry</Text>
                  <Text style={styles.modalButtonSubtext}>Type your reflection</Text>
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowNewEntryModal(false)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  syncButton: {
    fontSize: 20,
    padding: 8,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FAB
  },
  recordingContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  
  // Stats
  statsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressContainer: {
    marginTop: 8,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  progressPercentage: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressBar: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 3,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },

  // Entries
  entriesContainer: {
    marginBottom: 24,
  },
  entriesTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  entriesList: {
    gap: 12,
  },
  entryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  entryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  entryTypeIndicator: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  entryTypeEmoji: {
    fontSize: 18,
  },
  entryInfo: {
    flex: 1,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 2,
  },
  entryMeta: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  syncIndicator: {
    marginLeft: 8,
  },
  syncStatus: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  entryDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
  },

  // FAB
  fabContainer: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    elevation: 8,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabIcon: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: 'bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(107, 70, 193, 0.7)',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButtons: {
    gap: 16,
    marginBottom: 20,
  },
  modalButton: {
    backgroundColor: 'rgba(107, 70, 193, 0.1)',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(107, 70, 193, 0.2)',
  },
  modalButtonIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 4,
  },
  modalButtonSubtext: {
    fontSize: 14,
    color: 'rgba(107, 70, 193, 0.7)',
  },
  modalCancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalCancelText: {
    fontSize: 16,
    color: 'rgba(107, 70, 193, 0.7)',
  },
  bottomPadding: {
    height: 20,
  },
});

export default CPDTrackerScreen;