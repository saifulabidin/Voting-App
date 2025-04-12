import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  const validatePassword = (password) => {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPassword.test(password);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError(t('passwordsMustMatch'));
      return;
    }

    if (!validatePassword(password)) {
      setError(t('passwordRequirements'));
      return;
    }

    try {
      await API.post('/auth/register', { username, password });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || t('serverError'));
    }
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>{t('registerTitle')}</h2>
        {error && <div className="error-message">{error}</div>}
        <div className="form-group">
          <label htmlFor="username">{t('username')}</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            minLength="3"
            placeholder={t('chooseUsername')}
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
            minLength="6"
            placeholder={t('choosePassword')}
          />
        </div>
        <div className="password-requirements">
          {t('passwordRequirements')}
          <ul>
            <li>{t('passwordMinChars')}</li>
            <li>{t('passwordUppercase')}</li>
            <li>{t('passwordLowercase')}</li>
            <li>{t('passwordNumber')}</li>
            <li>{t('passwordSpecial')}</li>
          </ul>
        </div>
        <div className="form-group">
          <label htmlFor="confirmPassword">{t('confirmPassword')}</label>
          <input
            type="password"
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('confirmYourPassword')}
          />
        </div>
        <button type="submit" className="auth-button">{t('registerButton')}</button>
      </form>
    </div>
  );
};

export default Register;