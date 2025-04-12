import axios from 'axios';

const API = axios.create({
  baseURL: 'https://voting-app-production-3a8c.up.railway.app',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor with enhanced error handling
API.interceptors.response.use(
  response => response,
  error => {
    const errorResponse = {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      code: error.response?.data?.code,
      message: error.response?.data?.message || error.message,
      details: error.response?.data?.details,
      timestamp: new Date().toISOString()
    };

    console.error('API Error:', errorResponse);

    // Handle specific error types
    switch (error.response?.data?.code) {
      case 'AUTH_ERROR':
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        break;
      
      case 'RATE_LIMIT_EXCEEDED':
        console.warn('Rate limit exceeded, retrying after cooldown');
        // Could implement retry logic here
        break;

      case 'CORS_ERROR':
        console.error('CORS Error - please check API configuration');
        break;

      default:
        // Handle general errors
        if (error.response?.status === 401) {
          const publicRoutes = ['/polls', '/health'];
          const isPublicRoute = publicRoutes.some(route => 
            error.config?.url?.startsWith(route)
          );
          
          if (!isPublicRoute) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
          }
        }
    }

    return Promise.reject(errorResponse);
  }
);

// API endpoints
API.getAnalytics = (pollId) => API.get(`/polls/${pollId}/analytics`);
API.trackView = (pollId) => API.post(`/polls/${pollId}/view`);
API.trackShare = (pollId) => API.post(`/polls/${pollId}/share`);

export default API;