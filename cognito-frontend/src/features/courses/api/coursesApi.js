import client from '../../../lib/axios';

// Simple GET request to fetch the list
export const fetchCourses = async () => {
  const response = await client.get('api/courses/');
  return response.data;
};