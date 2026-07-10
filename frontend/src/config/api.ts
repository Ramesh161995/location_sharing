import { Platform } from 'react-native';

/**
 * API Configuration
 * 
 * For development:
 * - iOS Simulator: Use 'localhost'
 * - Android Emulator: Use '10.0.2.2' (special IP for host machine)
 * - Physical Device: Use your computer's IP address (e.g., '192.168.1.100')
 * 
 * To find your computer's IP address:
 * - Windows: Run `ipconfig` in PowerShell and look for "IPv4 Address"
 * - Mac/Linux: Run `ifconfig` or `ip addr`
 */

// IMPORTANT: Change this to your computer's IP address
// Find your IP: Windows (ipconfig) or Mac/Linux (ifconfig)
// Examples: '192.168.1.100', '10.0.0.2', '192.168.0.105'
const DEVICE_IP = '192.168.1.9'; // ⚠️ UPDATE THIS with your computer's IP address

// Set to true if testing on a physical device (not emulator/simulator)
// Make sure to update DEVICE_IP above with your computer's IP address
const USE_DEVICE_IP = true; // Changed to true since you're using physical device

// Determine the API base URL based on the platform
const getApiBaseUrl = (): string => {
  if (__DEV__) {
    // Development mode
    // For emulators/simulators, use special IPs
    // For physical devices, use your computer's IP (DEVICE_IP above)
    
    // If USE_DEVICE_IP is true, always use device IP (for physical devices)
    // Otherwise, use platform-specific URLs for emulators
    if (USE_DEVICE_IP) {
      return `http://${DEVICE_IP}:8000/api/v1`;
    }
    
    if (Platform.OS === 'android') {
      // Android emulator: use 10.0.2.2 to access host machine
      // For physical Android device: set USE_DEVICE_IP = true above
      return `http://10.0.2.2:8000/api/v1`;
    } else if (Platform.OS === 'ios') {
      // iOS simulator: use localhost
      // For physical iOS device: set USE_DEVICE_IP = true above
      return `http://localhost:8000/api/v1`;
    } else {
      // Web or other platforms: use DEVICE_IP
      return `http://${DEVICE_IP}:8000/api/v1`;
    }
  }
  
  // Production mode - update this with your production API URL
  return 'https://api.yourdomain.com/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();

// For easy testing, export a function to get the base URL without the API path
export const getBackendBaseUrl = (): string => {
  return API_BASE_URL.replace('/api/v1', '');
};

