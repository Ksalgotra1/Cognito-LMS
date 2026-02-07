import client from '../../../lib/axios';

// Simple GET request to fetch the list
export const fetchCourses = async () => {
  const response = await client.get('api/courses/');
  return response.data;
};

// to fetch one specific course 
export const fetchCourseById = async (id) => {
  const response = await client.get(`api/courses/${id}/`);
  return response.data;
};

// AI RAG Endpoint
export const askAiTutor = async (courseId, question) => {
  // Matches the backend view: AskAIView
  const response = await client.post(`api/courses/${courseId}/ask/`, { question });
  return response.data;
};

// Enrollment Endpoint
export const enrollCourse = async (courseId) => {
  const response = await client.post(`api/courses/${courseId}/enroll/`);
  return response.data;
};