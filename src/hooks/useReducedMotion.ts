import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook to detect if the user has enabled reduced motion accessibility setting
 * @returns boolean indicating if reduced motion is enabled
 */
export const useReducedMotion = (): boolean => {
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    let isMounted = true;

    // Get initial value
    const getInitialValue = async () => {
      const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
      if (isMounted) {
        setIsReducedMotion(isReduced);
      }
    };

    // Set up event listener for changes
    const listener = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (isReduced) => {
        if (isMounted) {
          setIsReducedMotion(isReduced);
        }
      }
    );

    getInitialValue();

    // Clean up
    return () => {
      isMounted = false;
      listener.remove();
    };
  }, []);

  return isReducedMotion;
};

export default useReducedMotion;
