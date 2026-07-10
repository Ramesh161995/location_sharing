import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { TextInput, Button, Surface } from 'react-native-paper';
import { Text } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RootState } from '../../store';
import { verifyOTP } from '../../store/slices/authSlice';
import { useTheme } from '../../contexts/ThemeContext';
import PinShareLogo from '../../components/PinShareLogo';

const OTPVerificationScreen = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(300); // 5 minutes
  const [canResend, setCanResend] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  const inputRefs = useRef<TextInput[]>([]);
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();
  const { phone, name } = route.params as { phone: string; name?: string };
  
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

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOtpChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);

    // Auto-focus next input
    if (text && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpString = otp.join('');
    if (otpString.length === 6) {
      try {
        // Use name from route params (passed from LoginScreen)
        await dispatch(verifyOTP({ phone, otp: otpString, name: name }) as any);
        // Navigation will be handled by the auth state change
      } catch (error) {
        console.error('Failed to verify OTP:', error);
      }
    }
  };

  const handleResendOTP = async () => {
    // Reset timer and resend OTP
    setTimer(300);
    setCanResend(false);
    // Implement resend logic here
  };

  const isOtpComplete = otp.every(digit => digit !== '');

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
          <ScrollView contentContainerStyle={styles.scrollContainer}>
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
                <PinShareLogo size="medium" variant="vertical" />
              </View>

              <Text style={[styles.pageTitle, { color: 'white' }]}>
                Verify OTP
              </Text>
              
              <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.9)' }]}>
                Enter the 6-digit code sent to {phone}
              </Text>

              <Surface style={[styles.surface, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FFFFFF' }]} elevation={8}>
          <View style={styles.otpContainer}>
            {otp.map((digit, index) => (
              <TextInput
                key={index}
                ref={(ref) => {
                  if (ref) inputRefs.current[index] = ref;
                }}
                style={[styles.otpInput, { backgroundColor: theme.isDark ? '#1E1E1E' : '#FFFFFF' }]}
                value={digit}
                onChangeText={(text) => handleOtpChange(text, index)}
                onKeyPress={(e) => handleKeyPress(e, index)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                disabled={isLoading}
                textColor={theme.isDark ? '#FFFFFF' : '#000000'}
                theme={{
                  colors: {
                    primary: '#2196F3',
                    text: theme.isDark ? '#FFFFFF' : '#000000',
                    background: theme.isDark ? '#1E1E1E' : '#FFFFFF',
                    onSurface: theme.isDark ? '#FFFFFF' : '#000000',
                  }
                }}
              />
            ))}
          </View>

          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          <Button
            mode="contained"
            onPress={handleVerifyOTP}
            disabled={!isOtpComplete || isLoading}
            style={styles.button}
            loading={isLoading}
          >
            {isLoading ? 'Verifying...' : 'Verify OTP'}
          </Button>

          <View style={styles.timerContainer}>
            <Text style={[styles.timerText, { color: theme.isDark ? '#B0B0B0' : '#666' }]}>
              {canResend ? 'Didn\'t receive the code? ' : `Resend code in ${formatTime(timer)}`}
            </Text>
            
            {canResend && (
              <Button
                mode="text"
                onPress={handleResendOTP}
                disabled={isLoading}
                style={styles.resendButton}
              >
                Resend
              </Button>
            )}
            </View>
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
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 32,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  surface: {
    padding: 24,
    borderRadius: 20,
    elevation: 8,
    backgroundColor: 'white',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#333',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
  },
  otpInput: {
    width: 45,
    height: 55,
    fontSize: 20,
    fontWeight: 'bold',
  },
  button: {
    marginBottom: 24,
    paddingVertical: 8,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginBottom: 16,
    textAlign: 'center',
  },
  timerContainer: {
    alignItems: 'center',
  },
  timerText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  resendButton: {
    marginTop: 4,
  },
});

export default OTPVerificationScreen;






