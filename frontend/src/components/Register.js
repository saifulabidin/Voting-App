import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ReCAPTCHA from "react-google-recaptcha";
import API from '../api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/auth.css';

const Register = () => {
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (credentials.password !== credentials.confirmPassword) {
      setError(t('passwordMismatch'));
      return;
    }

    try {
      const recaptchaToken = recaptchaRef.current.getValue();
      if (!recaptchaToken) {
        setError(t('recaptchaRequired'));
        return;
      }

      await API.post('/auth/register', {
        username: credentials.username,
        password: credentials.password,
        recaptchaToken
      });
      navigate('/login', { state: { message: t('registrationSuccess') } });
    } catch (err) {
      setError(err.response?.data?.message || t('registrationError'));
      recaptchaRef.current.reset();
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/google`;
  };

  return (
    <div className="auth-container">
      <div className="auth-form">
        <h2>{t('register')}</h2>
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
              minLength={3}
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
              minLength={6}
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              value={credentials.confirmPassword}
              onChange={handleChange}
              placeholder={t('confirmPassword')}
              required
            />
          </div>
          <div className="recaptcha-container">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
              theme="dark"
            />
          </div>
          <button type="submit" className="auth-button">
            {t('register')}
          </button>
        </form>

        <div className="or-divider">{t('or')}</div>

        <button onClick={handleGoogleLogin} className="google-button">
          <img src="/google-icon.svg" alt="Google" />
          {t('continueWithGoogle')}
        </button>

        <div className="signup-link">
          {t('haveAccount')} <Link to="/login">{t('loginHere')}</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;