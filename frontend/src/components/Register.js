import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const Register = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();

  useEffect(() => {
    // Load reCAPTCHA script
    const script = document.createElement('script');
    script.src = 'https://www.google.com/recaptcha/api.js';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const validatePassword = (password) => {
    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return strongPassword.test(password);
  };

  const handleRegister = async (e) => {
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
      const recaptchaValue = window.grecaptcha?.getResponse();
      if (!recaptchaValue) {
        setError(t('recaptchaRequired'));
        return;
      }

      await API.post('/auth/register', { 
        username, 
        password,
        recaptchaToken: recaptchaValue
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || t('serverError'));
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
    }
  };

  const handleGoogleRegister = () => {
    window.location.href = `${process.env.REACT_APP_BACKEND_URL}/auth/google`;
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleRegister} className="auth-form">
        <h2>{t('registerTitle')}</h2>
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-group">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder={t('enterEmail')}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder={t('choosePassword')}
          />
        </div>

        <div className="form-group">
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder={t('confirmPassword')}
          />
        </div>

        <button type="submit" className="auth-button">{t('registerButton')}</button>

        <div className="or-divider">{t('orRegisterWith')}</div>

        <button type="button" className="google-button" onClick={handleGoogleRegister}>
          <img src={`${process.env.PUBLIC_URL}/google-icon.svg`} alt="Google" />
          {t('continueWithGoogle')}
        </button>

        <div className="recaptcha-container">
          <div 
            className="g-recaptcha" 
            data-sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY}
          ></div>
        </div>

        <div className="signup-link">
          {t('alreadyHaveAccount')} <Link to="/login">{t('loginNow')}</Link>
        </div>
      </form>
    </div>
  );
};

export default Register;