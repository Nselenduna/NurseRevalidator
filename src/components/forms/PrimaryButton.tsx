import React, { useEffect } from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet, 
  ActivityIndicator, 
  View,
  ViewStyle 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withRepeat, 
  withDelay, 
  cancelAnimation 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../utils/constants/colors';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  shimmer?: boolean;
  style?: ViewStyle;
}

const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  label,
  onPress,
  disabled = false,
  loading = false,
  shimmer = false,
  style,
}) => {
  const translateX = useSharedValue(-100);
  
  useEffect(() => {
    if (shimmer) {
      translateX.value = -100;
      translateX.value = withRepeat(
        withDelay(
          500, // Delay before starting animation
          withTiming(100, { duration: 1200 })
        ),
        -1,
        false
      );
    } else {
      cancelAnimation(translateX);
    }
    
    return () => {
      cancelAnimation(translateX);
    };
  }, [shimmer]);
  
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });
  
  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };
  
  const buttonOpacity = disabled ? 0.6 : 1;
  
  return (
    <TouchableOpacity
      style={[styles.button, { opacity: buttonOpacity }, style]}
      onPress={handlePress}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={`Press to ${label.toLowerCase()}`}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={COLORS.primary} size="small" />
      ) : (
        <Text style={styles.buttonText}>{label}</Text>
      )}
      
      {shimmer && !disabled && !loading && (
        <View style={styles.shimmerContainer}>
          <Animated.View style={[styles.shimmer, shimmerStyle]} />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'white',
    borderRadius: 30,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    height: '100%',
    width: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    transform: [{ skewX: '-20deg' }],
  },
});

export default PrimaryButton;
