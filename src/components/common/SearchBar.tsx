import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Keyboard,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  withSpring,
  interpolateColor,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

import { COLORS } from '../../utils/constants/colors';
import useReducedMotion from '../../hooks/useReducedMotion';

const { width: screenWidth } = Dimensions.get('window');

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChangeText: (text: string) => void;
  onSubmit?: (text: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  showHistory?: boolean;
  searchHistory?: string[];
  onClearHistory?: () => void;
  showVoiceInput?: boolean;
  onVoiceInput?: () => void;
  debounceMs?: number;
  maxHistoryItems?: number;
  style?: any;
  inputStyle?: any;
  autoFocus?: boolean;
  returnKeyType?: 'search' | 'done' | 'go';
  clearButtonMode?: 'never' | 'while-editing' | 'unless-editing' | 'always';
}

const SearchBar: React.FC<SearchBarProps> = ({
  placeholder = 'Search...',
  value = '',
  onChangeText,
  onSubmit,
  onFocus,
  onBlur,
  showHistory = true,
  searchHistory = [],
  onClearHistory,
  showVoiceInput = false,
  onVoiceInput,
  debounceMs = 300,
  maxHistoryItems = 10,
  style,
  inputStyle,
  autoFocus = false,
  returnKeyType = 'search',
  clearButtonMode = 'while-editing',
}) => {
  const isReducedMotion = useReducedMotion();
  
  // State
  const [isFocused, setIsFocused] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [localValue, setLocalValue] = useState(value);
  
  // Refs
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<NodeJS.Timeout>();
  
  // Animations
  const focusAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(1);
  const historyAnim = useSharedValue(0);
  
  // Debounced text change
  const debouncedOnChangeText = useCallback((text: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      onChangeText(text);
    }, debounceMs);
  }, [onChangeText, debounceMs]);
  
  // Handle text input changes
  const handleTextChange = (text: string) => {
    setLocalValue(text);
    debouncedOnChangeText(text);
  };
  
  // Handle focus
  const handleFocus = () => {
    setIsFocused(true);
    
    if (!isReducedMotion) {
      focusAnim.value = withSpring(1);
      scaleAnim.value = withSpring(1.02);
    } else {
      focusAnim.value = 1;
      scaleAnim.value = 1.02;
    }
    
    onFocus?.();
    
    // Show history if available and no current text
    if (showHistory && searchHistory.length > 0 && !localValue.trim()) {
      setShowHistoryModal(true);
      if (!isReducedMotion) {
        historyAnim.value = withTiming(1, { duration: 200 });
      } else {
        historyAnim.value = 1;
      }
    }
  };
  
  // Handle blur
  const handleBlur = () => {
    setIsFocused(false);
    
    if (!isReducedMotion) {
      focusAnim.value = withSpring(0);
      scaleAnim.value = withSpring(1);
    } else {
      focusAnim.value = 0;
      scaleAnim.value = 1;
    }
    
    onBlur?.();
    
    // Hide history modal
    if (showHistoryModal) {
      if (!isReducedMotion) {
        historyAnim.value = withTiming(0, { duration: 150 }, () => {
          setShowHistoryModal(false);
        });
      } else {
        historyAnim.value = 0;
        setShowHistoryModal(false);
      }
    }
  };
  
  // Handle submit
  const handleSubmit = () => {
    const trimmedValue = localValue.trim();
    if (trimmedValue) {
      onSubmit?.(trimmedValue);
      inputRef.current?.blur();
    }
  };
  
  // Handle clear
  const handleClear = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setLocalValue('');
    onChangeText('');
    inputRef.current?.focus();
  };
  
  // Handle voice input
  const handleVoiceInput = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    onVoiceInput?.();
  };
  
  // Handle history item selection
  const handleHistorySelect = async (historyItem: string) => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setLocalValue(historyItem);
    onChangeText(historyItem);
    onSubmit?.(historyItem);
    
    setShowHistoryModal(false);
    inputRef.current?.blur();
  };
  
  // Handle clear history
  const handleClearHistory = async () => {
    if (!isReducedMotion) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }
    
    onClearHistory?.();
    setShowHistoryModal(false);
  };
  
  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);
  
  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);
  
  // Animation styles
  const containerAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scaleAnim.value }],
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      ['rgba(255, 255, 255, 0.3)', COLORS.white]
    ),
  }));
  
  const historyModalAnimatedStyle = useAnimatedStyle(() => ({
    opacity: historyAnim.value,
    transform: [
      { translateY: (1 - historyAnim.value) * -10 },
      { scale: 0.95 + historyAnim.value * 0.05 },
    ],
  }));
  
  // Show clear button based on mode and state
  const shouldShowClearButton = () => {
    switch (clearButtonMode) {
      case 'always':
        return true;
      case 'while-editing':
        return localValue.length > 0 && isFocused;
      case 'unless-editing':
        return localValue.length > 0 && !isFocused;
      case 'never':
      default:
        return false;
    }
  };
  
  // Render history item
  const renderHistoryItem = ({ item, index }: { item: string; index: number }) => (
    <TouchableOpacity
      style={styles.historyItem}
      onPress={() => handleHistorySelect(item)}
      accessibilityRole="button"
      accessibilityLabel={`Search for ${item}`}
    >
      <Ionicons name="time-outline" size={16} color="#6B7280" />
      <Text style={styles.historyText} numberOfLines={1}>
        {item}
      </Text>
      <Ionicons name="arrow-up-outline" size={16} color="#9CA3AF" />
    </TouchableOpacity>
  );
  
  return (
    <>
      {/* Search Bar */}
      <Animated.View style={[styles.container, containerAnimatedStyle, style]}>
        {/* Search Icon */}
        <Ionicons
          name="search-outline"
          size={20}
          color={isFocused ? COLORS.primary : 'rgba(255, 255, 255, 0.7)'}
          style={styles.searchIcon}
        />
        
        {/* Text Input */}
        <TextInput
          ref={inputRef}
          style={[styles.input, inputStyle]}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          value={localValue}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSubmit}
          onFocus={handleFocus}
          onBlur={handleBlur}
          returnKeyType={returnKeyType}
          autoFocus={autoFocus}
          selectionColor={COLORS.white}
          accessibilityLabel="Search input"
          accessibilityHint="Enter your search terms here"
        />
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* Voice Input Button */}
          {showVoiceInput && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleVoiceInput}
              accessibilityRole="button"
              accessibilityLabel="Voice search"
              accessibilityHint="Tap to search using voice input"
            >
              <Ionicons
                name="mic-outline"
                size={18}
                color={isFocused ? COLORS.primary : 'rgba(255, 255, 255, 0.7)'}
              />
            </TouchableOpacity>
          )}
          
          {/* Clear Button */}
          {shouldShowClearButton() && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleClear}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              accessibilityHint="Tap to clear the search input"
            >
              <Ionicons
                name="close-circle"
                size={18}
                color={isFocused ? COLORS.primary : 'rgba(255, 255, 255, 0.7)'}
              />
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>
      
      {/* Search History Modal */}
      {showHistory && (
        <Modal
          visible={showHistoryModal}
          transparent={true}
          animationType="none"
          onRequestClose={() => setShowHistoryModal(false)}
        >
          <TouchableOpacity
            style={styles.historyOverlay}
            activeOpacity={1}
            onPress={() => setShowHistoryModal(false)}
          >
            <Animated.View style={[styles.historyModal, historyModalAnimatedStyle]}>
              <View style={styles.historyHeader}>
                <View style={styles.historyTitleContainer}>
                  <Ionicons name="time-outline" size={20} color="#374151" />
                  <Text style={styles.historyTitle}>Recent Searches</Text>
                </View>
                
                {searchHistory.length > 0 && onClearHistory && (
                  <TouchableOpacity
                    style={styles.clearHistoryButton}
                    onPress={handleClearHistory}
                    accessibilityRole="button"
                    accessibilityLabel="Clear search history"
                  >
                    <Text style={styles.clearHistoryText}>Clear</Text>
                  </TouchableOpacity>
                )}
              </View>
              
              {searchHistory.length > 0 ? (
                <FlatList
                  data={searchHistory.slice(0, maxHistoryItems)}
                  renderItem={renderHistoryItem}
                  keyExtractor={(item, index) => `${item}-${index}`}
                  style={styles.historyList}
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <View style={styles.emptyHistory}>
                  <Text style={styles.emptyHistoryText}>No recent searches</Text>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: COLORS.white,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 4,
    borderRadius: 6,
  },
  historyOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-start',
    paddingTop: 120, // Adjust based on search bar position
    paddingHorizontal: 20,
  },
  historyModal: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    maxHeight: 300,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  historyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  clearHistoryButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearHistoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  historyList: {
    maxHeight: 200,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  historyText: {
    flex: 1,
    fontSize: 15,
    color: '#374151',
  },
  emptyHistory: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default SearchBar;