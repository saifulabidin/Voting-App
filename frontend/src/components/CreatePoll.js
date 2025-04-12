import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';
import '../styles/create-poll.css';

const PlusIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
  </svg>
);

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

  const handleDeleteOption = (index) => {
    if (options.length <= 2) return;
    const newOptions = options.filter((_, i) => i !== index);
    setOptions(newOptions);
  };

  return (
    <div className="create-poll-container">
      <form onSubmit={handleSubmit} className="create-poll-form">
        <h1 className="form-title">{t('createPollTitle')}</h1>
        <p className="form-subtitle">Complete the below fields to create your poll.</p>
        
        <input
          type="text"
          placeholder={t('pollTitle')}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="form-input"
        />
        
        {options.map((option, index) => (
          <div key={index} className="option-item">
            <input
              type="text"
              placeholder={`${t('option')} ${index + 1}`}
              value={option}
              onChange={(e) => handleOptionChange(index, e.target.value)}
              className="form-input"
            />
            {options.length > 2 && (
              <button 
                type="button"
                onClick={() => handleDeleteOption(index)}
                className="remove-option-button"
                title="Delete option"
              >
                <TrashIcon />
              </button>
            )}
          </div>
        ))}
        
        <button 
          type="button" 
          onClick={() => setOptions([...options, ''])} 
          className="add-option-button"
        >
          <PlusIcon />
          {t('addMoreOption')}
        </button>
        
        <button type="submit" disabled={loading} className="submit-button">
          {loading ? '...' : t('create')}
        </button>
        
        {error && <p className="error-message">{error}</p>}
      </form>
    </div>
  );
};

export default CreatePoll;