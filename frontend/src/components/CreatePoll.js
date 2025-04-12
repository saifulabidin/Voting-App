import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api';

const CreatePoll = () => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const validateForm = () => {
    if (!title.trim()) {
      setError('Title is required');
      return false;
    }
    
    if (title.length < 3) {
      setError('Title must be at least 3 characters');
      return false;
    }

    const validOptions = options.filter(opt => opt.trim());
    if (validOptions.length < 2) {
      setError('At least 2 valid options are required');
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
      const validOptions = options
        .filter(opt => opt.trim())
        .map(option => ({ option: option.trim() }));
        
      const { data } = await API.post('/polls', {
        title: title.trim(),
        options: validOptions
      });
      
      navigate(`/polls/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create poll');
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
    <form onSubmit={handleSubmit}>
      <h1>Create Poll</h1>
      <input
        type="text"
        placeholder="Poll Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      {options.map((option, index) => (
        <input
          key={index}
          type="text"
          placeholder={`Option ${index + 1}`}
          value={option}
          onChange={(e) => handleOptionChange(index, e.target.value)}
        />
      ))}
      <button type="button" onClick={() => setOptions([...options, ''])}>
        Add Option
      </button>
      <button type="submit" disabled={loading}>Create</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
};

export default CreatePoll;