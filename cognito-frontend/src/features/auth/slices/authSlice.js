import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginUser, registerUser } from '../api/authApi';

// Async Thunk for Login
export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try {
    const data = await loginUser(credentials);
    localStorage.setItem('token', data.access); 
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data?.detail || 'Login failed');
  }
});

// Async Thunk for Registration
export const register = createAsyncThunk('auth/register', async (userData, { rejectWithValue }) => {
  try {
    const data = await registerUser(userData);
    return data;
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Registration failed');
  }
});

const initialState = {
  isAuthenticated: false,
  user: null, 
  token: localStorage.getItem('token') || null,
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
  extraReducers: (builder) => {
    builder
      // Login Handlers
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
      })
      // Register Handlers
      .addCase(register.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(register.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;