import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';
import { formatUsername } from '../utils/pollUtils';
import '../styles/navigation.css';

const Navigation = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const { t, language, toggleLanguage } = useLanguage();

  const handleLogout = async () => {
    try {
      await API.get('/auth/logout');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      navigate('/');
    } catch (err) {
      console.error('Logout failed:', err);
    }
  };

  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <Link to="/" className="brand-link">
            <span className="brand-text">SabidzPoll</span>
          </Link>
        </div>

        <div className="nav-links">
          <Link to="/create" className="nav-link">{t('createPoll')}</Link>
        </div>

        <div className="nav-auth">
          {user ? (
            <>
              <span className="welcome-text">{t('welcome')}, {formatUsername(user.username)}!</span>
              <button onClick={handleLogout} className="auth-button logout-button">
                {t('logout')}
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-button login-button">{t('login')}</Link>
              <Link to="/register" className="auth-button signup-button">{t('register')}</Link>
            </>
          )}
          <button 
            onClick={toggleLanguage}
            className="language-button"
          >
            {language === 'en' ? 'ID' : 'EN'}
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;