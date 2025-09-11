import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_complete';

/**
 * Check if user has completed onboarding
 */
export const getOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_KEY);
    return value === 'true';
  } catch (error) {
    console.error('Error getting onboarding status:', error);
    return false;
  }
};

/**
 * Mark onboarding as complete
 */
export const setOnboardingComplete = async (complete: boolean = true): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_KEY, complete.toString());
  } catch (error) {
    console.error('Error setting onboarding status:', error);
  }
};

/**
 * Clear onboarding status (for testing or reset)
 */
export const clearOnboardingStatus = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(ONBOARDING_KEY);
  } catch (error) {
    console.error('Error clearing onboarding status:', error);
  }
};