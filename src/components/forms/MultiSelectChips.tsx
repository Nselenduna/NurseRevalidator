import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  AccessibilityInfo,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../utils/constants/colors';

interface MultiSelectChipsProps {
  options: string[];
  selected: string[];
  onToggle: (option: string, index: number) => void;
  scaleAnims: Animated.Value[];
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function MultiSelectChips({
  options,
  selected,
  onToggle,
  scaleAnims,
  accessibilityLabel,
  accessibilityHint,
}: MultiSelectChipsProps) {
  return (
    <View style={styles.container}>
      {options.map((option, index) => {
        const isSelected = selected.includes(option);
        return (
          <Animated.View
            key={option}
            style={{
              transform: [{ scale: scaleAnims[index] }],
            }}
          >
            <TouchableOpacity
              onPress={() => onToggle(option, index)}
              style={[
                styles.chip,
                isSelected ? styles.chipSelected : styles.chipUnselected
              ]}
              accessibilityLabel={`${option} specialisation`}
              accessibilityHint={`${isSelected ? 'Selected' : 'Not selected'}. Tap to toggle`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
            >
              <Text style={isSelected ? styles.textSelected : styles.textUnselected}>
                {option}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 8,
    marginRight: 8,
  },
  chipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: COLORS.secondary,
  },
  chipUnselected: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textSelected: {
    color: COLORS.secondary,
    fontSize: 14,
    fontWeight: '500',
  },
  textUnselected: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
});