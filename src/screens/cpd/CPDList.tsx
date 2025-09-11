import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withDelay,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { CPDEntry, CPDStats } from '../../types/cpd.types';
import { COLORS } from '../../utils/constants/colors';
import BackButton from '../../components/forms/BackButton';
import CPDEntryCard from '../../components/cpd/CPDEntryCard';
import CPDEntryForm from '../../components/cpd/CPDEntryForm';
import CPDService from '../../services/cpd/CPDService';
import useReducedMotion from '../../hooks/useReducedMotion';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface FilterOption {
  id: string;
  label: string;
  value: string | null;
}

const FILTER_OPTIONS: FilterOption[] = [
  { id: 'all', label: 'All', value: null },
  { id: 'course', label: 'Courses', value: 'course' },
  { id: 'conference', label: 'Conferences', value: 'conference' },
  { id: 'reflection', label: 'Reflection', value: 'reflection' },
  { id: 'mentoring', label: 'Mentoring', value: 'mentoring' },
  { id: 'other', label: 'Other', value: 'other' },
];

const CPDList: React.FC = () => {
  const navigation = useNavigation();
  const isReducedMotion = useReducedMotion();

  // State
  const [entries, setEntries] = useState<CPDEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<CPDEntry[]>([]);
  const [stats, setStats] = useState<CPDStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEntry, setEditingEntry] = useState<CPDEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Animations
  const fadeAnim = useSharedValue(0);
  const slideAnim = useSharedValue(30);
  const fabScale = useSharedValue(1);

  // Load CPD entries
  const loadEntries = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [entriesData, statsData] = await Promise.all([
        CPDService.getAllEntries(),
        CPDService.getStats(),
      ]);

      setEntries(entriesData);
      setStats(statsData);

      // Apply current filter
      applyFilter(entriesData, selectedFilter);

      // Animate entries
      if (!isReducedMotion) {
        fadeAnim.value = withTiming(1, { duration: 600 });
        slideAnim.value = withTiming(0, { duration: 600 });
      } else {
        fadeAnim.value = 1;
        slideAnim.value = 0;
      }

    } catch (error) {
      console.error('Failed to load CPD entries:', error);
      Alert.alert(
        'Error',
        'Failed to load CPD entries. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [selectedFilter, isReducedMotion]);

  // Apply filter to entries
  const applyFilter = useCallback((entriesList: CPDEntry[], filterValue: string) => {
    let filtered = entriesList;

    // Apply type filter
    if (filterValue !== 'all') {
      filtered = filtered.filter(entry => entry.type === filterValue);
    }

    // Apply search query if exists
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(query) ||
        entry.description?.toLowerCase().includes(query) ||
        entry.learningOutcomes?.some(outcome => 
          outcome.toLowerCase().includes(query)
        )
      );
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    setFilteredEntries(filtered);
  }, [searchQuery]);

  // Handle filter change
  const handleFilterChange = (filterId: string) => {
    setSelectedFilter(filterId);
    applyFilter(entries, filterId);
  };

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadEntries(true);
  }, [loadEntries]);

  // Handle entry edit
  const handleEditEntry = (entry: CPDEntry) => {
    setEditingEntry(entry);
    setShowForm(true);
  };

  // Handle entry delete
  const handleDeleteEntry = async (entryId: string) => {
    try {
      await CPDService.deleteEntry(entryId);
      await loadEntries();
      
      if (!isReducedMotion) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to delete entry:', error);
      Alert.alert('Error', 'Failed to delete CPD entry. Please try again.');
    }
  };

  // Handle entry save
  const handleSaveEntry = async (entryData: Partial<CPDEntry>) => {
    try {
      if (editingEntry) {
        // Update existing entry
        const updatedEntry = { ...editingEntry, ...entryData };
        await CPDService.updateEntry(updatedEntry);
      } else {
        // Create new entry
        const newEntry: Omit<CPDEntry, 'id' | 'createdAt' | 'updatedAt'> = {
          title: entryData.title!,
          date: entryData.date!,
          duration: entryData.duration!,
          type: entryData.type!,
          description: entryData.description || '',
          learningOutcomes: entryData.learningOutcomes || [],
          nmcCategories: entryData.nmcCategories || [],
          evidence: [],
          syncStatus: 'local',
          ...entryData,
        };
        await CPDService.createEntry(newEntry);
      }

      setShowForm(false);
      setEditingEntry(null);
      await loadEntries();

    } catch (error) {
      console.error('Failed to save entry:', error);
      throw error; // Let form handle the error
    }
  };

  // Handle form cancel
  const handleFormCancel = () => {
    setShowForm(false);
    setEditingEntry(null);
  };

  // Handle toggle expand
  const handleToggleExpand = (entryId: string) => {
    setExpandedEntryId(expandedEntryId === entryId ? null : entryId);
  };

  // Handle add new entry
  const handleAddNewEntry = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      fabScale.value = withSpring(0.95, {}, () => {
        fabScale.value = withSpring(1);
      });
    }
    setEditingEntry(null);
    setShowForm(true);
  };

  // Load data on focus
  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  // Initial load
  useEffect(() => {
    loadEntries();
  }, []);

  // Update filter when entries change
  useEffect(() => {
    applyFilter(entries, selectedFilter);
  }, [entries, selectedFilter, applyFilter]);

  // Render filter button
  const renderFilterButton = (option: FilterOption) => {
    const isSelected = selectedFilter === option.id;
    return (
      <TouchableOpacity
        key={option.id}
        style={[
          styles.filterButton,
          isSelected && styles.filterButtonSelected,
        ]}
        onPress={() => handleFilterChange(option.id)}
        accessibilityRole="button"
        accessibilityLabel={`Filter by ${option.label}`}
        accessibilityState={{ selected: isSelected }}
      >
        <Text
          style={[
            styles.filterButtonText,
            isSelected && styles.filterButtonTextSelected,
          ]}
        >
          {option.label}
        </Text>
      </TouchableOpacity>
    );
  };

  // Render entry item
  const renderEntryItem = ({ item, index }: { item: CPDEntry; index: number }) => (
    <CPDEntryCard
      entry={item}
      onEdit={handleEditEntry}
      onDelete={handleDeleteEntry}
      onToggleExpand={handleToggleExpand}
      isExpanded={expandedEntryId === item.id}
      style={{
        opacity: fadeAnim,
        transform: [
          {
            translateY: withDelay(
              index * 100,
              withTiming(slideAnim, { duration: 400 })
            ),
          },
        ],
      }}
    />
  );

  // Render stats header
  const renderStatsHeader = () => {
    if (!stats) return null;

    return (
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalHours.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Total Hours</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.totalEntries}</Text>
          <Text style={styles.statLabel}>Activities</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{stats.thisYearHours.toFixed(1)}</Text>
          <Text style={styles.statLabel}>This Year</Text>
        </View>
      </View>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📚</Text>
      <Text style={styles.emptyTitle}>
        {selectedFilter === 'all' ? 'No CPD Entries Yet' : 'No Matching Entries'}
      </Text>
      <Text style={styles.emptyMessage}>
        {selectedFilter === 'all'
          ? 'Start logging your professional development activities.'
          : 'Try adjusting your filter or add a new entry.'}
      </Text>
      {selectedFilter === 'all' && (
        <TouchableOpacity style={styles.emptyAction} onPress={handleAddNewEntry}>
          <Text style={styles.emptyActionText}>Add Your First Entry</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Animation styles
  const fabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: fabScale.value }],
  }));

  if (isLoading && entries.length === 0) {
    return (
      <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.header}>
            <BackButton onPress={() => navigation.goBack()} />
            <Text style={styles.title}>CPD Activities</Text>
          </View>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading CPD entries...</Text>
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
          <Text style={styles.title}>CPD Activities</Text>
        </View>

        {/* Stats */}
        {renderStatsHeader()}

        {/* Filters */}
        <View style={styles.filtersContainer}>
          <FlatList
            data={FILTER_OPTIONS}
            renderItem={({ item }) => renderFilterButton(item)}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersContent}
          />
        </View>

        {/* Entries List */}
        <FlatList
          data={filteredEntries}
          renderItem={renderEntryItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={[
            styles.listContent,
            filteredEntries.length === 0 && styles.emptyListContent,
          ]}
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
          ListEmptyComponent={renderEmptyState}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
        />

        {/* Floating Action Button */}
        <Animated.View style={[styles.fab, fabAnimatedStyle]}>
          <TouchableOpacity
            style={styles.fabButton}
            onPress={handleAddNewEntry}
            accessibilityRole="button"
            accessibilityLabel="Add new CPD entry"
            accessibilityHint="Tap to create a new CPD activity entry"
          >
            <LinearGradient
              colors={[COLORS.secondary || '#10B981', '#059669']}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={24} color={COLORS.white} />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>

        {/* CPD Entry Form Modal */}
        <CPDEntryForm
          entry={editingEntry}
          onSave={handleSaveEntry}
          onCancel={handleFormCancel}
          isVisible={showForm}
        />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.white,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 16,
  },
  filtersContainer: {
    marginBottom: 16,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterButtonSelected: {
    backgroundColor: COLORS.white,
    borderColor: COLORS.white,
  },
  filterButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '500',
  },
  filterButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Space for FAB
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
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
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  emptyAction: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyActionText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
  },
  fabButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default CPDList;