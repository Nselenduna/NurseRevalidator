import React, { forwardRef, useState } from 'react';
import { 
  View, 
  TextInput, 
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  Text,
} from 'react-native';

import TextField from './TextField';

interface PasswordFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onBlur?: () => void;
  onSubmitEditing?: () => void;
  error?: string;
  placeholder?: string;
  returnKeyType?: "done" | "go" | "next" | "search" | "send";
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
    invalid?: boolean;
    required?: boolean;
  };
}

const PasswordField = forwardRef<TextInput, PasswordFieldProps>(({
  label,
  value,
  onChangeText,
  onBlur,
  onSubmitEditing,
  error,
  placeholder,
  returnKeyType,
  style,
  accessibilityLabel,
  accessibilityHint,
  accessibilityState,
}, ref) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(prev => !prev);
  };
  
  return (
    <TextField
      ref={ref}
      label={label}
      value={value}
      onChangeText={onChangeText}
      onBlur={onBlur}
      onSubmitEditing={onSubmitEditing}
      error={error}
      placeholder={placeholder}
      secureTextEntry={!isPasswordVisible}
      returnKeyType={returnKeyType}
      autoCapitalize="none"
      autoComplete="password"
      textContentType="newPassword"
      style={style}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityState={accessibilityState}
      rightIcon={
        <TouchableOpacity 
          onPress={togglePasswordVisibility} 
          style={styles.visibilityIcon}
          accessibilityRole="button"
          accessibilityLabel={isPasswordVisible ? "Hide password" : "Show password"}
          accessibilityHint={isPasswordVisible ? "Tap to hide password text" : "Tap to show password text"}
        >
          <Text style={{ 
            fontSize: 22,
            color: "rgba(255, 255, 255, 0.7)",
            fontWeight: "bold"
          }}>
            {isPasswordVisible ? "👁️‍🗨️" : "👁️"}
          </Text>
        </TouchableOpacity>
      }
    />
  );
});

const styles = StyleSheet.create({
  visibilityIcon: {
    padding: 4,
  },
});

export default PasswordField;
