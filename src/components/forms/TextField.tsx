import React, { forwardRef } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  Animated,
  ViewStyle,
} from 'react-native';
import { COLORS } from '../../utils/constants/colors';

interface TextFieldProps extends Omit<TextInputProps, 'onPaste'> {
  label: string;
  error?: string;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  onPaste?: (e: any) => void;
}

const TextField = forwardRef<TextInput, TextFieldProps>(({
  label,
  error,
  rightIcon,
  style,
  onPaste,
  ...props
}, ref) => {
  const borderColor = error ? COLORS.error : 'rgba(255, 255, 255, 0.3)';
  
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={[
        styles.inputContainer,
        { borderColor }
      ]}>
        <TextInput
          ref={ref}
          style={styles.input}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
          selectionColor={COLORS.secondary}
          autoCorrect={false}
          {...props}
        />
        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>
      
      {error && (
        <Animated.Text 
          style={styles.error}
          accessibilityLiveRegion="polite"
        >
          {error}
        </Animated.Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: 4,
  },
  label: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 2,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rightIcon: {
    paddingRight: 12,
  },
  error: {
    color: COLORS.error,
    fontSize: 14,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default TextField;
