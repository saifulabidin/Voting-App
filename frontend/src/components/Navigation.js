import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const Navigation = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const { t, language, toggleLanguage } = useLanguage();

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
      <div className="nav-links">
        {user ? (
          <>
            <Link to="/">{t('home')}</Link>
            <Link to="/create">{t('createPoll')}</Link>
            <span>{t('welcome')}, {user.username}!</span>
            <button onClick={handleLogout}>{t('logout')}</button>
          </>
        ) : (
          <>
            <Link to="/login">{t('login')}</Link>
            <Link to="/register">{t('register')}</Link>
          </>
        )}
      </div>
      <button 
        onClick={toggleLanguage}
        className="language-button nav-lang-button"
      >
        {language === 'en' ? 'ID' : 'EN'}
      </button>
    </nav>
  );
};

export default Navigation;