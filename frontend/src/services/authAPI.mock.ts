/**
 * Mock Auth API Service
 * This provides static/mock implementations for development
 * without requiring a backend connection
 */

// Simulate a delay for realistic UX
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Store OTP for verification (in real app, this would be on the server)
let storedOTP: string | null = null;
let storedPhone: string | null = null;

export const mockAuthAPI = {
  // Check if phone exists and get user name
  checkPhone: async (phone: string) => {
    await delay(500);
    // Mock: return that phone doesn't exist (or customize based on test data)
    return {
      exists: false,
      name: null,
    };
  },

  // Request OTP - returns success after a delay
  requestOTP: async (phone: string) => {
    await delay(1500); // Simulate network delay
    
    // Generate a 6-digit OTP (for demo purposes, always use 123456)
    // In production, this would be generated on the backend
    storedOTP = '123456';
    storedPhone = phone;
    
    console.log(`[MOCK] OTP sent to ${phone}: ${storedOTP}`);
    
    return {
      success: true,
      message: 'OTP sent successfully',
      phone: phone,
    };
  },

  // Verify OTP - accepts any 6-digit code for demo, but checks stored OTP
  verifyOTP: async (phone: string, otp: string) => {
    await delay(1000); // Simulate network delay
    
    // For demo: accept 123456 or any 6-digit code starting with 1
    // In production, this would verify against the server
    if (otp === storedOTP || (otp.length === 6 && otp.startsWith('1'))) {
      // Generate mock tokens
      const accessToken = `mock_access_token_${Date.now()}`;
      const refreshToken = `mock_refresh_token_${Date.now()}`;
      
      console.log(`[MOCK] OTP verified successfully for ${phone}`);
      
      return {
        success: true,
        access_token: accessToken,
        refresh_token: refreshToken,
        user: {
          id: '1',
          phone: phone,
          name: phone, // Default name to phone
          is_verified: true,
          is_active: true,
        },
      };
    } else {
      throw new Error('Invalid OTP. Please try again.');
    }
  },

  // Logout - just clears local data (no token needed for mock)
  logout: async (token?: string) => {
    await delay(500);
    storedOTP = null;
    storedPhone = null;
    console.log('[MOCK] User logged out');
    return { success: true };
  },
};

