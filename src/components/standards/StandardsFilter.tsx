import React from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { StandardsFilterProps } from '../../types/standards.types';
import { COLORS } from '../../utils/constants/colors';

const StandardsFilter: React.FC<StandardsFilterProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search professional standards..."
          placeholderTextColor="rgba(255, 255, 255, 0.6)"
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => onSearchChange('')}
          >
            <Text style={styles.clearIcon}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Filters */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.categoriesContainer}
        contentContainerStyle={styles.categoriesContent}
      >
        {/* All Categories */}
        <TouchableOpacity
          style={[
            styles.categoryChip,
            selectedCategory === null && styles.categoryChipSelected,
          ]}
          onPress={() => onCategorySelect(null)}
        >
          <LinearGradient
            colors={
              selectedCategory === null
                ? [COLORS.primary, COLORS.purple2]
                : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']
            }
            style={styles.categoryChipGradient}
          >
            <Text style={styles.categoryChipIcon}>📋</Text>
            <Text
              style={[
                styles.categoryChipText,
                selectedCategory === null && styles.categoryChipTextSelected,
              ]}
            >
              All
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Category Chips */}
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && styles.categoryChipSelected,
            ]}
            onPress={() => onCategorySelect(category.id)}
          >
            <LinearGradient
              colors={
                selectedCategory === category.id
                  ? [category.color, `${category.color}CC`]
                  : ['rgba(255, 255, 255, 0.2)', 'rgba(255, 255, 255, 0.1)']
              }
              style={styles.categoryChipGradient}
            >
              <Text style={styles.categoryChipIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.id && styles.categoryChipTextSelected,
                ]}
              >
                {category.name.split(' ')[0]} {/* Show first word for space */}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Search Results Summary */}
      {searchQuery.length > 0 && (
        <View style={styles.searchSummary}>
          <Text style={styles.searchSummaryText}>
            Searching for "{searchQuery}"
            {selectedCategory && (
              <Text style={styles.searchCategoryText}>
                {' '}in {categories.find(c => c.id === selectedCategory)?.name}
              </Text>
            )}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 12,
    opacity: 0.7,
  },
  searchInput: {
    flex: 1,
    height: 48,
    fontSize: 16,
    color: COLORS.white,
  },
  clearButton: {
    padding: 8,
  },
  clearIcon: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  categoriesContainer: {
    marginBottom: 8,
  },
  categoriesContent: {
    paddingHorizontal: 4,
    gap: 8,
  },
  categoryChip: {
    marginRight: 8,
    borderRadius: 20,
    overflow: 'hidden',
  },
  categoryChipSelected: {
    elevation: 4,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  categoryChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
  },
  categoryChipIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  categoryChipTextSelected: {
    color: COLORS.white,
    fontWeight: '600',
  },
  searchSummary: {
    paddingHorizontal: 8,
    marginTop: 8,
  },
  searchSummaryText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontStyle: 'italic',
  },
  searchCategoryText: {
    color: COLORS.white,
    fontWeight: '500',
  },
});

export default StandardsFilter;