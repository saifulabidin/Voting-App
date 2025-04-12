import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import PollChart from './PollChart';
import { useLanguage } from '../context/LanguageContext';

const PollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteStatus, setVoteStatus] = useState({
    message: '',
    type: ''
  });
  const [newOption, setNewOption] = useState('');
  const [showAddOption, setShowAddOption] = useState(false);
  const { t, language, toggleLanguage } = useLanguage();

  const isAuthenticated = !!localStorage.getItem('token');
  const currentUserId = localStorage.getItem('userId');

  const fetchPoll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await API.get(`/polls/${id}`);
      setPoll(data);
    } catch (err) {
      console.error('Error fetching poll:', err);
      const message = err.response?.data?.message || 'Error loading poll';
      setError(message);
      if (err.response?.status === 404) {
        setTimeout(() => navigate('/polls'), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchPoll();
  }, [fetchPoll]);

  const handleVote = async (optionId) => {
    try {
      setError(null);
      if (!isAuthenticated) {
        sessionStorage.setItem('pendingVote', JSON.stringify({
          pollId: id,
          optionId: optionId
        }));
        navigate('/login');
        return;
      }

      const { data } = await API.post(`/polls/${id}/vote`, { optionId });
      setPoll(data);
      setVoteStatus({
        message: t('voteSuccess'),
        type: 'success'
      });
    } catch (err) {
      console.error('Voting error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else if (err.response?.status === 400) {
        setVoteStatus({
          message: t('oneVoteError'),
          type: 'error'
        });
      } else {
        setVoteStatus({
          message: t('voteError'),
          type: 'error'
        });
      }
    }
  };

  const handleRemoveVote = async (optionId) => {
    try {
      setError(null);
      const { data } = await API.delete(`/polls/${id}/vote`, { 
        data: { optionId } 
      });
      setPoll(data);
      setVoteStatus({
        message: t('voteRemoved'),
        type: 'success'
      });
    } catch (err) {
      console.error('Remove vote error:', err);
      if (err.response?.status === 401) {
        navigate('/login');
      } else {
        setVoteStatus({
          message: t('voteRemoveError'),
          type: 'error'
        });
      }
    }
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOption.trim()) return;
    const { data } = await API.post(`/polls/${id}/options`, {
      option: newOption.trim()
    });
    setPoll(data);
    setNewOption('');
    setShowAddOption(false);
  };

  const handleDelete = async () => {
    if (window.confirm(t('deleteConfirm'))) {
      await API.delete(`/polls/${id}`);
      navigate('/polls');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: poll.title,
        text: t('shareText'),
        url: url
      })
    } else {
      navigator.clipboard.writeText(url)
    }
  };

  if (loading) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>{t('loading')}</p>
    </div>
  );
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!poll) return null;

  return (
    <div className="poll-details">
      <div className="poll-header">
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1rem' }}>
          <button 
            onClick={toggleLanguage}
            className="language-button"
          >
            {language === 'en' ? 'ID' : 'EN'}
          </button>
        </div>
        <h1>{poll.title}</h1>
        <p>{t('createdBy')} {poll.createdBy?.username || t('unknown')}</p>
        
        <div className="poll-actions">
          <button onClick={handleShare} className="share-button">
            {t('shareButton')}
          </button>
          
          {isAuthenticated && poll.createdBy?._id === currentUserId && (
            <button 
              onClick={handleDelete}
              className="delete-button"
            >
              {t('deleteButton')}
            </button>
          )}
        </div>
      </div>

      {voteStatus.message && (
        <div className={`status-message ${voteStatus.type}`}>
          {voteStatus.message}
        </div>
      )}

      <div className="poll-content">
        <div className="options-list">
          {poll.options.map((option) => (
            <div key={option._id} className="poll-option">
              <span>{option.option} - {option.votes} votes</span>
              {isAuthenticated && poll.voters.includes(currentUserId) ? (
                <button 
                  onClick={() => handleRemoveVote(option._id)}
                  className="vote-button remove"
                >
                  {t('removeVote')}
                </button>
              ) : (
                <button 
                  onClick={() => handleVote(option._id)}
                  disabled={isAuthenticated && poll.voters.includes(currentUserId)}
                  className="vote-button"
                >
                  {t('voteButton')}
                </button>
              )}
            </div>
          ))}
        </div>

        <div className="poll-chart">
          <PollChart poll={poll} />
        </div>

        {isAuthenticated && !poll.voters.includes(currentUserId) && (
          <div className="add-option-section">
            {!showAddOption ? (
              <button 
                onClick={() => setShowAddOption(true)}
                className="add-option-button"
              >
                {t('addOption')}
              </button>
            ) : (
              <form onSubmit={handleAddOption} className="add-option-form">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder={t('enterOption')}
                  required
                />
                <button type="submit">{t('submit')}</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddOption(false)}
                >
                  {t('cancel')}
                </button>
              </form>
            )}
          </div>
        )}

        {!isAuthenticated && (
          <div className="login-prompt">
            <p>{t('loginPrompt')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollDetails;