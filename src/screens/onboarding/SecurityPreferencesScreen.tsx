import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
  AccessibilityInfo,
  StyleSheet,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

// Components
import PasswordField from '../../components/forms/PasswordField';
import ToggleSwitch from '../../components/forms/ToggleSwitch';
import PrimaryButton from '../../components/forms/PrimaryButton';
import BackButton from '../../components/forms/BackButton';
import ProgressIndicator from '../../components/ui/ProgressIndicator';

// Constants
import { COLORS } from '../../utils/constants/colors';
import { ROUTES } from '../../utils/constants/routes';

// Types
interface SecurityPreferences {
  password: string;
  confirmPassword: string;
  biometricEnabled: boolean;
  notificationsEnabled: boolean;
}

interface FormErrors {
  password?: string;
  confirmPassword?: string;
}

const FORM_STEPS = { PERSONAL: 1, PROFESSIONAL: 2, SECURITY: 3 };

export default function SecurityPreferencesScreen() {
  const navigation = useNavigation();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const successScale = useRef(new Animated.Value(1)).current;
  
  // Input refs
  const confirmPasswordRef = useRef<TextInput>(null);
  
  // Form state
  const [formData, setFormData] = useState<SecurityPreferences>({
    password: '',
    confirmPassword: '',
    biometricEnabled: false,
    notificationsEnabled: true,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof SecurityPreferences>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Check capabilities
  useEffect(() => {
    const checkCapabilities = async () => {
      // Check biometric availability
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setBiometricAvailable(hasHardware && isEnrolled);
      
      // Check accessibility
      const motionEnabled = await AccessibilityInfo.isReduceMotionEnabled();
      setReducedMotion(motionEnabled);
      
      // Load existing password from SecureStore
      try {
        const storedPassword = await SecureStore.getItemAsync('user_password');
        if (storedPassword) {
          setFormData(prev => ({
            ...prev,
            password: storedPassword,
            confirmPassword: storedPassword,
          }));
        }
      } catch (error) {
        console.error('Failed to load password:', error);
      }
    };
    
    checkCapabilities();
  }, []);
  
  // Entry animation
  useEffect(() => {
    if (!reducedMotion) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    }
  }, [reducedMotion]);
  
  // Validation
  const validatePassword = (password: string): string | undefined => {
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return 'Password must contain letters and numbers';
    }
    return undefined;
  };
  
  const validateConfirmPassword = (confirmPassword: string): string | undefined => {
    if (confirmPassword !== formData.password) {
      return 'Passwords do not match';
    }
    return undefined;
  };
  
  const handleFieldChange = (field: keyof SecurityPreferences, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched.has(field)) {
      let error: string | undefined;
      if (field === 'password') {
        error = validatePassword(value);
      } else if (field === 'confirmPassword') {
        error = validateConfirmPassword(value);
      }
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };
  
  const handleFieldBlur = (field: 'password' | 'confirmPassword') => {
    setTouched(prev => new Set(prev).add(field));
    let error: string | undefined;
    if (field === 'password') {
      error = validatePassword(formData.password);
    } else {
      error = validateConfirmPassword(formData.confirmPassword);
    }
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  const handleBiometricToggle = async (enabled: boolean) => {
    if (enabled && biometricAvailable) {
      // Request biometric authentication to enable
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to enable biometric login',
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Password',
      });
      
      if (result.success) {
        setFormData(prev => ({ ...prev, biometricEnabled: true }));
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } else {
      setFormData(prev => ({ ...prev, biometricEnabled: false }));
    }
  };
  
  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus === 'granted') {
        setFormData(prev => ({ ...prev, notificationsEnabled: true }));
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive reminders.',
          [{ text: 'OK' }]
        );
      }
    } else {
      setFormData(prev => ({ ...prev, notificationsEnabled: false }));
    }
  };
  
  const isFormValid = () => {
    return (
      !validatePassword(formData.password) &&
      !validateConfirmPassword(formData.confirmPassword)
    );
  };
  
  const handleFinish = async () => {
    // Validate all fields
    const newErrors: FormErrors = {
      password: validatePassword(formData.password),
      confirmPassword: validateConfirmPassword(formData.confirmPassword),
    };
    
    setErrors(newErrors);
    setTouched(new Set(['password', 'confirmPassword'] as Array<keyof SecurityPreferences>));
    
    if (Object.values(newErrors).some(error => error)) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Store password securely
      await SecureStore.setItemAsync('user_password', formData.password);
      
      // Store preferences
      const preferences = {
        biometricEnabled: formData.biometricEnabled,
        notificationsEnabled: formData.notificationsEnabled,
      };
      await AsyncStorage.setItem('@user_preferences', JSON.stringify(preferences));
      
      // Mark onboarding as complete
      const registrationData = await AsyncStorage.getItem('@user_registration');
      const finalData = {
        ...(registrationData ? JSON.parse(registrationData) : {}),
        onboardingComplete: true,
        completedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('@user_registration', JSON.stringify(finalData));
      
      // Success animation
      if (!reducedMotion) {
        Animated.sequence([
          Animated.timing(successScale, {
            toValue: 1.1,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(successScale, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to dashboard
      navigation.reset({
        index: 0,
        routes: [{ name: ROUTES.Dashboard as never }],
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to save security preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <LinearGradient colors={[COLORS.primary, COLORS.purple2]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
        >
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <Animated.View
              style={[
                styles.animatedContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                }
              ]}
            >
              <BackButton onPress={() => navigation.goBack()} />
              
              <ProgressIndicator
                currentStep={FORM_STEPS.SECURITY}
                totalSteps={3}
                style={styles.progressIndicator}
              />
              
              <Text style={styles.title}>Security & Preferences</Text>
              <Text style={styles.subtitle}>Secure your account and set your preferences</Text>
              
              <View style={styles.formContainer}>
                <PasswordField
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => handleFieldChange('password', text)}
                  onBlur={() => handleFieldBlur('password')}
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  error={errors.password}
                  placeholder="Enter your password"
                  returnKeyType="next"
                  accessibilityLabel="Password"
                  accessibilityHint="Create or confirm your account password"
                />
                
                <PasswordField
                  ref={confirmPasswordRef}
                  label="Confirm Password"
                  value={formData.confirmPassword}
                  onChangeText={(text) => handleFieldChange('confirmPassword', text)}
                  onBlur={() => handleFieldBlur('confirmPassword')}
                  error={errors.confirmPassword}
                  placeholder="Re-enter your password"
                  returnKeyType="done"
                  accessibilityLabel="Confirm Password"
                  accessibilityHint="Re-enter your password to confirm"
                />
                
                {biometricAvailable && (
                  <ToggleSwitch
                    label="Enable Biometric Login"
                    description="Use Face ID or fingerprint to login"
                    value={formData.biometricEnabled}
                    onValueChange={handleBiometricToggle}
                    accessibilityLabel="Enable Biometric Login"
                    accessibilityHint="Toggle to enable Face ID or fingerprint authentication"
                  />
                )}
                
                <ToggleSwitch
                  label="Enable Notifications"
                  description="Receive reminders for CPD activities and revalidation"
                  value={formData.notificationsEnabled}
                  onValueChange={handleNotificationToggle}
                  accessibilityLabel="Enable Notifications"
                  accessibilityHint="Toggle to enable push notifications for reminders"
                />
              </View>
              
              <View style={styles.buttonContainer}>
                <Animated.View
                  style={{
                    transform: [{ scale: successScale }],
                  }}
                >
                  <PrimaryButton
                    label={isSubmitting ? "Setting up..." : "Finish Setup"}
                    onPress={handleFinish}
                    disabled={!isFormValid() || isSubmitting}
                    loading={isSubmitting}
                    shimmer={isFormValid() && !isSubmitting}
                  />
                </Animated.View>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  animatedContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  progressIndicator: {
    marginTop: 16,
  },
  title: {
    color: 'white',
    fontSize: 30,
    fontWeight: 'bold',
    marginTop: 24,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 16,
    marginTop: 8,
  },
  formContainer: {
    marginTop: 32,
    gap: 20,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
    marginTop: 32,
  },
});