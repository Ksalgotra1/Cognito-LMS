import client from '../../../lib/axios';

// GET request to fetch the list (Paginated)
export const fetchCourses = async (page = 1) => {
  const response = await client.get(`api/courses/?page=${page}`);
  return response.data;
};

// Fetch Hot Right Now courses
export const fetchHotCourses = async () => {
  const response = await client.get('api/courses/hot/');
  return response.data;
};

// to fetch one specific course 
export const fetchCourseById = async (id) => {
  const response = await client.get(`api/courses/${id}/`);
  return response.data;
};

// AI RAG Endpoint (Async with Polling)
export const askAiTutor = async (courseId, question, onProgress) => {
  // 1. Start the task
  const initRes = await client.post(`api/courses/${courseId}/ask/`, { question });
  const taskId = initRes.data.task_id;

  if (onProgress) onProgress('AI is thinking...');

  // 2. Poll for results with timeout protection
  const maxAttempts = 30; // 30 * 2s = 60 seconds max
  let attempts = 0;

  return new Promise((resolve, reject) => {
    const pollInterval = setInterval(async () => {
      attempts++;

      try {
        const statusRes = await client.get(`api/courses/tasks/${taskId}/`);

        if (statusRes.data.status === 'completed') {
          clearInterval(pollInterval);
          resolve({ answer: statusRes.data.answer });
        } else if (statusRes.data.status === 'failed') {
          clearInterval(pollInterval);
          reject(new Error(statusRes.data.error || 'AI task failed'));
        } else if (attempts >= maxAttempts) {
          clearInterval(pollInterval);
          reject(new Error('AI response timed out. Please try again.'));
        } else if (onProgress) {
          onProgress(statusRes.data.message || 'Still processing...');
        }
      } catch (err) {
        clearInterval(pollInterval);
        reject(err);
      }
    }, 2000); // Poll every 2 seconds
  });
};

// Enrollment Endpoint
export const enrollCourse = async (courseId) => {
  const response = await client.post(`api/courses/${courseId}/enroll/`);
  return response.data;
};