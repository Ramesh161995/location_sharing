import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance for user API
const createUserAPI = () => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 10000,
  });

  return {
    // Get current user profile
    getCurrentUser: async (token: string) => {
      const response = await api.get('/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Update user profile (name, etc.)
    updateProfile: async (token: string, data: { name?: string }) => {
      const response = await api.patch('/users/me', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Update user settings
    updateSettings: async (
      token: string,
      data: {
        privacy_level?: string;
        share_location?: boolean;
        notifications?: boolean;
        theme?: string;
      }
    ) => {
      const response = await api.patch('/users/me/settings', data, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  };
};

export const userAPI = createUserAPI();
export default userAPI;

