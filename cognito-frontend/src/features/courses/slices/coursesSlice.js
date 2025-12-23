import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { fetchCourses, fetchCourseById } from '../api/coursesApi';

// Thunk 1: Get All Courses
export const getCourses = createAsyncThunk('courses/getAll', async (_, { rejectWithValue }) => {
  try {
    return await fetchCourses();
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to load courses');
  }
});

// Thunk 2: Get Single Course
export const getCourse = createAsyncThunk('courses/getOne', async (id, { rejectWithValue }) => {
  try {
    return await fetchCourseById(id);
  } catch (error) {
    return rejectWithValue(error.response?.data || 'Failed to load course');
  }
});

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [],           // Where we store all courses
    currentCourse: null, // Stores the single course we are viewing
    loading: false,      // Are we waiting for the server?
    error: null,         // Did something break?
  },
  reducers: {
    // Optional: Call this when leaving the course detail page to clear data
    clearCurrentCourse: (state) => {
      state.currentCourse = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Handle getCourses (All) ---
      .addCase(getCourses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCourses.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload;
      })
      .addCase(getCourses.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Handle getCourse (Single) ---
      .addCase(getCourse.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.currentCourse = null; // Clear old data while fetching new
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearCurrentCourse } = coursesSlice.actions;
export default coursesSlice.reducer;