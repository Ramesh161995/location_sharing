import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { contactsAPI } from '../../services/contactsAPI';
import { RootState } from '../index';

export interface Contact {
  id: string;
  user_id: string;
  contact_phone: string;
  contact_name: string;
  contact_email?: string;
  contact_avatar?: string;
  is_online: boolean;
  can_share_location: boolean;
  user_account_id?: string; // If contact is a registered user
  user_account_name?: string;
  user_account_avatar?: string;
  user_account_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface ContactsState {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ContactsState = {
  contacts: [],
  isLoading: false,
  error: null,
};

// Helper to get token from state
const getToken = (state: RootState): string => {
  const token = state.auth.token;
  if (!token) {
    throw new Error('No authentication token available');
  }
  return token;
};

// Async thunks
export const fetchContacts = createAsyncThunk(
  'contacts/fetchContacts',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await contactsAPI.getContacts(token);
      return response.contacts;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const addContact = createAsyncThunk(
  'contacts/addContact',
  async (
    contactData: {
      contact_phone: string;
      contact_name: string;
      contact_email?: string;
      contact_avatar?: string;
    },
    { getState, rejectWithValue, dispatch }
  ) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      await contactsAPI.addContact(token, contactData);
      // Refresh contacts list
      await dispatch(fetchContacts() as any);
      return contactData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const removeContact = createAsyncThunk(
  'contacts/removeContact',
  async (contactId: number, { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      await contactsAPI.removeContact(token, contactId);
      // Refresh contacts list
      await dispatch(fetchContacts() as any);
      return contactId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const updateContact = createAsyncThunk(
  'contacts/updateContact',
  async (
    {
      contactId,
      contactData,
    }: {
      contactId: number;
      contactData: {
        contact_name?: string;
        contact_email?: string;
        contact_avatar?: string;
        can_share_location?: boolean;
      };
    },
    { getState, rejectWithValue, dispatch }
  ) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      await contactsAPI.updateContact(token, contactId, contactData);
      // Refresh contacts list
      await dispatch(fetchContacts() as any);
      return { contactId, contactData };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const importContacts = createAsyncThunk(
  'contacts/importContacts',
  async (phones: string[], { getState, rejectWithValue, dispatch }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await contactsAPI.importContacts(token, phones);
      // Refresh contacts list
      await dispatch(fetchContacts() as any);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const searchUserByPhone = createAsyncThunk(
  'contacts/searchUserByPhone',
  async (phone: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await contactsAPI.searchUserByPhone(token, phone);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const contactsSlice = createSlice({
  name: 'contacts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch contacts
      .addCase(fetchContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchContacts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.contacts = action.payload;
      })
      .addCase(fetchContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch contacts';
      })
      // Add contact
      .addCase(addContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addContact.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(addContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to add contact';
      })
      // Remove contact
      .addCase(removeContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removeContact.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(removeContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to remove contact';
      })
      // Update contact
      .addCase(updateContact.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateContact.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update contact';
      })
      // Import contacts
      .addCase(importContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(importContacts.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(importContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to import contacts';
      });
  },
});

export const { clearError, setContacts } = contactsSlice.actions;
export default contactsSlice.reducer;
