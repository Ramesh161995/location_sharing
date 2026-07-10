import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Dialog, Button, Text } from 'react-native-paper';
import { useTheme } from '../contexts/ThemeContext';

interface TermsOfServiceDialogProps {
  visible: boolean;
  onDismiss: () => void;
}

const TermsOfServiceDialog: React.FC<TermsOfServiceDialogProps> = ({ visible, onDismiss }) => {
  const { theme } = useTheme();
  const isDark = theme.isDark;
  const dynamicStyles = createStyles(isDark);

  return (
    <Dialog visible={visible} onDismiss={onDismiss} style={dynamicStyles.dialog}>
      <Dialog.Title style={dynamicStyles.dialogTitle}>Terms of Service</Dialog.Title>
      <Dialog.Content style={dynamicStyles.dialogContent}>
        <ScrollView style={dynamicStyles.scrollView} showsVerticalScrollIndicator={false}>
          <Text style={dynamicStyles.sectionTitle}>Last Updated: {new Date().toLocaleDateString()}</Text>
          
          <Text style={dynamicStyles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={dynamicStyles.text}>
            By accessing and using this Location Sharing App, you accept and agree to be bound by these Terms of Service. If you do not agree, please do not use the app.
          </Text>
          
          <Text style={dynamicStyles.sectionTitle}>2. Description of Service</Text>
          <Text style={dynamicStyles.text}>
            Our app provides location sharing services that allow users to:
          </Text>
          <Text style={dynamicStyles.bullet}>• Share real-time location with authorized contacts</Text>
          <Text style={dynamicStyles.bullet}>• View locations of contacts who have shared with you</Text>
          <Text style={dynamicStyles.bullet}>• Manage contact lists and location sharing permissions</Text>
          
          <Text style={dynamicStyles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={dynamicStyles.text}>You agree to:</Text>
          <Text style={dynamicStyles.bullet}>• Provide accurate and current information</Text>
          <Text style={dynamicStyles.bullet}>• Use the service only for lawful purposes</Text>
          <Text style={dynamicStyles.bullet}>• Respect the privacy of other users</Text>
          <Text style={dynamicStyles.bullet}>• Not misuse location data of others</Text>
          <Text style={dynamicStyles.bullet}>• Keep your account credentials secure</Text>
          
          <Text style={dynamicStyles.sectionTitle}>4. Location Sharing</Text>
          <Text style={dynamicStyles.text}>
            By using location sharing features:
          </Text>
          <Text style={dynamicStyles.bullet}>• You consent to sharing your location data</Text>
          <Text style={dynamicStyles.bullet}>• You can control who sees your location</Text>
          <Text style={dynamicStyles.bullet}>• Location sharing can be stopped at any time</Text>
          <Text style={dynamicStyles.bullet}>• Sharing location with others is at your own discretion</Text>
          
          <Text style={dynamicStyles.sectionTitle}>5. Prohibited Uses</Text>
          <Text style={dynamicStyles.text}>You may not:</Text>
          <Text style={dynamicStyles.bullet}>• Use the service to track someone without consent</Text>
          <Text style={dynamicStyles.bullet}>• Share false or misleading location information</Text>
          <Text style={dynamicStyles.bullet}>• Use the service for illegal activities</Text>
          <Text style={dynamicStyles.bullet}>• Interfere with the app's functionality</Text>
          <Text style={dynamicStyles.bullet}>• Access other users' data without authorization</Text>
          
          <Text style={dynamicStyles.sectionTitle}>6. Privacy and Data</Text>
          <Text style={dynamicStyles.text}>
            Your use of the app is also governed by our Privacy Policy. We handle your location data according to our privacy practices.
          </Text>
          
          <Text style={dynamicStyles.sectionTitle}>7. Service Availability</Text>
          <Text style={dynamicStyles.text}>
            We strive to provide reliable service but do not guarantee uninterrupted access. The service may be unavailable due to maintenance, technical issues, or other reasons.
          </Text>
          
          <Text style={dynamicStyles.sectionTitle}>8. Limitation of Liability</Text>
          <Text style={dynamicStyles.text}>
            We are not liable for any indirect, incidental, or consequential damages arising from your use of the service. Location data is provided "as is" without warranties.
          </Text>
          
          <Text style={dynamicStyles.sectionTitle}>9. Changes to Terms</Text>
          <Text style={dynamicStyles.text}>
            We reserve the right to modify these terms at any time. Continued use after changes constitutes acceptance of modified terms.
          </Text>
          
          <Text style={dynamicStyles.sectionTitle}>10. Contact Information</Text>
          <Text style={dynamicStyles.text}>
            For questions about these terms, contact us at:
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

export default TermsOfServiceDialog;

