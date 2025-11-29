import axios from 'axios';

const client = axios.create({
    baseURL: 'http://127.0.0.1:8000/', // Correct: No 'api/' at the end
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

export default client;