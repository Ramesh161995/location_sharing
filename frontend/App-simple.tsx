import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Sharing App</Text>
      <Text style={styles.subtitle}>Frontend is working! 🎉</Text>
      <Text style={styles.info}>SDK 53 + React Native 0.76.3</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: 'white',
    marginBottom: 12,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
});









