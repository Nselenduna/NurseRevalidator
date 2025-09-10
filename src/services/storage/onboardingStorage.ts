import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys for AsyncStorage
const ONBOARDING_COMPLETE_KEY = 'onboardingComplete';
const FIRST_RUN_AT_KEY = 'firstRunAt';

/**
 * Gets the onboarding completion status
 * @returns Promise with boolean value indicating if onboarding is complete
 */
export const getOnboardingComplete = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(ONBOARDING_COMPLETE_KEY);
    return value === 'true';
  } catch (e) {
    console.error('Failed to get onboarding status:', e);
    return false;
  }
};

/**
 * Sets the onboarding completion status
 * @param value Boolean value to set for onboarding completion
 * @returns Promise that resolves when the value is set
 */
export const setOnboardingComplete = async (value: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, value.toString());
    
    // If onboarding is being completed for the first time, record the timestamp
    if (value === true) {
      const firstRunExists = await AsyncStorage.getItem(FIRST_RUN_AT_KEY);
      if (!firstRunExists) {
        await AsyncStorage.setItem(FIRST_RUN_AT_KEY, new Date().toISOString());
      }
    }
  } catch (e) {
    console.error('Failed to save onboarding status:', e);
  }
};

/**
 * Gets the first run timestamp
 * @returns Promise with ISO string date when app was first run
 */
export const getFirstRunTimestamp = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(FIRST_RUN_AT_KEY);
  } catch (e) {
    console.error('Failed to get first run timestamp:', e);
    return null;
  }
};
