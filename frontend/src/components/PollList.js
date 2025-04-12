import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';
import './PollList.css';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(`/polls?search=${searchTerm}`);
      setPolls(data.polls);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError(t('loadError'));
    } finally {
      setLoading(false);
    }
  }, [searchTerm, t]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPolls();
  };

  if (loading) return <div className="loading">{t('loading')}</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="poll-list-container">
      <h1 className="page-title">{t('pollList')}</h1>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={t('searchPlaceholder')}
          className="search-input"
        />
        <button type="submit" className="search-button">
          {t('search')}
        </button>
      </form>
      {polls.length === 0 ? (
        <p className="no-results">{t('noPolls')}</p>
      ) : (
        <ul className="poll-list">
          {polls.map((poll) => (
            <li key={poll._id} className="poll-item">
              <Link to={`/polls/${poll._id}`} className="poll-link">
                {poll.title}
              </Link>
              <span className="poll-creator">
                {t('createdBy')} {poll.createdBy?.username || t('unknown')}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PollList;