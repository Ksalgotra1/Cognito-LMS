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