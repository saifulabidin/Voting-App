import React, { useState } from 'react';
import axios from 'axios';

const CreatePoll = () => {
  const [title, setTitle] = useState('');
  const [options, setOptions] = useState(['']);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const pollData = { title, options: options.map(option => ({ option, votes: 0 })) };
      const { data } = await axios.post('/api/polls', pollData, { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });
      console.log('Poll Created', data);
    } catch (err) {
      setError('Error creating poll');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Poll Title" required />
      {options.map((option, idx) => (
        <input key={idx} value={option} onChange={(e) => setOptions([...options.slice(0, idx), e.target.value, ...options.slice(idx + 1)])} placeholder="Option" />
      ))}
      <button type="submit">Create Poll</button>
      {error && <p>{error}</p>}
    </form>
  );
};

export default CreatePoll;
