import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Pressable, 
  ViewStyle 
} from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming, 
  withSequence, 
  withDelay,
  FadeIn,
  FadeInDown 
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { COLORS } from '../../utils/constants/colors';

interface FeatureCardProps {
  title: string;
  subtitle: string;
  iconName: string; // Not using actual icon component for simplicity, will be replaced
  tint?: 'green' | 'purple';
  onPress?: () => void;
  delay?: number;
  style?: ViewStyle;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * FeatureCard component for displaying feature information
 */
const FeatureCard: React.FC<FeatureCardProps> = ({ 
  title, 
  subtitle, 
  iconName,
  tint = 'purple',
  onPress, 
  delay = 0,
  style 
}) => {
  const scale = useSharedValue(1);
  
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(0.97, { duration: 100 }),
      withTiming(1, { duration: 150 })
    );
    
    if (onPress) {
      onPress();
    }
  };
  
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }]
    };
  });
  
  const tintColor = tint === 'green' ? COLORS.secondary : COLORS.primary;
  const iconElement = () => {
    // Render icon based on iconName
    return (
      <View style={[styles.iconContainer, { backgroundColor: tintColor + '20' }]}>
        <Text style={[styles.iconText, { color: tintColor }]}>
          {iconName === 'check' ? '✓' : 
          iconName === 'progress' ? '📈' : // Updated icon for continuing development
          iconName === 'shield' ? '🛡️' : '•'}
        </Text>
      </View>
    );
  };

  return (
    <AnimatedPressable 
      style={[styles.container, style]}
      entering={FadeInDown.delay(delay).springify()}
      onPress={handlePress}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`${title}: ${subtitle}`}
      accessibilityHint={`Tap to explore ${title.toLowerCase()} features`}
    >
      <Animated.View style={[styles.card, animatedStyle]}>
        {iconElement()}
        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>
      </Animated.View>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 8, // Reduced from 12 to 8
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14, // Reduced from 16 to 14
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  }
});

export default FeatureCard;
