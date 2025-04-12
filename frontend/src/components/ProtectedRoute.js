import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  const location = useLocation();
  
  // Allow access to poll viewing and voting without authentication
  const publicPaths = ['/polls'];
  const isPublicPollView = location.pathname.match(/^\/polls\/[^/]+$/);
  
  if (!token && !publicPaths.includes(location.pathname) && !isPublicPollView) {
    // Save the attempted URL for redirect after login
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/login" />;
  }
  
  return children;
};

export default ProtectedRoute;