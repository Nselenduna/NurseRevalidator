import React from 'react';
import { View } from 'react-native';
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
}

/**
 * Animated Stethoscope Icon with optional pulse animation
 */
const StethoscopeIcon: React.FC<StethoscopeIconProps> = ({
  size = 128,
  color = '#FFFFFF',
  pulseEnabled = true,
}) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const isReducedMotion = useReducedMotion();
  
  React.useEffect(() => {
    if (pulseEnabled && !isReducedMotion) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(1.06, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
      
      opacity.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500 }),
          withTiming(0.9, { duration: 500 }),
          withTiming(1, { duration: 500 })
        ),
        -1,
        true
      );
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
    <View
      accessibilityRole="image"
      accessibilityLabel="Animated stethoscope icon pulsing like a heartbeat"
    >
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 14C8.66667 14 10 12.6667 10 11C10 9.33333 8.66667 8 7 8C5.33333 8 4 9.33333 4 11C4 12.6667 5.33333 14 7 14Z"
            stroke={color}
            strokeWidth="1.5"
          />
          <Path
            d="M7 14V18C7 19.6569 8.34315 21 10 21H14C15.6569 21 17 19.6569 17 18V14"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M17 11C17 12.6569 18.3431 14 20 14C21.6569 14 23 12.6569 23 11C23 9.34315 21.6569 8 20 8C18.3431 8 17 9.34315 17 11Z"
            stroke={color}
            strokeWidth="1.5"
          />
          <Path
            d="M1 4L12 4L12 11"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Animated.View>
    </View>
  );
};

export default StethoscopeIcon;
