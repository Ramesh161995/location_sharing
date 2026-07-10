import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Alert } from 'react-native';

export default function App() {
  const testBackendConnection = async () => {
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      Alert.alert('Backend Connected!', `Status: ${data.status}`);
    } catch (error) {
      Alert.alert('Backend Error', 'Could not connect to backend. Make sure it\'s running on port 8000.');
    }
  };

  const testAuthEndpoint = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/request-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone: '+1234567890' }),
      });
      const data = await response.json();
      Alert.alert('Auth Test', `Response: ${JSON.stringify(data)}`);
    } catch (error) {
      Alert.alert('Auth Error', `Error: ${error.message}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Location Sharing App</Text>
        <Text style={styles.subtitle}>Testing Mode 🧪</Text>
        
        <TouchableOpacity style={styles.button} onPress={testBackendConnection}>
          <Text style={styles.buttonText}>Test Backend Connection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.button} onPress={testAuthEndpoint}>
          <Text style={styles.buttonText}>Test Auth Endpoint</Text>
        </TouchableOpacity>
        
        <Text style={styles.info}>
          If you see this screen without crashes, the basic setup is working!
        </Text>
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
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
    minWidth: 200,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 20,
  },
});








