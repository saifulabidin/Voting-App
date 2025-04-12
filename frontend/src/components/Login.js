import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';
import './Auth.css';

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    remember: false
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const { data } = await API.post('/auth/login', credentials);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || t('loginError'));
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/google`;
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{t('login')}</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              value={credentials.username}
              onChange={handleChange}
              placeholder={t('username')}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder={t('password')}
              required
            />
          </div>
          <label className="remember-me">
            <input
              type="checkbox"
              name="remember"
              checked={credentials.remember}
              onChange={handleChange}
            />
            {t('rememberMe')}
          </label>
          <button type="submit" className="auth-button">
            {t('login')}
          </button>
        </form>

        <div className="or-divider">{t('or')}</div>

        <button onClick={handleGoogleLogin} className="google-button">
          <img src="/google-icon.svg" alt="Google" />
          {t('continueWithGoogle')}
        </button>

        <div className="signup-link">
          {t('noAccount')} <Link to="/register">{t('signupHere')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;