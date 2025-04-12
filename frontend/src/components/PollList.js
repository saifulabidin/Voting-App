import React, { useEffect, useState } from 'react';
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

  const fetchPolls = async (page = 1, search = searchTerm) => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(`/polls?page=${page}&limit=10&search=${search}`);
      setPolls(data.polls);
      setCurrentPage(data.currentPage);
      setTotalPages(data.totalPages);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError(err.response?.data?.message || 'Error loading polls');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPolls(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      fetchPolls(newPage);
    }
  };

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