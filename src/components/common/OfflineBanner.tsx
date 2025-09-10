import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const OfflineBanner: React.FC = () => {
  return (
    <View 
      style={styles.container}
      accessibilityRole="alert"
      accessibilityLiveRegion="assertive"
    >
      <Text style={{ fontSize: 16, color: 'white' }}>☁️❌</Text>
      <Text style={styles.text}>
        You're currently offline
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  text: {
    color: 'white',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default OfflineBanner;
