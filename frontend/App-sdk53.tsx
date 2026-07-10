import React from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Location Sharing App</Text>
        <Text style={styles.subtitle}>SDK 53 Working! 🎉</Text>
        <Text style={styles.info}>React Native 0.76.3</Text>
        <Text style={styles.status}>✅ No crashes!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  content: {
    flex: 1,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  info: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
    textAlign: 'center',
  },
  status: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});









