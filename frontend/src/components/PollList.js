import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const fetchPolls = async () => {
    try {
      const { data } = await API.get('/polls');
      setPolls(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load polls');
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleDelete = async (pollId, event) => {
    event.preventDefault(); // Prevent navigation
    
    if (!window.confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      await API.delete(`/polls/${pollId}`);
      setPolls(polls.filter(poll => poll._id !== pollId));
    } catch (err) {
      console.error('Delete error:', err);
      setError(t('voteError'));
    }
  };

  return (
    <div>
      <h1>{t('pollList')}</h1>
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
            <div>
              <span style={{ marginRight: '1rem' }}>
                {t('createdBy')} {poll.createdBy?.username || t('unknown')}
              </span>
              {poll.createdBy?._id === localStorage.getItem('userId') && (
                <button
                  onClick={(e) => handleDelete(poll._id, e)}
                  className="delete-button"
                >
                  {t('deleteButton')}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PollList;