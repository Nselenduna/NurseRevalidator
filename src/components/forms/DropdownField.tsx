import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../utils/constants/colors';

interface DropdownOption {
  label: string;
  value: string;
}

interface DropdownFieldProps {
  label: string;
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function DropdownField({
  label,
  value,
  options,
  onChange,
  onBlur,
  error,
  placeholder = 'Select an option',
  accessibilityLabel,
  accessibilityHint,
}: DropdownFieldProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  const handleSelect = async (option: DropdownOption) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChange(option.value);
    setIsOpen(false);
    onBlur?.();
  };
  
  return (
    <View>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity
        onPress={() => setIsOpen(true)}
        style={[
          styles.dropdown,
          error ? styles.dropdownError : styles.dropdownNormal
        ]}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        <Text style={selectedOption ? styles.selectedText : styles.placeholderText}>
          {selectedOption?.label || placeholder}
        </Text>
        <Ionicons name="chevron-down" size={20} color="white" />
      </TouchableOpacity>
      {error && <Text style={styles.errorText}>{error}</Text>}
      
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalHandle} />
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={styles.optionItem}
                >
                  <Text style={styles.optionText}>{item.label}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  dropdownNormal: {
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dropdownError: {
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  selectedText: {
    color: 'white',
    fontSize: 16,
    flex: 1,
  },
  placeholderText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    flex: 1,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '60%',
  },
  modalHandle: {
    height: 4,
    width: 48,
    backgroundColor: '#D1D5DB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 12,
  },
  optionItem: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  optionText: {
    color: '#1F2937',
    fontSize: 16,
  },
});