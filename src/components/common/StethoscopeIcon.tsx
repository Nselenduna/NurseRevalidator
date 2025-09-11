import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  cancelAnimation,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import useReducedMotion from '../../hooks/useReducedMotion';

interface StethoscopeIconProps {
  size?: number;
  color?: string;
  pulseEnabled?: boolean;
  onEasterEggTrigger?: () => void;
}

/**
 * Animated Stethoscope Icon with optional pulse animation
 */
const StethoscopeIcon: React.FC<StethoscopeIconProps> = ({
  size = 128,
  color = '#FFFFFF',
  pulseEnabled = true,
  onEasterEggTrigger,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isReducedMotion = useReducedMotion();
  
  // Easter egg trigger for rapid heartbeat
  const triggerEasterEgg = React.useCallback(() => {
    if (isReducedMotion || !onEasterEggTrigger) return;
    
    // Trigger rapid heartbeat sequence (5 quick beats)
    scale.value = withSequence(
      withTiming(1.15, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(1.12, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(1.15, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(1.12, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(1.15, { duration: 50 }),
      withTiming(1, { duration: 100 })
    );
    
    opacity.value = withSequence(
      withTiming(0.9, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(0.9, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(0.9, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(0.9, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(0.9, { duration: 50 }),
      withTiming(1, { duration: 100 })
    );
    
    onEasterEggTrigger();
  }, [isReducedMotion, onEasterEggTrigger]);
  
  React.useEffect(() => {
    if (pulseEnabled && !isReducedMotion) {
      // Heartbeat pattern: two quick beats then a pause (realistic cardiac rhythm)
      const heartbeatAnimation = () => {
        scale.value = withSequence(
          // First beat (systole)
          withTiming(1.08, { duration: 100, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 100 }),
          // Brief pause
          withTiming(1, { duration: 150 }),
          // Second beat (diastole) 
          withTiming(1.06, { duration: 100, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 100 }),
          // Long pause before next heartbeat (3 seconds total cycle)
          withTiming(1, { duration: 2450 })
        );
        
        opacity.value = withSequence(
          withTiming(0.95, { duration: 100 }),
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 150 }),
          withTiming(0.95, { duration: 100 }),
          withTiming(1, { duration: 100 }),
          withTiming(1, { duration: 2450 })
        );
      };
      
      // Start immediately and repeat every 3 seconds
      heartbeatAnimation();
      
      const heartbeatTimer = setInterval(() => {
        heartbeatAnimation();
      }, 3000);
      
      return () => {
        clearInterval(heartbeatTimer);
        cancelAnimation(scale);
        cancelAnimation(opacity);
      };
    } else {
      cancelAnimation(scale);
      cancelAnimation(opacity);
      scale.value = 1;
      opacity.value = 1;
    }
    
    return () => {
      cancelAnimation(scale);
      cancelAnimation(opacity);
    };
  }, [pulseEnabled, isReducedMotion]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: opacity.value,
    };
  });

  return (
    <TouchableOpacity
      onPress={triggerEasterEgg}
      accessibilityRole="image"
      accessibilityLabel="Animated stethoscope icon pulsing like a heartbeat"
      accessibilityHint="Tap for special heartbeat animation"
      activeOpacity={0.8}
    >
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          {/* Left ear piece */}
          <Path
            d="M4 8C4 6.89543 4.89543 6 6 6C7.10457 6 8 6.89543 8 8C8 9.10457 7.10457 10 6 10C4.89543 10 4 9.10457 4 8Z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
          {/* Right ear piece */}
          <Path
            d="M16 8C16 6.89543 16.8954 6 18 6C19.1046 6 20 6.89543 20 8C20 9.10457 19.1046 10 18 10C16.8954 10 16 9.10457 16 8Z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
          {/* Left tubing */}
          <Path
            d="M6 10C6 12 6 14 8 16C9 17 10 17 11 17"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Right tubing */}
          <Path
            d="M18 10C18 12 18 14 16 16C15 17 14 17 13 17"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Chest piece */}
          <Path
            d="M11 17H13V19C13 20.1046 12.1046 21 11 21H13C11.8954 21 11 20.1046 11 19V17Z"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          {/* Diaphragm */}
          <Path
            d="M10 19C10 20.6569 10.8954 22 12 22C13.1046 22 14 20.6569 14 19C14 17.3431 13.1046 16 12 16C10.8954 16 10 17.3431 10 19Z"
            stroke={color}
            strokeWidth="1.5"
            fill="none"
          />
        </Svg>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default StethoscopeIcon;
