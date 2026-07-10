import axios from 'axios';
import { API_BASE_URL } from '../config/api';
import { RootState } from '../store';

// Create axios instance for location API
const createLocationAPI = () => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000, // 15 second timeout for location requests
  });

  // Request interceptor to add auth token
  api.interceptors.request.use(
    (config: any) => {
      // Get token from Redux store or AsyncStorage
      // For now, we'll pass token through method parameters
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response: any) => {
      console.log('📍 Location API Response:', response.status, response.data);
      return response;
    },
    async (error: any) => {
      console.error('❌ Location API Error:', error.message);
      console.error('📄 Error Details:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        // Handle token refresh or logout
      }
      return Promise.reject(error);
    }
  );

  return {
    // Update current location
    updateCurrentLocation: async (token: string, locationData: {
      latitude: number;
      longitude: number;
      altitude?: number;
      accuracy?: number;
      speed?: number;
      heading?: number;
      address?: string;
      city?: string;
      country?: string;
    }) => {
      const response = await api.post(
        '/location/current',
        locationData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },

    // Get current location
    getCurrentLocation: async (token: string) => {
      const response = await api.get('/location/current', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Get location history
    getLocationHistory: async (token: string, limit: number = 50) => {
      const response = await api.get(`/location/history?limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Share location with contacts
    shareLocation: async (
      token: string,
      locationId: number,
      contactUserIds: number[],
      permissionLevel: string = 'view'
    ) => {
      const response = await api.post(
        '/location/share',
        {
          location_id: locationId,
          contact_user_ids: contactUserIds,
          permission_level: permissionLevel,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },

    // Get shared locations
    getSharedLocations: async (token: string) => {
      const response = await api.get('/location/shared', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Track location by phone number
    trackLocationByPhone: async (token: string, phone: string) => {
      const response = await api.post(
        '/location/track-by-phone',
        { phone },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },

    // Get user location by user ID
    getUserLocation: async (token: string, userId: number) => {
      const response = await api.get(`/location/user/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Get contacts user is sharing location with
    getContactsSharingWith: async (token: string) => {
      const response = await api.get('/location/sharing-with', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Stop sharing location with a contact
    stopSharingLocation: async (token: string, contactUserId: number) => {
      const response = await api.delete(`/location/share/${contactUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  };
};

export const locationAPI = createLocationAPI();
export default locationAPI;

