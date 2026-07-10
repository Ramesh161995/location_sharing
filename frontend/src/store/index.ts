import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import locationReducer from './slices/locationSlice';
import contactsReducer from './slices/contactsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    location: locationReducer,
    contacts: contactsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;






