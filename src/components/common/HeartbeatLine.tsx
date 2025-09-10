import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withTiming,
  useAnimatedStyle,
} from 'react-native-reanimated';
import Svg, { Path, LinearGradient, Stop, Defs, Mask } from 'react-native-svg';
import useReducedMotion from '../../hooks/useReducedMotion';

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface HeartbeatLineProps {
  width?: number;
  height?: number;
}

/**
 * Animated Heartbeat Line with EKG-like animation
 */
const HeartbeatLine: React.FC<HeartbeatLineProps> = ({
  width = 200,
  height = 24,
}) => {
  const progress = useSharedValue(0);
  const shimmerPosition = useSharedValue(-width);
  const isReducedMotion = useReducedMotion();
  
  // EKG path data - a simplified heartbeat pattern
  const pathData = `M0,${height / 2} 
                   Q${width * 0.1},${height / 2} ${width * 0.2},${height / 2} 
                   L${width * 0.3},${height / 2} 
                   L${width * 0.35},${height * 0.2} 
                   L${width * 0.4},${height * 0.8} 
                   L${width * 0.45},${height * 0.2} 
                   L${width * 0.5},${height / 2} 
                   L${width * 0.7},${height / 2} 
                   Q${width * 0.8},${height / 2} ${width},${height / 2}`;

  React.useEffect(() => {
    if (!isReducedMotion) {
      progress.value = withRepeat(
        withTiming(1, { duration: 2000 }),
        -1,
        false
      );
      
      shimmerPosition.value = withRepeat(
        withTiming(width, { duration: 2000 }),
        -1,
        false
      );
    } else {
      progress.value = 0.5; // Static position for reduced motion
      shimmerPosition.value = 0;
    }
  }, [isReducedMotion]);

  const animatedProps = useAnimatedProps(() => {
    return {
      strokeDashoffset: -progress.value * 100,
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerPosition.value }],
    };
  });

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor="rgba(255,255,255,0.2)" />
            <Stop offset="0.5" stopColor="rgba(255,255,255,0.8)" />
            <Stop offset="1" stopColor="rgba(255,255,255,0.2)" />
          </LinearGradient>
          
          <Mask id="mask">
            <AnimatedPath
              d={pathData}
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeDasharray="100"
              animatedProps={animatedProps}
            />
          </Mask>
        </Defs>
        
        {/* Base EKG path */}
        <Path
          d={pathData}
          stroke="rgba(255,255,255,0.3)"
          strokeWidth="2"
          fill="none"
        />
        
        {/* Animated EKG path */}
        <AnimatedPath
          d={pathData}
          stroke="white"
          strokeWidth="2"
          fill="none"
          strokeDasharray="100"
          animatedProps={animatedProps}
        />
        
        {/* Shimmer effect */}
        <Animated.View style={shimmerStyle}>
          <Svg width={width * 0.3} height={height}>
            <Path
              d={`M0,0 H${width * 0.3} V${height} H0 Z`}
              fill="url(#gradient)"
              mask="url(#mask)"
            />
          </Svg>
        </Animated.View>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default HeartbeatLine;
