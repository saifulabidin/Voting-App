import axios from 'axios';

const API = axios.create({
  baseURL: 'https://voting-app-production-3a8c.up.railway.app',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  validateStatus: status => {
    return status < 500; // Don't reject if status is less than 500
  }
});

// Add response interceptor to handle errors
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Add request interceptor for authentication
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default API;