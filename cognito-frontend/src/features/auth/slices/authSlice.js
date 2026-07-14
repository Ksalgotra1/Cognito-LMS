import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import client from '../../../lib/axios'; // using your verified axios location

// 1. HELPER: Read user from storage on startup
const getUserFromStorage = () => {
  try {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  } catch (_e) {
    return null;
  }
};

// 2. THUNK: Register (Restored so SignupPage works)
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    // We call the API directly here to keep it simple
    const response = await client.post('api/register/', userData);
    return response.data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Registration failed');
  }
});

// 3. THUNK: Login (Updated with "Memory" Logic)
export const login = createAsyncThunk('auth/login', async ({ username, password }, { rejectWithValue }) => {
  try {
    const response = await client.post('api/token/', { username, password });
    
    // The server returns tokens. We manually attach the username to store it.
    const data = { ...response.data, user: { username } }; 
    
    // SAVE TO HARD DRIVE (Persistence)
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user)); 
    
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Login failed');
  }
});

// 4. THUNK: Logout (Clears everything)
export const logout = createAsyncThunk('auth/logout', async () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user'); 
});

const initialState = {
  // Check storage immediately when app starts
  user: getUserFromStorage(), 
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'), // True if token exists
  loading: false,
  error: null,
  registrationSuccess: false,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Optional: Helper to clear registration success message
    resetRegistration: (state) => {
      state.registrationSuccess = false;
      state.error = null;
    },
    //  Manual update for Profile Settings (Instant UI Refresh)
    updateUser: (state, action) => {
      // Merge new data (first_name, last_name) into existing user object
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        // Sync to localStorage so it persists on refresh
        localStorage.setItem('user', JSON.stringify(state.user));
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // REGISTER HANDLERS
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
        state.registrationSuccess = true;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // LOGIN HANDLERS
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.access;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // LOGOUT HANDLERS
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
      });
  },
});

export const { resetRegistration, updateUser } = authSlice.actions;
export default authSlice.reducer;