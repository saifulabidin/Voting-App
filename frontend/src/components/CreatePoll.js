import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const CreatePoll = () => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { t } = useLanguage();

  const validateForm = () => {
    if (!title.trim()) {
      setError(t('titleRequired'));
      return false;
    }
    
    if (title.length < 3) {
      setError(t('titleMinLength'));
      return false;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError(t('optionsRequired'));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!validateForm()) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const validOptions = options
        .filter(opt => opt.trim())
        .map(option => ({ option: option.trim() }));
        
      const { data } = await API.post('/polls', {
        title: title.trim(),
        options: validOptions
      });
      
      navigate(`/polls/${data._id}`);
    } catch (err) {
      if (err.response?.status === 401) {
        setError(t('loginToCreate'));
        navigate('/login');
      } else {
        setError(t('createError'));
      }
      console.error('Poll creation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...options];
    newOptions[index] = value;
    setOptions(newOptions);
  };

  return (
    <form onSubmit={handleSubmit} className="create-poll-form">
      <h1>{t('createPollTitle')}</h1>
      <input
        type="text"
        placeholder={t('pollTitle')}
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {options.map((option, index) => (
        <input
          key={index}
          type="text"
          placeholder={`${t('option')} ${index + 1}`}
          value={option}
          onChange={(e) => handleOptionChange(index, e.target.value)}
        />
      ))}
      <button type="button" onClick={() => setOptions([...options, ''])}>
        {t('addMoreOption')}
      </button>
      <button type="submit" disabled={loading}>
        {t('create')}
      </button>
      {error && <p className="error-message">{error}</p>}
    </form>
  );
};

export default CreatePoll;