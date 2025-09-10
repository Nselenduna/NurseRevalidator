import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  ActivityIndicator, 
  StyleSheet,
  View 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withRepeat,
  withSequence 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../utils/constants/colors';

interface GetStartedButtonProps {
  label: string;
  onPress: () => void;
  isLoading?: boolean;
}

const GetStartedButton: React.FC<GetStartedButtonProps> = ({ 
  label, 
  onPress, 
  isLoading = false 
}) => {
  const shimmerPosition = useSharedValue(-200);
  const shadowOpacity = useSharedValue(0);
  
  React.useEffect(() => {
    // Continuous shimmer animation
    shimmerPosition.value = withRepeat(
      withTiming(200, { duration: 1800 }),
      -1,
      false
    );
  }, []);
  
  const handlePress = () => {
    if (isLoading) return;
    
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate shadow/glow effect on press
    shadowOpacity.value = withSequence(
      withTiming(1, { duration: 150 }),
      withTiming(0, { duration: 600 })
    );
    
    onPress();
  };
  
  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerPosition.value }]
    };
  });
  
  const shadowStyle = useAnimatedStyle(() => {
    return {
      shadowOpacity: shadowOpacity.value,
      opacity: 0.7 + (shadowOpacity.value * 0.3),
    };
  });
  
  return (
    <View style={styles.container}>
      {/* Shimmer effect border */}
      <Animated.View style={[styles.shimmerContainer, shimmerStyle]} />
      
      {/* Button with shadow animation */}
      <Animated.View style={[styles.shadowContainer, shadowStyle]}>
        <TouchableOpacity
          style={styles.button}
          onPress={handlePress}
          disabled={isLoading}
          activeOpacity={0.8}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={`Tap to ${label.toLowerCase()}`}
          accessibilityState={{ busy: isLoading, disabled: isLoading }}
        >
          {isLoading ? (
            <ActivityIndicator color={COLORS.primary} size="small" />
          ) : (
            <Text style={styles.buttonText}>{label}</Text>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 56,
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    marginVertical: 8,
    position: 'relative',
  },
  shimmerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  shadowContainer: {
    height: '100%',
    width: '100%',
    borderRadius: 28,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },
  button: {
    height: '100%',
    width: '100%',
    borderRadius: 28,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '600',
  },
});

export default GetStartedButton;
