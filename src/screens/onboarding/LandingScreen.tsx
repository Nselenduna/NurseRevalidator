import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  StatusBar,
  SafeAreaView,
  useWindowDimensions,
  Image
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Animated, {
  FadeIn,
  FadeInDown
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

// Import custom components
import StethoscopeIcon from '../../components/common/StethoscopeIcon';
import HeartbeatLine from '../../components/common/HeartbeatLine';
import FeatureCard from '../../components/common/FeatureCard';
import GetStartedButton from '../../components/common/GetStartedButton';
import LoginButton from '../../components/common/LoginButton';

// Import utility hooks and constants
import { getOnboardingComplete } from '../../services/storage/onboardingStorage';
import useReducedMotion from '../../hooks/useReducedMotion';
import { ROUTES } from '../../utils/constants/routes';
import { COLORS } from '../../utils/constants/colors';

// Define screen props
type RootStackParamList = Record<string, object | undefined>;
type NavigationProp = StackNavigationProp<RootStackParamList>;

const LandingScreen: React.FC = () => {
  const [onboardingComplete, setOnboardingComplete] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation<NavigationProp>();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    // Fetch onboarding status on mount
    const checkOnboardingStatus = async () => {
      const status = await getOnboardingComplete();
      setOnboardingComplete(status);
      
      // Log screen view (analytics stub)
      console.log('LandingScreen viewed', { onboardingComplete: status });
    };
    
    checkOnboardingStatus();
  }, []);
  
  const handleGetStarted = () => {
    setIsLoading(true);
    
    // Simulate a small loading delay
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate(ROUTES.Registration);
      setIsLoading(false);
    }, 400);
  };
  
  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate(ROUTES.Login);
  };
  
  const handleFeatureCardPress = (route: string) => {
    if (onboardingComplete) {
      navigation.navigate(route);
    } else {
      // Show toast or alert that onboarding is required first
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      console.log('Please complete onboarding first');
    }
  };
  
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.container}>
        <Animated.View 
          style={styles.heroContainer}
          entering={FadeIn.delay(100)}
        >
          <HeartbeatLine width={width * 0.7} height={30} />
          {/* Use stethoscope image */}
          <Animated.Image 
            source={require('../../../assets/stethoscope.png.png')}
            style={styles.stethoscopeImage}
            resizeMode="contain"
          />
        </Animated.View>
        
        <Animated.View 
          style={styles.titleContainer}
          entering={FadeInDown.delay(200).springify()}
        >
          <Text style={styles.title}>Nurse Revalidator</Text>
          <Text style={styles.tagline}>
            Empowering nurses and midwives to deliver exceptional care through professional registration and development.
          </Text>
        </Animated.View>
        
        <View style={styles.featureCardsContainer}>
          <FeatureCard 
            title="Registration" 
            subtitle="Maintain your professional registration status"
            iconName="check"
            tint="green"
            onPress={() => handleFeatureCardPress(ROUTES.Registration)}
            delay={300}
          />
          <FeatureCard 
            title="Continuing Development" 
            subtitle="Track your professional development activities"
            iconName="progress" // This will now show the 📈 icon
            tint="purple"
            onPress={() => handleFeatureCardPress(ROUTES.CPD)}
            delay={380}
          />
          <FeatureCard 
            title="Professional Standards" 
            subtitle="Access guidance on professional standards"
            iconName="shield"
            tint="green"
            onPress={() => handleFeatureCardPress(ROUTES.Standards)}
            delay={460}
          />
        </View>
        
        <SafeAreaView>
          <View style={styles.ctaContainer}>
            {onboardingComplete === null ? (
              // Loading skeleton for CTA
              <View style={styles.loadingPlaceholder} />
            ) : onboardingComplete ? (
              <>
                <LoginButton onPress={handleLogin} />
                <GetStartedButton 
                  label="Explore Features" 
                  onPress={() => navigation.navigate(ROUTES.Dashboard)}
                />
              </>
            ) : (
              <GetStartedButton 
                label="Get Started" 
                onPress={handleGetStarted}
                isLoading={isLoading}
              />
            )}
          </View>
        </SafeAreaView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.primary,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40, // Increased from 24 to 40 for better visibility on iOS devices with bezels
    backgroundColor: COLORS.primary,
    // For devices that don't support gradients well in RN:
    // We'll use a solid color as fallback
  },
  heroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stethoscopeImage: {
    width: 120,
    height: 120,
    marginTop: 20,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    maxWidth: '90%',
    lineHeight: 22,
  },
  featureCardsContainer: {
    width: '100%',
    marginBottom: 8, // Reduced from 24 to 8
  },
  ctaContainer: {
    width: '100%',
    marginTop: 0, // Removed the auto margin
    paddingVertical: 8, // Reduced from 16 to 8
  },
  loadingPlaceholder: {
    height: 56,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 28,
    marginVertical: 8,
  },
});

export default LandingScreen;
