import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState('');

  const fetchPolls = async () => {
    try {
      const { data } = await API.get('/polls');
      setPolls(data);
    } catch (err) {
      console.error(err);
      setError('Gagal memuat daftar polling');
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleDelete = async (pollId, event) => {
    event.preventDefault(); // Prevent navigation
    
    if (!window.confirm('Apakah Anda yakin ingin menghapus polling ini?')) {
      return;
    }

    try {
      await API.delete(`/polls/${pollId}`);
      setPolls(polls.filter(poll => poll._id !== pollId));
    } catch (err) {
      console.error('Delete error:', err);
      setError('Gagal menghapus polling');
    }
  };

  return (
    <div>
      <h1>Daftar Polling</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {polls.map((poll) => (
          <li key={poll._id} style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px',
            margin: '5px 0',
            border: '1px solid #ddd',
            borderRadius: '4px'
          }}>
            <Link to={`/polls/${poll._id}`}>{poll.title}</Link>
            {poll.createdBy?._id === localStorage.getItem('userId') && (
              <button
                onClick={(e) => handleDelete(poll._id, e)}
                style={{
                  backgroundColor: '#ff4444',
                  color: 'white',
                  padding: '5px 10px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Hapus
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PollList;