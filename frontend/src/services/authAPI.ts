import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { mockAuthAPI } from './authAPI.mock';

// Set to true to use mock API (for development without backend)
// Set to false to use real backend API
const USE_MOCK_API = false;

// Real API implementation
const createRealAPI = () => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000, // 10 second timeout
  });

  // Note: Auth token is passed explicitly per request, not via interceptor
  // because we need access to Redux state for the token

  // Request interceptor for logging
  api.interceptors.request.use(
    (config:any) => {
      console.log('🌐 API Request:', config.method?.toUpperCase(), config.url);
      console.log('📍 Full URL:', config.baseURL + config.url);
      console.log('📦 Request Data:', config.data);
      return config;
    },
    (error:any) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response:any) => {
      console.log('✅ API Response:', response.status, response.data);
      return response;
    },
    async (error:any) => {
      console.error('❌ API Error:', error.message);
      console.error('📄 Error Details:', error.response?.data || error.message);
      console.error('🔢 Error Status:', error.response?.status);
      if (error.response?.status === 401) {
        // Handle token refresh or logout
        // In React Native, clear from SecureStore/AsyncStorage
      }
      return Promise.reject(error);
    }
  );

  return {
    // Check if phone exists and get user name
    checkPhone: async (phone: string) => {
      const response = await api.get(`/auth/check-phone/${encodeURIComponent(phone)}`);
      return response.data;
    },

    // Request OTP
    requestOTP: async (phone: string) => {
      const response = await api.post('/auth/request-otp', { phone });
      return response.data;
    },

    // Verify OTP
    verifyOTP: async (phone: string, otp: string, name?: string) => {
      const response = await api.post('/auth/verify-otp', { phone, otp, name: name || undefined });
      return response.data;
    },

    // Refresh token
    refreshToken: async (refreshToken: string) => {
      const response = await api.post('/auth/refresh', { refresh_token: refreshToken });
      return response.data;
    },

    // Logout (requires token for backend)
    logout: async (token: string) => {
      const headers: any = {
        Authorization: `Bearer ${token}`,
      };
      const response = await api.post('/auth/logout', {}, { headers });
      return response.data;
    },

    // Get current user
    getCurrentUser: async (token: string) => {
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  };
};

// Export the API (mock or real based on flag)
export const authAPI = USE_MOCK_API ? mockAuthAPI : createRealAPI();

export default authAPI;






