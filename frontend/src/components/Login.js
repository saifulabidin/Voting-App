import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { t } = useLanguage();
  const recaptchaRef = useRef(null);

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

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Get reCAPTCHA response
      const recaptchaValue = window.grecaptcha?.getResponse();
      if (!recaptchaValue) {
        setError(t('recaptchaRequired'));
        return;
      }
      
      const { data } = await API.post('/auth/login', { 
        username, 
        password,
        recaptchaToken: recaptchaValue
      });
      
      if (data.token) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true');
        }
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || t('serverError'));
      if (window.grecaptcha) {
        window.grecaptcha.reset();
      }
    }
  };

  const handleGoogleLogin = () => {
    // Google login implementation will go here
  };

  return (
    <div className="auth-container">
      <form onSubmit={handleLogin} className="auth-form">
        <h2>{t('loginTitle')}</h2>
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
            placeholder={t('enterPassword')}
          />
        </div>

        <div className="remember-me">
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          />
          <label htmlFor="rememberMe">{t('rememberMe')}</label>
        </div>

        <button type="submit" className="auth-button">{t('loginButton')}</button>

        <div className="or-divider">{t('orLoginWith')}</div>

        <button type="button" className="google-button" onClick={handleGoogleLogin}>
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
          {t('notAMember')} <Link to="/register">{t('signUpNow')}</Link>
        </div>
      </form>
    </div>
  );
};

export default Login;