import React, { useState } from 'react';
import API from '../api';

const CreatePoll = () => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['', '']);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post('/polls', { title, options: options.map((option) => ({ option })) });
      alert('Poll created successfully');
    } catch (err) {
      console.error(err);
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
      <button type="submit">Create</button>
    </form>
  );
};

export default CreatePoll;