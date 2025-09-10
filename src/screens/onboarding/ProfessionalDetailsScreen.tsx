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
  TextInput,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useNavigation } from '@react-navigation/native';

// Components
import TextField from '../../components/forms/TextField';
import DropdownField from '../../components/forms/DropdownField';
import MultiSelectChips from '../../components/forms/MultiSelectChips';
import PrimaryButton from '../../components/forms/PrimaryButton';
import BackButton from '../../components/forms/BackButton';
import ProgressIndicator from '../../components/forms/ProgressIndicator';

// Constants
import { COLORS } from '../../utils/constants/colors';
import { ROUTES } from '../../utils/constants/routes';

// Types
interface ProfessionalData {
  role: string;
  workplaceName: string;
  workplaceType: string;
  yearsOfExperience: string;
  specialisations: string[];
}

interface FormErrors {
  role?: string;
  workplaceName?: string;
  workplaceType?: string;
  yearsOfExperience?: string;
}

const ROLES = [
  { label: 'Registered Nurse', value: 'nurse' },
  { label: 'Midwife', value: 'midwife' },
  { label: 'Student Nurse', value: 'student' },
  { label: 'Nurse Practitioner', value: 'practitioner' },
  { label: 'Other', value: 'other' },
];

const WORKPLACE_TYPES = [
  { label: 'NHS Hospital', value: 'nhs_hospital' },
  { label: 'Private Hospital', value: 'private_hospital' },
  { label: 'GP Practice', value: 'gp_practice' },
  { label: 'Community Care', value: 'community' },
  { label: 'Care Home', value: 'care_home' },
  { label: 'Mental Health', value: 'mental_health' },
  { label: 'Other', value: 'other' },
];

const SPECIALISATIONS = [
  'Adult Nursing',
  'Paediatrics',
  'Mental Health',
  'Learning Disabilities',
  'Emergency Care',
  'Intensive Care',
  'Surgery',
  'Oncology',
  'Palliative Care',
  'Community Health',
  'Midwifery',
  'Research',
];

const DRAFT_KEY = '@professional_draft';
const FORM_STEPS = { PERSONAL: 1, PROFESSIONAL: 2, SECURITY: 3 };

export default function ProfessionalDetailsScreen() {
  const navigation = useNavigation();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef(SPECIALISATIONS.map(() => new Animated.Value(1))).current;
  
  // Input refs
  const workplaceNameRef = useRef<TextInput>(null);
  const yearsRef = useRef<TextInput>(null);
  
  // Form state
  const [formData, setFormData] = useState<ProfessionalData>({
    role: '',
    workplaceName: '',
    workplaceType: '',
    yearsOfExperience: '',
    specialisations: [],
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<keyof ProfessionalData>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  
  // Check accessibility settings
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReducedMotion);
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
  
  // Restore draft
  useEffect(() => {
    const restoreDraft = async () => {
      try {
        const draft = await AsyncStorage.getItem(DRAFT_KEY);
        if (draft) {
          setFormData(JSON.parse(draft));
        }
      } catch (error) {
        console.error('Failed to restore draft:', error);
      }
    };
    restoreDraft();
  }, []);
  
  // Auto-save draft
  useEffect(() => {
    const saveDraft = async () => {
      try {
        await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(formData));
      } catch (error) {
        console.error('Failed to save draft:', error);
      }
    };
    
    const debounce = setTimeout(saveDraft, 500);
    return () => clearTimeout(debounce);
  }, [formData]);
  
  // Validation
  const validateField = (field: keyof ProfessionalData, value: any): string | undefined => {
    switch (field) {
      case 'role':
        return !value ? 'Please select your role' : undefined;
      case 'workplaceName':
        return !value || value.length < 2 ? 'Please enter your workplace name' : undefined;
      case 'workplaceType':
        return !value ? 'Please select workplace type' : undefined;
      case 'yearsOfExperience':
        const years = parseInt(value);
        if (isNaN(years) || years < 0 || years > 50) {
          return 'Years must be between 0 and 50';
        }
        return undefined;
      default:
        return undefined;
    }
  };
  
  const handleFieldChange = (field: keyof ProfessionalData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (touched.has(field)) {
      const error = validateField(field, value);
      setErrors(prev => ({ ...prev, [field]: error }));
    }
    
    // Auto-advance logic for dropdowns
    if (field === 'role' && value && !formData.workplaceName) {
      setTimeout(() => workplaceNameRef.current?.focus(), 100);
    }
  };
  
  const handleFieldBlur = (field: keyof ProfessionalData) => {
    setTouched(prev => new Set(prev).add(field));
    const error = validateField(field, formData[field]);
    setErrors(prev => ({ ...prev, [field]: error }));
  };
  
  const handleSpecialisationToggle = async (specialisation: string, index: number) => {
    const isSelected = formData.specialisations.includes(specialisation);
    
    // Haptic feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Animate chip
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(scaleAnims[index], {
          toValue: isSelected ? 0.95 : 1.05,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnims[index], {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    
    // Update selection
    setFormData(prev => ({
      ...prev,
      specialisations: isSelected
        ? prev.specialisations.filter(s => s !== specialisation)
        : [...prev.specialisations, specialisation],
    }));
  };
  
  const isFormValid = () => {
    return (
      !!formData.role &&
      formData.workplaceName.length >= 2 &&
      !!formData.workplaceType &&
      !!formData.yearsOfExperience &&
      !isNaN(parseInt(formData.yearsOfExperience)) &&
      parseInt(formData.yearsOfExperience) >= 0 &&
      parseInt(formData.yearsOfExperience) <= 50
    );
  };
  
  const handleNext = async () => {
    // Validate all fields
    const newErrors: FormErrors = {};
    (Object.keys(formData) as Array<keyof ProfessionalData>).forEach(field => {
      if (field !== 'specialisations') {
        const error = validateField(field, formData[field]);
        if (error) newErrors[field] = error;
      }
    });
    
    setErrors(newErrors);
    setTouched(new Set(Object.keys(formData) as Array<keyof ProfessionalData>));
    
    if (Object.keys(newErrors).length > 0) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Merge with existing registration data
      const existingData = await AsyncStorage.getItem('@user_registration');
      const merged = {
        ...(existingData ? JSON.parse(existingData) : {}),
        ...formData,
        currentStep: FORM_STEPS.SECURITY,
      };
      
      await AsyncStorage.setItem('@user_registration', JSON.stringify(merged));
      await AsyncStorage.removeItem(DRAFT_KEY);
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      // Navigate to security preferences screen
      navigation.navigate(ROUTES.SecurityPreferences as never);
    } catch (error) {
      Alert.alert('Error', 'Failed to save professional details. Please try again.');
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
                currentStep={FORM_STEPS.PROFESSIONAL}
                totalSteps={3}
                style={styles.progressIndicator}
              />
              
              <Text style={styles.title}>Professional Details</Text>
              <Text style={styles.subtitle}>Tell us about your role and experience</Text>
              
              <View style={styles.formContainer}>
                <DropdownField
                  label="Role"
                  value={formData.role}
                  options={ROLES}
                  onChange={(value) => handleFieldChange('role', value)}
                  onBlur={() => handleFieldBlur('role')}
                  error={errors.role}
                  placeholder="Select your role"
                  accessibilityLabel="Professional Role"
                  accessibilityHint="Select your current professional role"
                />
                
                <TextField
                  ref={workplaceNameRef}
                  label="Workplace Name"
                  value={formData.workplaceName}
                  onChangeText={(text) => handleFieldChange('workplaceName', text)}
                  onBlur={() => handleFieldBlur('workplaceName')}
                  error={errors.workplaceName}
                  placeholder="Enter your workplace name"
                  returnKeyType="next"
                  onSubmitEditing={() => yearsRef.current?.focus()}
                  accessibilityLabel="Workplace Name"
                  accessibilityHint="Enter the name of your current workplace"
                />
                
                <DropdownField
                  label="Workplace Type"
                  value={formData.workplaceType}
                  options={WORKPLACE_TYPES}
                  onChange={(value) => handleFieldChange('workplaceType', value)}
                  onBlur={() => handleFieldBlur('workplaceType')}
                  error={errors.workplaceType}
                  placeholder="Select workplace type"
                  accessibilityLabel="Workplace Type"
                  accessibilityHint="Select the type of healthcare facility"
                />
                
                <TextField
                  ref={yearsRef}
                  label="Years of Experience"
                  value={formData.yearsOfExperience}
                  onChangeText={(text) => handleFieldChange('yearsOfExperience', text.replace(/[^0-9]/g, ''))}
                  onBlur={() => handleFieldBlur('yearsOfExperience')}
                  error={errors.yearsOfExperience}
                  placeholder="0"
                  keyboardType="numeric"
                  maxLength={2}
                  returnKeyType="done"
                  accessibilityLabel="Years of Experience"
                  accessibilityHint="Enter your total years of professional experience"
                />
                
                <View>
                  <Text style={styles.specialisationLabel}>Specialisations (Optional)</Text>
                  <MultiSelectChips
                    options={SPECIALISATIONS}
                    selected={formData.specialisations}
                    onToggle={handleSpecialisationToggle}
                    scaleAnims={scaleAnims}
                    accessibilityLabel="Specialisations"
                    accessibilityHint="Select any areas of specialisation"
                  />
                </View>
              </View>
              
              <View style={styles.buttonContainer}>
                <PrimaryButton
                  label={isSubmitting ? "Saving..." : "Next"}
                  onPress={handleNext}
                  disabled={!isFormValid() || isSubmitting}
                  loading={isSubmitting}
                  shimmer={isFormValid() && !isSubmitting}
                />
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
  specialisationLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
  },
  buttonContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 32,
    marginTop: 32,
  },
});