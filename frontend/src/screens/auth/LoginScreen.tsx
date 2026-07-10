import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Surface } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState } from '../../store';
import { requestOTP } from '../../store/slices/authSlice';
import { authAPI } from '../../services/authAPI';
import { useTheme } from '../../contexts/ThemeContext';
import PinShareLogo from '../../components/PinShareLogo';

const { width, height } = Dimensions.get('window');

const LoginScreen = () => {
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [isValidPhone, setIsValidPhone] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  const { theme } = useTheme();
  
  const gradientColors = theme.isDark 
    ? ['#764ba2', '#667eea', '#4a5568'] as const
    : ['#667eea', '#764ba2', '#f093fb'] as const;

  useEffect(() => {
    // Animate on mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const validatePhone = (phoneNumber: string) => {
    // Basic phone validation (can be enhanced)
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phoneNumber);
  };

  const checkPhoneAndPopulateName = async (phoneNumber: string) => {
    if (validatePhone(phoneNumber)) {
      try {
        const response = await authAPI.checkPhone(phoneNumber);
        if (response?.exists && response?.name) {
          // Auto-populate name field if user exists
          setFullName(response.name);
        }
      } catch (error) {
        // Silently fail - if check fails, user can still proceed
        console.log('Could not check phone:', error);
      }
    }
  };

  const handlePhoneChange = (text: string) => {
    setPhone(text);
    const isValid = validatePhone(text);
    setIsValidPhone(isValid);
    
    // Check phone and populate name when phone is valid
    if (isValid) {
      checkPhoneAndPopulateName(text);
    } else if (text.length === 0) {
      // Clear name field if phone is cleared
      setFullName('');
    }
  };

  const handleRequestOTP = async () => {
    if (isValidPhone) {
      try {
        await dispatch(requestOTP(phone) as any);
        (navigation as any).navigate('OTPVerification', { phone, name: fullName.trim() || undefined });
      } catch (error) {
        console.error('Failed to request OTP:', error);
      }
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView 
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            <Animated.View
              style={[
                styles.animatedContainer,
                {
                  opacity: fadeAnim,
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <View style={styles.logoContainer}>
                <PinShareLogo size="large" variant="vertical" />
              </View>

              <Text style={styles.welcomeTitle}>
                Welcome to PinShare
              </Text>

              <Text style={styles.subtitle}>
                Pin your location, share your world
              </Text>

              <Surface style={[styles.surface, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FFFFFF' }]} elevation={4}>
                <Text style={[styles.formTitle, { color: theme.isDark ? '#FFFFFF' : '#333' }]}>
                  Get Started
                </Text>
                <Text style={[styles.formSubtitle, { color: theme.isDark ? '#B0B0B0' : '#666' }]}>
                  Enter your details to continue
                </Text>

                <TextInput
                  label="Phone Number"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  keyboardType="phone-pad"
                  style={[styles.input, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FFFFFF' }]}
                  placeholder="+1234567890"
                  error={phone.length > 0 && !isValidPhone}
                  disabled={isLoading}
                  mode="outlined"
                  left={<TextInput.Icon icon="phone" />}
                  textColor={theme.isDark ? '#FFFFFF' : '#000000'}
                  theme={{
                    colors: {
                      primary: '#2196F3',
                      text: theme.isDark ? '#FFFFFF' : '#000000',
                      placeholder: theme.isDark ? '#999' : '#666',
                      background: theme.isDark ? '#1E1E1E' : '#FFFFFF',
                      onSurface: theme.isDark ? '#FFFFFF' : '#000000',
                    }
                  }}
                />

                <TextInput
                  label="Full Name"
                  value={fullName}
                  onChangeText={setFullName}
                  style={[styles.input, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FFFFFF' }]}
                  placeholder={isValidPhone ? "Name will be auto-filled if account exists" : "Enter your name"}
                  disabled={isLoading}
                  mode="outlined"
                  left={<TextInput.Icon icon="account" />}
                  autoCapitalize="words"
                  textColor={theme.isDark ? '#FFFFFF' : '#000000'}
                  theme={{
                    colors: {
                      primary: '#2196F3',
                      text: theme.isDark ? '#FFFFFF' : '#000000',
                      placeholder: theme.isDark ? '#999' : '#666',
                      background: theme.isDark ? '#1E1E1E' : '#FFFFFF',
                      onSurface: theme.isDark ? '#FFFFFF' : '#000000',
                    }
                  }}
                />

                {phone.length > 0 && !isValidPhone && (
                  <Text style={styles.errorText}>
                    Please enter a valid phone number
                  </Text>
                )}

                {error && (
                  <Text style={styles.errorText}>{error}</Text>
                )}

                <Button
                  mode="contained"
                  onPress={handleRequestOTP}
                  disabled={!isValidPhone || isLoading}
                  style={styles.button}
                  loading={isLoading}
                  contentStyle={styles.buttonContent}
                  labelStyle={styles.buttonLabel}
                >
                  {isLoading ? 'Sending OTP...' : 'Send OTP'}
                </Button>

                <Text style={[styles.terms, { color: theme.isDark ? '#B0B0B0' : '#666' }]}>
                  By continuing, you agree to our Terms of Service and Privacy Policy
                </Text>
              </Surface>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  animatedContainer: {
    width: '100%',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: 'rgba(255, 255, 255, 0.9)',
    fontStyle: 'italic',
  },
  surface: {
    padding: 24,
    borderRadius: 20,
    backgroundColor: 'white',
  },
  formTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  formSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  input: {
    marginBottom: 16,
    backgroundColor: 'white',
  },
  button: {
    marginTop: 8,
    marginBottom: 24,
    borderRadius: 12,
    elevation: 2,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 16,
    marginLeft: 4,
  },
  terms: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoginScreen;
