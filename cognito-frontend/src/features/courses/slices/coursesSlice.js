import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
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

// Thunk 3: Toggle Lesson Completion
export const toggleLessonCompletion = createAsyncThunk(
  'courses/toggleCompletion',
  async (lessonId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      const config = {
        headers: {
          Authorization: `Bearer ${auth.token}`, // Secure JWT Header
        },
      };

      const response = await axios.post(
        `http://localhost:8000/api/courses/lessons/${lessonId}/complete/`,
        {}, 
        config
      );
      return response.data;
    } catch (error) {
      // Standard error handling
      return rejectWithValue(error.response?.data || { detail: "Action failed" });
    }
  }
);

const coursesSlice = createSlice({
  name: 'courses',
  initialState: {
    list: [],           
    currentCourse: null, 
    loading: false,      
    error: null,         
  },
  reducers: {
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
        state.currentCourse = null;
      })
      .addCase(getCourse.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCourse = action.payload;
      })
      .addCase(getCourse.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Handle toggleLessonCompletion ---
      .addCase(toggleLessonCompletion.fulfilled, (state, action) => {
        if (state.currentCourse) {
          // Optimistic UI Update
          state.currentCourse.modules.forEach((module) => {
            const lesson = module.lessons.find((l) => l.id === action.payload.lesson_id);
            if (lesson) {
              lesson.is_completed = action.payload.is_completed;
            }
          });
        }
      });
  },
});

export const { clearCurrentCourse } = coursesSlice.actions;
export default coursesSlice.reducer;