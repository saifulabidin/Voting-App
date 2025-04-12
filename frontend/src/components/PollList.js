import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import API from '../api';
import { useLanguage } from '../context/LanguageContext';

const PollList = () => {
  const [polls, setPolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const { t } = useLanguage();

  const user = JSON.parse(localStorage.getItem('user'));

  const fetchPolls = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(`/polls?page=${currentPage}&search=${searchTerm}`);
      if (data && Array.isArray(data.polls)) {
        setPolls(data.polls);
        setTotalPages(data.totalPages || 1);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError(t('loadError') || 'Error loading polls');
      setPolls([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, t]);

  useEffect(() => {
    fetchPolls();
  }, [fetchPolls]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPolls(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handleDelete = async (pollId, event) => {
    event.preventDefault(); // Prevent navigation
    
    if (!window.confirm(t('deleteConfirm'))) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError(t('loginRequired'));
        return;
      }
      
      await API.delete(`/polls/${pollId}`);
      setPolls(polls.filter(poll => poll._id !== pollId));
      setError(null); // Clear any existing errors on success
    } catch (err) {
      console.error('Delete error:', err);
      if (err.response?.status === 401) {
        setError(t('loginRequired'));
      } else if (err.response?.status === 403) {
        setError(t('notAuthorized'));
      } else {
        setError(t('deleteError'));
      }
    }
  };

  if (loading) return <div className="loading">{t('loading')}</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="poll-list">
      <h1>{t('pollList')}</h1>
      
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
        <>
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
                {poll.createdBy?._id === user?.id && (
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
          
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="pagination-button"
              >
                {t('previous')}
              </button>
              <span className="page-info">
                {t('page')} {currentPage} {t('of')} {totalPages}
              </span>
              <button 
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="pagination-button"
              >
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PollList;