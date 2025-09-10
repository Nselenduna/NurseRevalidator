import React from 'react';
import { 
  TouchableOpacity, 
  StyleSheet, 
  ViewStyle,
  Text
} from 'react-native';
import * as Haptics from 'expo-haptics';

interface BackButtonProps {
  onPress: () => void;
  style?: ViewStyle;
}

const BackButton: React.FC<BackButtonProps> = ({ onPress, style }) => {
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };
  
  return (
    <TouchableOpacity 
      style={[styles.container, style]} 
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Go back"
      accessibilityHint="Returns to the previous screen"
    >
      <Text style={{ fontSize: 24, color: 'white', fontWeight: 'bold' }}>←</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default BackButton;
