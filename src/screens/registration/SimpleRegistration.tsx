import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Alert,
  AccessibilityInfo,
  TextInput,
  StyleSheet,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

// Components
import TextField from '../../components/forms/TextField';
import PasswordField from '../../components/forms/PasswordField';
import PrimaryButton from '../../components/forms/PrimaryButton';
import BackButton from '../../components/forms/BackButton';
import ProgressIndicator from '../../components/forms/ProgressIndicator';
import OfflineBanner from '../../components/common/OfflineBanner';

// Constants
import { COLORS } from '../../utils/constants/colors';
import { ROUTES } from '../../utils/constants/routes';

// Types
interface FormData {
  fullName: string;
  email: string;
  nmcPin: string;
  password: string;
  role: string;
  workplace: string;
  experience: string;
  biometricEnabled: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  nmcPin?: string;
  password?: string;
}

const FORM_STEPS = {
  PERSONAL: 1,
  PROFESSIONAL: 2,
  SECURITY: 3,
};

const DRAFT_KEY = '@registration_draft';

// Validation functions
const validateFullName = (value: string): string | undefined => {
  if (!value.trim()) return 'Full name is required';
  if (value.trim().length < 2) return 'Name must be at least 2 characters';
  return undefined;
};

const validateEmail = (value: string): string | undefined => {
  if (!value.trim()) return 'Email address is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Please enter a valid email address';
  return undefined;
};

const validateNMCPin = (value: string): string | undefined => {
  if (!value.trim()) return 'NMC PIN is required';
  
  // Accept various NMC PIN formats:
  // - Traditional format: XX123456 or XX123456A 
  // - Newer format like 20C1262O with numbers and letters mixed
  const isValid = /^[A-Z0-9]{7,9}$/i.test(value.trim());
  
  if (!isValid) {
    return 'Please enter a valid NMC PIN (7-9 characters)';
  }
  
  return undefined;
};

const validatePassword = (value: string): string | undefined => {
  if (!value) return 'Password is required';
  if (value.length < 8) return 'Password must be at least 8 characters';
  
  // Check for at least one uppercase, one lowercase, one number and one special character
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
  const requirements = [];
  if (!hasUppercase) requirements.push('uppercase letter');
  if (!hasLowercase) requirements.push('lowercase letter');
  if (!hasNumber) requirements.push('number');
  if (!hasSpecial) requirements.push('special character');
  
  if (requirements.length > 0) {
    return `Password must include at least one ${requirements.join(', ')}`;
  }
  
  return undefined;
};

// Format NMC PIN for display
const formatNMCPin = (pin: string): string => {
  // Remove spaces first
  const formatted = pin.replace(/\s/g, '').toUpperCase();
  return formatted;
};

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Animated,
  TouchableOpacity,
  Alert,
  AccessibilityInfo,
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';
import * as SecureStore from 'expo-secure-store';

// Components
import TextField from '../../components/forms/TextField';
import PasswordField from '../../components/forms/PasswordField';
import PrimaryButton from '../../components/forms/PrimaryButton';
import BackButton from '../../components/forms/BackButton';
import ProgressIndicator from '../../components/forms/ProgressIndicator';
import OfflineBanner from '../../components/common/OfflineBanner';

// Constants
import { COLORS } from '../../utils/constants/colors';
import { ROUTES } from '../../utils/constants/routes';

// Types
interface FormData {
  fullName: string;
  email: string;
  nmcPin: string;
  password: string;
  role: string;
  workplace: string;
  experience: string;
  biometricEnabled: boolean;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  nmcPin?: string;
  password?: string;
}

const FORM_STEPS = {
  PERSONAL: 1,
  PROFESSIONAL: 2,
  SECURITY: 3,
};

const DRAFT_KEY = '@registration_draft';

// Validation functions
const validateFullName = (value: string): string | undefined => {
  if (!value.trim()) return 'Full name is required';
  if (value.trim().length < 2) return 'Name must be at least 2 characters';
  return undefined;
};

const validateEmail = (value: string): string | undefined => {
  if (!value.trim()) return 'Email address is required';
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return 'Please enter a valid email address';
  return undefined;
};

const validateNMCPin = (value: string): string | undefined => {
  if (!value.trim()) return 'NMC PIN is required';
  
  // Format should be XX123456 or XX123456A
  const nmcRegex = /^[A-Z]{2}[0-9]{6}[A-Z]?$/;
  
  if (!nmcRegex.test(value.replace(/\s/g, ''))) {
    return 'Please enter a valid NMC PIN (e.g., AB123456 or AB123456C)';
  }
  
  return undefined;
};

const validatePassword = (value: string): string | undefined => {
  if (!value) return 'Password is required';
  
  if (value.length < 8) {
    return 'Password must be at least 8 characters';
  }
  
  // Check for at least one uppercase, one lowercase, one number and one special character
  const hasUppercase = /[A-Z]/.test(value);
  const hasLowercase = /[a-z]/.test(value);
  const hasNumber = /[0-9]/.test(value);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);
  
  const requirements = [];
  if (!hasUppercase) requirements.push('uppercase letter');
  if (!hasLowercase) requirements.push('lowercase letter');
  if (!hasNumber) requirements.push('number');
  if (!hasSpecial) requirements.push('special character');
  
  if (requirements.length > 0) {
    return `Password must include at least one ${requirements.join(', ')}`;
  }
  
  return undefined;
};

// Format NMC PIN for display
const formatNMCPin = (pin: string): string => {
  // Remove spaces first
  const formatted = pin.replace(/\s/g, '').toUpperCase();
  return formatted;
};

export default function RegistrationScreen() {
  const navigation = useNavigation();
  const netInfo = useNetInfo();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  
  // Input refs for auto-advance
  const emailRef = useRef<TextInput>(null);
  const nmcPinRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  
  // Scroll view ref for scrolling to inputs
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Set up auto-scroll when password field is focused
  useEffect(() => {
    const passwordInput = passwordRef.current;
    
    if (passwordInput) {
      const originalFocus = passwordInput.focus;
      
      // Override the focus method to also scroll
      passwordInput.focus = function() {
        originalFocus.apply(this);
        setTimeout(() => scrollViewRef.current?.scrollTo({ y: 300, animated: true }), 100);
      };
    }
    
    return () => {
      // Clean up if needed
      if (passwordRef.current) {
        passwordRef.current.focus = TextInput.prototype.focus;
      }
    };
  }, [passwordRef.current]);
  
  // Form state
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    nmcPin: '',
    password: '',
    role: '',
    workplace: '',
    experience: '',
    biometricEnabled: false,
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormData>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Check for reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
    
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      isEnabled => {
        setReducedMotion(isEnabled);
      }
    );
    
    return () => subscription.remove();
  }, []);
  
  // Screen entry animation
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
  
  // Restore draft on mount
  useEffect(() => {
    const restoreDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem(DRAFT_KEY);
        if (draft) {
          const parsed = JSON.parse(draft);
          setFormData(prev => ({
            ...prev,
            fullName: parsed.fullName || '',
            email: parsed.email || '',
            nmcPin: parsed.nmcPin || '',
            // Don't restore password for security
          }));
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    };
    restoreDraft();
  }, []);
  
  // Auto-save draft (excluding password)
  useEffect(() => {
    const saveDraft = async () => {
      try {
        const draft = {
          fullName: formData.fullName,
          email: formData.email,
          nmcPin: formData.nmcPin,
        };
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    };
    
    const debounce = setTimeout(saveDraft, 500);
    return () => clearTimeout(debounce);
  }, [formData.fullName, formData.email, formData.nmcPin]);
  
  // Helper function to scroll to specific positions when fields are focused
  const scrollToPosition = (position: number) => {
    // Immediately try to scroll
    scrollViewRef.current?.scrollTo({ y: position, animated: true });
    
    // Also add a delayed scroll as a backup
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: position, animated: true });
    }, 250);
  };

  // Field change handlers
  const handleFieldChange = (field: keyof FormData, value: string) => {
    let processedValue = value;
    
    // Auto-format NMC PIN
    if (field === 'nmcPin') {
      processedValue = formatNMCPin(value);
    }
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing if field was previously touched
    if (touched.has(field)) {
      const error = validateField(field, processedValue);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };
  
  const handleFieldBlur = (field: keyof FormData) => {
    setTouched(prev => new Set(prev).add(field));
    const value = formData[field];
    const error = validateField(field, typeof value === 'string' ? value : String(value));
    if (error) {
      setErrors(prev => ({ ...prev, [field]: error }));
    }
  };
  
  // Validation
  const validateField = (field: keyof FormData, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        return validateFullName(value);
      case 'email':
        return validateEmail(value);
      case 'nmcPin':
        return validateNMCPin(value);
      case 'password':
        return validatePassword(value);
      default:
        return undefined;
    }
  };
  
  // Animation for validation errors
  const shakeAnimation = () => {
    if (reducedMotion) return;
    
    Animated.sequence([
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: -10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 10,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shakeAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Check if form is valid
  const isFormValid = () => {
    return (
      formData.fullName.length >= 2 &&
      !validateEmail(formData.email) &&
      !validateNMCPin(formData.nmcPin) &&
      !validatePassword(formData.password)
    );
  };
  
  // Handle paste for NMC PIN to auto-format
  const handlePaste = (field: keyof FormData) => async (e: any) => {
    if (field === 'nmcPin') {
      // Clean pasted NMC PIN
      const text = e.nativeEvent?.text;
      if (text) {
        handleFieldChange('nmcPin', formatNMCPin(text));
      }
    }
  };
  
  // Form submission
  const handleNext = async () => {
    // Dismiss keyboard when form is submitted
    if (TextInput.State.currentlyFocusedInput()) {
      TextInput.State.blurTextInput(TextInput.State.currentlyFocusedInput());
    }
    
    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach(key => {
      // Only validate the fields in the current step
      if (['fullName', 'email', 'nmcPin', 'password'].includes(key)) {
        const field = key as keyof FormData;
        const value = formData[field];
        const error = validateField(field, typeof value === 'string' ? value : String(value));
        if (error) newErrors[field as keyof FormErrors] = error;
      }
    });
    
    setErrors(newErrors);
    setTouched(new Set(['fullName', 'email', 'nmcPin', 'password']));
    
    if (Object.keys(newErrors).length > 0) {
      // Shake first invalid field
      shakeAnimation();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Store password securely
      await SecureStore.setItemAsync('user_password', formData.password);
      
      // Store other data
      await AsyncStorage.setItem('@user_registration', JSON.stringify({
        fullName: formData.fullName,
        email: formData.email,
        nmcPin: formData.nmcPin,
        currentStep: FORM_STEPS.PROFESSIONAL,
      }));
      
      // Clear draft
      await AsyncStorage.removeItem(DRAFT_KEY);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to next step (placeholder for now)
      navigation.navigate(ROUTES.Onboarding as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to save registration data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // This will dismiss keyboard when tapping outside inputs
  const dismissKeyboard = () => {
    TextInput.State.blurTextInput(TextInput.State.currentlyFocusedInput());
  };

  return (
    <LinearGradient
      colors={[COLORS.primary, COLORS.purple2]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {!netInfo.isConnected && <OfflineBanner />}
        
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 120 : 30}
        >
          <TouchableWithoutFeedback onPress={dismissKeyboard}>
            <View style={{ flex: 1 }}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
                scrollEnabled={true}
                nestedScrollEnabled={true}
                alwaysBounceVertical={true}
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { translateX: shakeAnim },
              ],
              paddingTop: 16,
            }}
              >
              <BackButton onPress={() => navigation.goBack()} />
              
              <ProgressIndicator
                currentStep={FORM_STEPS.PERSONAL}
                totalSteps={3}
                style={{ marginTop: 16 }}
              />
              
              <Text style={styles.title}>Registration</Text>
              <Text style={styles.subtitle}>Personal Information</Text>
              
              <View style={{ marginTop: 24, gap: 20 }}>
                <TextField
                  label="Full Name"
                  value={formData.fullName}
                  onChangeText={(text) => handleFieldChange('fullName', text)}
                  onBlur={() => handleFieldBlur('fullName')}
                  onFocus={() => scrollToPosition(0)}
                  onSubmitEditing={() => {
                    emailRef.current?.focus();
                    scrollToPosition(100);
                  }}
                  error={errors.fullName}
                  placeholder="Enter your full name"
                  returnKeyType="next"
                  accessibilityLabel="Full Name"
                  accessibilityHint="Enter your full name as it appears on your NMC registration"
                  rightIcon={
                    <TouchableOpacity
                      accessibilityLabel="Use voice input"
                      accessibilityHint="Tap to use voice input for this field"
                    >
                      <Text style={{ fontSize: 20, color: 'white' }}>🎤</Text>
                    </TouchableOpacity>
                  }
                />
                
                <TextField
                  ref={emailRef}
                  label="Email Address"
                  value={formData.email}
                  onChangeText={(text) => handleFieldChange('email', text)}
                  onBlur={() => handleFieldBlur('email')}
                  onFocus={() => scrollToPosition(100)}
                  onSubmitEditing={() => {
                    nmcPinRef.current?.focus();
                    scrollToPosition(200);
                  }}
                  error={errors.email}
                  placeholder="your.email@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  accessibilityLabel="Email Address"
                  accessibilityHint="Enter your email address for account access"
                />
                
                <TextField
                  ref={nmcPinRef}
                  label="NMC PIN"
                  value={formData.nmcPin}
                  onChangeText={(text) => handleFieldChange('nmcPin', text)}
                  onBlur={() => handleFieldBlur('nmcPin')}
                  onFocus={() => scrollToPosition(200)}
                  onSubmitEditing={() => {
                    passwordRef.current?.focus();
                    scrollToPosition(300);
                  }}
                  onPaste={handlePaste('nmcPin')}
                  error={errors.nmcPin}
                  placeholder="XX123456"
                  autoCapitalize="characters"
                  returnKeyType="next"
                  maxLength={9}
                  accessibilityLabel="NMC PIN"
                  accessibilityHint="Enter your NMC PIN in format XX123456"
                />
                
                <PasswordField
                  ref={passwordRef}
                  label="Password"
                  value={formData.password}
                  onChangeText={(text) => handleFieldChange('password', text)}
                  onBlur={() => handleFieldBlur('password')}
                  onSubmitEditing={() => {
                    // Dismiss keyboard and scroll back to top after submission
                    scrollToPosition(0);
                    handleNext();
                  }}
                  error={errors.password}
                  placeholder="Enter a secure password"
                  returnKeyType="done"
                  accessibilityLabel="Password"
                  accessibilityHint="Create a password with at least 8 characters, including letters and numbers"
                />
              </View>
              
              <View style={{ justifyContent: 'flex-end', paddingBottom: 32, marginTop: 32 }}>
                <PrimaryButton
                  label={isSubmitting ? "Creating Account..." : "Next"}
                  onPress={handleNext}
                  disabled={!isFormValid() || isSubmitting}
                  loading={isSubmitting}
                  shimmer={isFormValid() && !isSubmitting}
                />
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 300,
    minHeight: '150%', // Forces scroll on all screen sizes
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 24,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
});
