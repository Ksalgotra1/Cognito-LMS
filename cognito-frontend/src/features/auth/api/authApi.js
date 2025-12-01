import client from '../../../lib/axios';

export const loginUser = async (credentials) => {
  // credentials = { username: 'admin', password: 'password123' }
  // We post to the endpoint you tested on Tuesday
  const response = await client.post('api/token/', credentials);
  return response.data; // Returns { access: "...", refresh: "..." }
};

export const registerUser = async (userData) => {
  // userData = { username, password, email, role }
  const response = await client.post('api/register/', userData);
  return response.data;
};