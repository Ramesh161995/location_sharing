import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Dialog, Button, Text } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

interface PrivacyPolicyDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

const PrivacyPolicyDialog: React.FC<PrivacyPolicyDialogProps> = ({ visible, onDismiss }) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const dynamicStyles = createStyles(isDark);

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={dynamicStyles.dialog}>
      <Dialog.Title style={dynamicStyles.dialogTitle}>Privacy Policy</Dialog.Title>
      <Dialog.Content style={dynamicStyles.dialogContent}>
        <ScrollView style={dynamicStyles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={dynamicStyles.sectionTitle}>Last Updated: {new Date().toLocaleDateString()}</Text>
              
          <Text style={dynamicStyles.sectionTitle}>1. Information We Collect</Text>
          <Text style={dynamicStyles.text}>
            Our Location Sharing App collects the following information:
          </Text>
          <Text style={dynamicStyles.bullet}>• Personal Information: Name, phone number</Text>
          <Text style={dynamicStyles.bullet}>• Location Data: Real-time and historical location information</Text>
          <Text style={dynamicStyles.bullet}>• Contact Information: Phone contacts you choose to share with</Text>
          
          <Text style={dynamicStyles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={dynamicStyles.text}>
            We use your information to:
          </Text>
          <Text style={dynamicStyles.bullet}>• Provide location sharing services with your contacts</Text>
          <Text style={dynamicStyles.bullet}>• Enable real-time location tracking and updates</Text>
          <Text style={dynamicStyles.bullet}>• Improve our services and user experience</Text>
          <Text style={dynamicStyles.bullet}>• Send important notifications about your account</Text>
          
          <Text style={dynamicStyles.sectionTitle}>3. Location Data</Text>
          <Text style={dynamicStyles.text}>
            Your location data is:
          </Text>
          <Text style={dynamicStyles.bullet}>• Only shared with contacts you explicitly authorize</Text>
          <Text style={dynamicStyles.bullet}>• Stored securely on our servers</Text>
          <Text style={dynamicStyles.bullet}>• Used solely for the purpose of location sharing</Text>
          <Text style={dynamicStyles.bullet}>• You can stop sharing at any time</Text>
          
          <Text style={dynamicStyles.sectionTitle}>4. Data Security</Text>
          <Text style={dynamicStyles.text}>
            We implement industry-standard security measures to protect your data:
          </Text>
          <Text style={dynamicStyles.bullet}>• Encrypted data transmission</Text>
          <Text style={dynamicStyles.bullet}>• Secure server storage</Text>
          <Text style={dynamicStyles.bullet}>• Authentication and authorization controls</Text>
          
          <Text style={dynamicStyles.sectionTitle}>5. Your Rights</Text>
          <Text style={dynamicStyles.text}>You have the right to:</Text>
          <Text style={dynamicStyles.bullet}>• Access your personal data</Text>
          <Text style={dynamicStyles.bullet}>• Update or correct your information</Text>
          <Text style={dynamicStyles.bullet}>• Delete your account and data</Text>
          <Text style={dynamicStyles.bullet}>• Control who can see your location</Text>
          
          <Text style={dynamicStyles.sectionTitle}>6. Contact Us</Text>
          <Text style={dynamicStyles.text}>
            For privacy-related questions, contact us at:
          </Text>
          <Text style={dynamicStyles.contact}>Phone: +91 9818336765</Text>
          <Text style={dynamicStyles.contact}>Email: ranjan23.ramesh@gmail.com</Text>
        </ScrollView>
      </Dialog.Content>
      <Dialog.Actions>
        <Button onPress={onDismiss}>Close</Button>
      </Dialog.Actions>
    </Dialog>
  );
};

const createStyles = (isDark: boolean) => StyleSheet.create({
  dialog: {
    maxHeight: '100%',
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  dialogTitle: {
    color: isDark ? '#FFFFFF' : '#000000',
  },
  dialogContent: {
    paddingBottom: 0,
    backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
  },
  scrollView: {
    maxHeight: 400,
    paddingBottom: 0,
    marginBottom: 0,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    color: isDark ? '#FFFFFF' : '#333',
  },
  text: {
    fontSize: 14,
    marginBottom: 8,
    color: isDark ? '#B0B0B0' : '#666',
    lineHeight: 20,
  },
  bullet: {
    fontSize: 14,
    marginBottom: 4,
    marginLeft: 16,
    color: isDark ? '#B0B0B0' : '#666',
    lineHeight: 20,
  },
  contact: {
    fontSize: 14,
    marginBottom: 4,
    color: '#2196F3',
    fontWeight: '600',
  },
});

const styles = StyleSheet.create({});

export default PrivacyPolicyDialog;

