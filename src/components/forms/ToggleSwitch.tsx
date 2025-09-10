import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { COLORS } from '../../utils/constants/colors';

interface ToggleSwitchProps {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export default function ToggleSwitch({
  label,
  description,
  value,
  onValueChange,
  accessibilityLabel,
  accessibilityHint,
}: ToggleSwitchProps) {
  const translateX = useRef(new Animated.Value(value ? 24 : 0)).current;
  
  useEffect(() => {
    Animated.timing(translateX, {
      toValue: value ? 24 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [value]);
  
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      style={styles.container}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={styles.labelContainer}>
        <Text style={styles.label}>{label}</Text>
        {description && (
          <Text style={styles.description}>{description}</Text>
        )}
      </View>
      <View style={[
        styles.switchTrack,
        value ? styles.switchTrackActive : styles.switchTrackInactive
      ]}>
        <Animated.View
          style={[
            styles.switchThumb,
            { transform: [{ translateX }] }
          ]}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  labelContainer: {
    flex: 1,
    marginRight: 12,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  description: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 4,
    lineHeight: 18,
  },
  switchTrack: {
    width: 48,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    position: 'relative',
  },
  switchTrackActive: {
    backgroundColor: COLORS.secondary,
  },
  switchTrackInactive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    position: 'absolute',
    top: 2,
    left: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
});