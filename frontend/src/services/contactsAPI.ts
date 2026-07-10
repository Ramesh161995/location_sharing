import axios from 'axios';
import { API_BASE_URL } from '../config/api';

// Create axios instance for contacts API
const createContactsAPI = () => {
  const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 15000,
  });

  // Request interceptor for logging
  api.interceptors.request.use(
    (config: any) => {
      console.log('👥 Contacts API Request:', config.method?.toUpperCase(), config.url);
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  api.interceptors.response.use(
    (response: any) => {
      console.log('✅ Contacts API Response:', response.status, response.data);
      return response;
    },
    async (error: any) => {
      console.error('❌ Contacts API Error:', error.message);
      console.error('📄 Error Details:', error.response?.data || error.message);
      if (error.response?.status === 401) {
        // Handle token refresh or logout
      }
      return Promise.reject(error);
    }
  );

  return {
    // Get contacts
    getContacts: async (token: string) => {
      const response = await api.get('/contacts/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Add contact
    addContact: async (
      token: string,
      contactData: {
        contact_phone: string;
        contact_name: string;
        contact_email?: string;
        contact_avatar?: string;
      }
    ) => {
      const response = await api.post(
        '/contacts/',
        contactData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },

    // Remove contact
    removeContact: async (token: string, contactId: number) => {
      const response = await api.delete(`/contacts/${contactId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },

    // Update contact
    updateContact: async (
      token: string,
      contactId: number,
      contactData: {
        contact_name?: string;
        contact_email?: string;
        contact_avatar?: string;
        can_share_location?: boolean;
      }
    ) => {
      const response = await api.patch(
        `/contacts/${contactId}`,
        contactData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },

    // Import contacts by phone numbers
    importContacts: async (token: string, phones: string[]) => {
      const response = await api.post(
        '/contacts/import',
        { phones },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data;
    },

    // Search user by phone
    searchUserByPhone: async (token: string, phone: string) => {
      const response = await api.get(`/contacts/search/${phone}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return response.data;
    },
  };
};

export const contactsAPI = createContactsAPI();
export default contactsAPI;

