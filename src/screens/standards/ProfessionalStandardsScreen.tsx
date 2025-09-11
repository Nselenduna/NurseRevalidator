import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { Standard, StandardCategory, SearchResult } from '../../types/standards.types';
import StandardsService from '../../services/standards/StandardsService';
import StandardsFilter from '../../components/standards/StandardsFilter';
import StandardCard from '../../components/standards/StandardCard';
import BackButton from '../../components/forms/BackButton';
import { COLORS } from '../../utils/constants/colors';

const { height: screenHeight } = Dimensions.get('window');

const ProfessionalStandardsScreen: React.FC = () => {
  const navigation = useNavigation();
  
  // State
  const [standards, setStandards] = useState<Standard[]>([]);
  const [categories, setCategories] = useState<StandardCategory[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedStandardId, setExpandedStandardId] = useState<string | null>(null);
  const [offlineStatus, setOfflineStatus] = useState<{
    isOffline: boolean;
    lastSync: Date | null;
  }>({ isOffline: false, lastSync: null });

  // Load initial data
  const loadData = useCallback(async (showRefresh = false) => {
    try {
      if (showRefresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }

      const [standardsData, categoriesData, statusData] = await Promise.all([
        StandardsService.getStandards(),
        StandardsService.getCategories(),
        StandardsService.getOfflineStatus(),
      ]);

      setStandards(standardsData);
      setCategories(categoriesData);
      setOfflineStatus(statusData);

      // Perform search with current parameters
      performSearch(searchQuery, selectedCategory, standardsData);
    } catch (error) {
      console.error('Failed to load standards data:', error);
      Alert.alert(
        'Error',
        'Failed to load professional standards. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [searchQuery, selectedCategory]);

  // Perform search
  const performSearch = useCallback(async (
    query: string,
    categoryId: string | null,
    standardsData?: Standard[]
  ) => {
    try {
      // Use provided data or current state
      const dataToSearch = standardsData || standards;
      
      if (dataToSearch.length === 0) return;

      const results = await StandardsService.searchStandards(
        query,
        categoryId || undefined
      );
      setSearchResults(results);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    }
  }, [standards]);

  // Handle search query change
  const handleSearchChange = useCallback((query: string) => {
    setSearchQuery(query);
    performSearch(query, selectedCategory);
  }, [selectedCategory, performSearch]);

  // Handle category selection
  const handleCategorySelect = useCallback((categoryId: string | null) => {
    setSelectedCategory(categoryId);
    performSearch(searchQuery, categoryId);
  }, [searchQuery, performSearch]);

  // Handle standard press (expand/collapse)
  const handleStandardPress = useCallback(async (standard: Standard) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setExpandedStandardId(prev => 
      prev === standard.id ? null : standard.id
    );
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Sync offline data
      await StandardsService.syncOfflineData();
      await loadData(true);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Refresh failed:', error);
      Alert.alert(
        'Sync Failed',
        'Unable to sync latest standards. You are viewing offline data.',
        [{ text: 'OK' }]
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    }
  }, [loadData]);

  // Format sync time
  const formatSyncTime = (date: Date | null): string => {
    if (!date) return 'Never synced';
    
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffHours === 0) return 'Just now';
    if (diffHours === 1) return '1 hour ago';
    if (diffHours < 24) return `${diffHours} hours ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return '1 day ago';
    return `${diffDays} days ago`;
  };

  // Get display data
  const getDisplayData = (): Standard[] => {
    if (searchQuery.trim() || selectedCategory) {
      return searchResults.map(result => result.standard);
    }
    return standards;
  };

  // Render standard item
  const renderStandardItem = ({ item }: { item: Standard }) => (
    <StandardCard
      standard={item}
      onPress={handleStandardPress}
      isExpanded={expandedStandardId === item.id}
    />
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>
        {searchQuery ? '🔍' : '📋'}
      </Text>
      <Text style={styles.emptyTitle}>
        {searchQuery
          ? 'No Standards Found'
          : 'No Standards Available'
        }
      </Text>
      <Text style={styles.emptyMessage}>
        {searchQuery
          ? `No standards match "${searchQuery}". Try a different search term or category.`
          : 'Pull to refresh to sync the latest professional standards.'
        }
      </Text>
    </View>
  );

  // Initial load
  useEffect(() => {
    loadData();
  }, []);

  const displayData = getDisplayData();

  return (
    <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Back Button */}
        <View style={styles.backButtonContainer}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Professional Standards</Text>
          <Text style={styles.subtitle}>
            NMC Guidelines & Best Practices
          </Text>
          
          {/* Sync Status */}
          <View style={styles.syncStatus}>
            <Text style={styles.syncIcon}>
              {offlineStatus.isOffline ? '📴' : '🔄'}
            </Text>
            <Text style={styles.syncText}>
              {offlineStatus.isOffline 
                ? 'Offline Mode' 
                : `Last sync: ${formatSyncTime(offlineStatus.lastSync)}`
              }
            </Text>
          </View>
        </View>

      {/* Search and Filter */}
      <StandardsFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={handleCategorySelect}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
      />

      {/* Results Summary */}
      {(searchQuery || selectedCategory) && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsText}>
            {displayData.length === 0 
              ? 'No results found'
              : `${displayData.length} standard${displayData.length !== 1 ? 's' : ''} found`
            }
          </Text>
        </View>
      )}

      {/* Standards List */}
      <FlatList
        data={displayData}
        renderItem={renderStandardItem}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          displayData.length === 0 && styles.emptyListContent,
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.white}
            title="Pull to sync latest standards"
            titleColor={COLORS.white}
            colors={[COLORS.white]}
            progressBackgroundColor={COLORS.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        getItemLayout={(data, index) => ({
          length: 200, // Approximate item height
          offset: 200 * index,
          index,
        })}
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
  backButtonContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 16,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  syncIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  syncText: {
    fontSize: 12,
    color: COLORS.white,
    fontWeight: '500',
  },
  resultsHeader: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
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
    marginBottom: 12,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default ProfessionalStandardsScreen;