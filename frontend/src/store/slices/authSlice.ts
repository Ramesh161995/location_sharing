import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authAPI } from '../../services/authAPI';

export interface UserSettings {
  privacy_level?: string;
  share_location?: boolean;
  notifications?: boolean;
  theme?: string;
  language?: string;
  timezone?: string;
}

export interface User {
  id: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  is_verified: boolean;
  is_active: boolean;
  settings?: UserSettings;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Async thunks
export const requestOTP = createAsyncThunk(
  'auth/requestOTP',
  async (phone: string) => {
    const response = await authAPI.requestOTP(phone);
    return response;
  }
);

export const verifyOTP = createAsyncThunk(
  'auth/verifyOTP',
  async ({ phone, otp, name }: { phone: string; otp: string; name?: string }) => {
    const response = await authAPI.verifyOTP(phone, otp, name);
    return response;
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { getState }) => {
    const state = getState() as { auth: AuthState };
    const token = state.auth.token;
    
    // Try to call logout API with token, but don't fail if it errors
    // (token might be expired, but we still want to log out locally)
    if (token) {
      try {
        await authAPI.logout(token);
      } catch (error: any) {
        // Log the error but don't throw - we'll still log out locally
        // This handles cases where token is expired/invalid
        console.log('Logout API call failed (continuing with local logout):', error.response?.status || error.message);
      }
    }
    
    // Always clear local state regardless of API call success/failure
    // Return undefined to indicate successful logout
    return undefined;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setToken: (state, action: PayloadAction<string>) => {
      state.token = action.payload;
      state.isAuthenticated = true;
    },
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Request OTP
      .addCase(requestOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestOTP.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(requestOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to request OTP';
      })
      // Verify OTP
      .addCase(verifyOTP.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOTP.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.isAuthenticated = true;
      })
      .addCase(verifyOTP.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to verify OTP';
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        // Clear state even if API call failed
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isLoading = false;
      });
  },
});

export const { clearError, setToken, setUser } = authSlice.actions;
export default authSlice.reducer;






