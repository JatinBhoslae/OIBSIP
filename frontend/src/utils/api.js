import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
});

// Automatically inject JWT token if it exists in localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pizzahub_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
