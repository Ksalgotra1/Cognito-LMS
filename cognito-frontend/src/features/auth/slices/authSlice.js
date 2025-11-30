import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser } from '../api/authApi';

// 1. The Async Action (The "Thunk")
// This is the missing export!
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await loginUser(credentials);
    // Save to localStorage so they stay logged in on refresh
    localStorage.setItem('token', data.access); 
    return data;
  } catch (error) {
    // If login fails, return the error message from Django
    return rejectWithValue(error.response?.data?.detail || 'Login failed');
  }
});

const initialState = {
  isAuthenticated: false,
  user: null, 
  token: localStorage.getItem('token') || null, // Load from storage on startup
  loading: false,
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      localStorage.removeItem('token');
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    },
  },
  // This handles the Thunk (Loading -> Success -> Failure)
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access;
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;