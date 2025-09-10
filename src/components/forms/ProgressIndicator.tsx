import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { COLORS } from '../../utils/constants/colors';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  style?: ViewStyle;
}

const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index + 1 <= currentStep;
        const isLast = index === totalSteps - 1;
        
        return (
          <React.Fragment key={index}>
            <View 
              style={[
                styles.dot,
                isActive ? styles.activeDot : styles.inactiveDot
              ]}
              accessibilityLabel={
                isActive
                  ? `Step ${index + 1} of ${totalSteps}, current step`
                  : `Step ${index + 1} of ${totalSteps}, future step`
              }
            />
            
            {!isLast && (
              <View 
                style={[
                  styles.line,
                  isActive ? styles.activeLine : styles.inactiveLine
                ]}
                accessible={false}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  activeDot: {
    backgroundColor: COLORS.secondary,
  },
  inactiveDot: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  line: {
    height: 2,
    flex: 1,
    marginHorizontal: 4,
  },
  activeLine: {
    backgroundColor: COLORS.secondary,
  },
  inactiveLine: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default ProgressIndicator;
