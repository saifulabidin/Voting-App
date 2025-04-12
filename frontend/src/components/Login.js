import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      const { data } = await API.post('/auth/login', { username, password });
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setError(t('loginFailed'));
      }
    } catch (err) {
      setError(err.response?.data?.message || t('serverError'));
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{t('loginTitle')}</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">{t('username')}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder={t('enterUsername')}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">{t('password')}</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('enterPassword')}
          />
        </div>
        <button type="submit" className="auth-button">{t('loginButton')}</button>
      </form>
    </div>
  );
};

export default Login;