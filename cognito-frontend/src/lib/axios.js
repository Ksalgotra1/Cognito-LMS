import axios from 'axios';
import { toastEvents } from './toastEvents';

const client = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// 1. Request Interceptor: Attaches the token
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// 2. Response Interceptor: Attempts token refresh on 401, then redirects if that fails
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Ignore 401 errors from the login or refresh endpoints itself so the UI can display "Wrong password"
        if (error.response?.status === 401 && originalRequest.url?.includes('api/token/')) {
            return Promise.reject(error);
        }

        // Only attempt refresh on 401 and if we haven't already retried
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (!refreshToken) throw new Error('No refresh token');

                // Request new access token using refresh token
                const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/token/refresh/`, {
                    refresh: refreshToken
                });

                const { access } = response.data;
                localStorage.setItem('access_token', access);
                originalRequest.headers.Authorization = `Bearer ${access}`;

                // Retry the original request with new token
                return client(originalRequest);
            } catch (_refreshError) {
                console.warn("🔒 Token refresh failed. Redirecting to login...");
                toastEvents.emit('Session expired. Please log in again.', 'error');

                // Clear all auth data
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                localStorage.removeItem('user');

                // Force redirect to login
                window.location.href = '/login';
            }
        }

        // Show toast for other API errors (except 401 which is handled above)
        if (error.response?.status !== 401) {
            const message = error.response?.data?.detail
                || error.response?.data?.error
                || error.response?.data?.message
                || `Request failed (${error.response?.status || 'Network Error'})`;
            toastEvents.emit(message, 'error');
        }

        return Promise.reject(error);
    }
);

export default client;