import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';

const Navigation = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));

  const handleLogout = async () => {
    try {
      await API.get('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/login');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="navigation">
      {user ? (
        <>
          <Link to="/">Home</Link>
          <Link to="/create">Create Poll</Link>
          <span>Welcome, {user.username}!</span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </>
      )}
    </nav>
  );
};

export default Navigation;