import axios from 'axios';

const API = axios.create({
  baseURL: (process.env.REACT_APP_BACKEND_URL || 'https://voting-app-production-3a8c.up.railway.app') + '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add auth token and CORS headers to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Ensure CORS headers are present
  config.headers['Access-Control-Allow-Credentials'] = true;
  return config;
});

// Add response interceptor for error handling
API.interceptors.response.use(
  response => response,
  error => {
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });

    // Only redirect to login for protected routes
    const protectedRoutes = ['/create', '/polls/*/options'];
    const isProtectedRoute = protectedRoutes.some(route => {
      const pattern = new RegExp(route.replace('*', '[^/]+'));
      return pattern.test(error.config?.url);
    });

    if (error.response?.status === 401 && isProtectedRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

// Analytics endpoints
API.getAnalytics = (pollId) => API.get(`/polls/${pollId}/analytics`);
API.trackView = (pollId) => API.post(`/polls/${pollId}/view`);
API.trackShare = (pollId) => API.post(`/polls/${pollId}/share`);

export default API;