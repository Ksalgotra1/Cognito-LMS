import { createSlice } from '@reduxjs/toolkit';

// 1. Initial State: What the memory looks like when the app starts
const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null, // JWT Token for API requests
};

// 2. The Slice: Grouping the logic
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    // Action: When login succeeds, save the user data
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.token;
    },
    // Action: When logout happens, wipe the data
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
    },
  },
});

// 3. Export Actions (buttons) and Reducer (logic)
export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;