import axios from 'axios';

const client = axios.create({
    baseURL: 'http://127.0.0.1:8000/', 
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

// ✅ CORRECT INTERCEPTOR
client.interceptors.request.use(
    (config) => {
        // Your console.log showed the key is exactly 'access_token'
        const token = localStorage.getItem('access_token'); 
        
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        } else {
            console.warn("⚠️ No access_token found in localStorage");
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default client;