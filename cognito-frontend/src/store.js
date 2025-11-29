import { configureStore } from '@reduxjs/toolkit';
import authReducer from './features/auth/slices/authSlice';

// The Central Brain
export const store = configureStore({
  reducer: {
    // We add the 'auth' sector to the brain
    auth: authReducer,
    // Future: courses: courseReducer
  },
});