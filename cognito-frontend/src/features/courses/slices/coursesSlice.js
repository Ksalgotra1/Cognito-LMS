import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCourses } from '../api/coursesApi';

// Thunk: The "Side Effect" Function
// It pauses the app, calls the API, and waits for the answer.
export const getCourses = createAsyncThunk('courses/getAll', async (_, { rejectWithValue }) => {
  try {
    return await fetchCourses();
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to load courses');
  }
});

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [],      // Where we store the courses
    loading: false, // Are we waiting for the server?
    error: null,    // Did something break?
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // 1. Request Started -> Turn on Loading Spinner
      .addCase(getCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      // 2. Request Success -> Store Data, Turn off Spinner
      .addCase(getCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      // 3. Request Failed -> Save Error, Turn off Spinner
      .addCase(getCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default coursesSlice.reducer;