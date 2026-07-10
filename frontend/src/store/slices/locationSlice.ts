import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { locationAPI } from '../../services/locationAPI';
import { RootState } from '../index';

export interface Location {
  id: string;
  user_id: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  accuracy?: number;
  speed?: number;
  heading?: number;
  timestamp: string;
  address?: string;
  city?: string;
  country?: string;
  is_shared: boolean;
  expires_at?: string;
  created_at: string;
}

export interface SharedLocation extends Location {
  permission_level: string;
  shared_at: string;
  owner_name?: string;
  owner_phone?: string;
}

export interface LocationState {
  currentLocation: Location | null;
  locationHistory: Location[];
  sharedLocations: SharedLocation[];
  contactsSharingWith: number[]; // User IDs of contacts user is sharing location with
  isLoading: boolean;
  error: string | null;
  isTracking: boolean;
}

const initialState: LocationState = {
  currentLocation: null,
  locationHistory: [],
  sharedLocations: [],
  contactsSharingWith: [],
  isLoading: false,
  error: null,
  isTracking: false,
};

// Helper to get token from state
const getToken = (state: RootState): string => {
  const token = state.auth.token;
  if (!token) {
    throw new Error('No authentication token available');
  }
  return token;
};

// Helper to check if user is sharing location
const isSharingLocation = (state: RootState): boolean => {
  // Check if there are any active shares (we'll check this after updating location)
  return false; // Will be determined by checking shared locations
};

// Async thunks
export const updateCurrentLocation = createAsyncThunk(
  'location/updateCurrentLocation',
  async (locationData: {
    latitude: number;
    longitude: number;
    altitude?: number;
    accuracy?: number;
    speed?: number;
    heading?: number;
    address?: string;
    city?: string;
    country?: string;
  }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.updateCurrentLocation(token, locationData);
      // After updating location, if user is sharing, the shared location will automatically
      // show the latest location via get_shared_locations which returns the latest location
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchCurrentLocation = createAsyncThunk(
  'location/fetchCurrentLocation',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.getCurrentLocation(token);
      return response.location;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchLocationHistory = createAsyncThunk(
  'location/fetchLocationHistory',
  async (limit: number = 50, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.getLocationHistory(token, limit);
      return response.locations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const shareLocationWithContacts = createAsyncThunk(
  'location/shareLocationWithContacts',
  async (
    { locationId, contactUserIds, permissionLevel = 'view' }: {
      locationId: number;
      contactUserIds: number[];
      permissionLevel?: string;
    },
    { getState, rejectWithValue }
  ) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.shareLocation(token, locationId, contactUserIds, permissionLevel);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const fetchSharedLocations = createAsyncThunk(
  'location/fetchSharedLocations',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.getSharedLocations(token);
      return response.locations;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const trackLocationByPhone = createAsyncThunk(
  'location/trackLocationByPhone',
  async (phone: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.trackLocationByPhone(token, phone);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data || { message: error.message });
    }
  }
);

export const fetchContactsSharingWith = createAsyncThunk(
  'location/fetchContactsSharingWith',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.getContactsSharingWith(token);
      return response.contact_user_ids;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

export const stopSharingLocation = createAsyncThunk(
  'location/stopSharingLocation',
  async (contactUserId: number, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      const token = getToken(state);
      const response = await locationAPI.stopSharingLocation(token, contactUserId);
      return { response, contactUserId };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.detail || error.message);
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLocation: (state, action: PayloadAction<Location>) => {
      state.currentLocation = action.payload;
    },
    setTracking: (state, action: PayloadAction<boolean>) => {
      state.isTracking = action.payload;
    },
    clearLocationData: (state) => {
      state.currentLocation = null;
      state.locationHistory = [];
      state.sharedLocations = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Update current location
      .addCase(updateCurrentLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCurrentLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        // Refresh current location after update
        // The location will be updated when fetchCurrentLocation is called
      })
      .addCase(updateCurrentLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to update location';
      })
      // Fetch current location
      .addCase(fetchCurrentLocation.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentLocation = action.payload;
      })
      .addCase(fetchCurrentLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch location';
      })
      // Fetch location history
      .addCase(fetchLocationHistory.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLocationHistory.fulfilled, (state, action) => {
        state.isLoading = false;
        state.locationHistory = action.payload;
      })
      .addCase(fetchLocationHistory.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch location history';
      })
      // Share location
      .addCase(shareLocationWithContacts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(shareLocationWithContacts.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(shareLocationWithContacts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to share location';
      })
      // Fetch shared locations
      .addCase(fetchSharedLocations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSharedLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sharedLocations = action.payload;
      })
      .addCase(fetchSharedLocations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to fetch shared locations';
      })
      // Track location by phone
      .addCase(trackLocationByPhone.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(trackLocationByPhone.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(trackLocationByPhone.rejected, (state, action) => {
        state.isLoading = false;
        const payload = action.payload as any;
        state.error = payload?.message || payload || 'Failed to track location';
      })
      // Fetch contacts sharing with
      .addCase(fetchContactsSharingWith.fulfilled, (state, action) => {
        state.contactsSharingWith = action.payload;
      })
      // Stop sharing location
      .addCase(stopSharingLocation.pending, (state) => {
        state.isLoading = true;
      state.error = null;
      })
      .addCase(stopSharingLocation.fulfilled, (state, action) => {
        state.isLoading = false;
        // Remove contact from sharing list
        const contactUserId = action.payload.contactUserId;
        state.contactsSharingWith = state.contactsSharingWith.filter(id => id !== contactUserId);
      })
      .addCase(stopSharingLocation.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string || 'Failed to stop sharing location';
      });
  },
});

export const { clearError, setCurrentLocation, setTracking, clearLocationData } = locationSlice.actions;
export default locationSlice.reducer;
