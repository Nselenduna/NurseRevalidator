import React from 'react';
import { 
  TouchableOpacity, 
  Text, 
  StyleSheet,
  View 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../utils/constants/colors';

interface LoginButtonProps {
  onPress: () => void;
  label?: string;
}

const LoginButton: React.FC<LoginButtonProps> = ({ 
  onPress, 
  label = "Login to Portal" 
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  
  const handlePress = () => {
    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate button press
    scale.value = withSequence(
      withTiming(0.95, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    
    opacity.value = withSequence(
      withTiming(0.8, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    
    onPress();
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });
  
  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.9}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={`Tap to ${label.toLowerCase()}`}
      >
        <Text style={styles.buttonText}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 48,
    width: '100%',
    borderRadius: 24,
    marginVertical: 8,
    overflow: 'hidden',
  },
  button: {
    height: '100%',
    width: '100%',
    borderRadius: 24,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LoginButton;
