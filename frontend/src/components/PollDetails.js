import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';
import PollChart from './PollChart';

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

  useEffect(() => {
    fetchPoll();
  }, [id, navigate]);

  const fetchPoll = async () => {
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
  };

  const handleVote = async (optionId) => {
    try {
      setError(null);
      const { data } = await API.post(`/polls/${id}/vote`, { optionId });
      setPoll(data);
      setVoteStatus({
        message: 'Vote berhasil dikirim!',
        type: 'success'
      });
    } catch (err) {
      console.error('Voting error:', err);
      if (err.response?.status === 400) {
        setVoteStatus({
          message: 'Anda hanya dapat memberikan satu suara untuk setiap polling',
          type: 'error'
        });
      } else {
        setVoteStatus({
          message: 'Gagal mengirim vote. Silakan coba lagi.',
          type: 'error'
        });
      }
    }
  };

  const handleAddOption = async (e) => {
    e.preventDefault();
    if (!newOption.trim()) {
      setError('Option cannot be empty');
      return;
    }

    try {
      const { data } = await API.post(`/polls/${id}/options`, {
        option: newOption.trim()
      });
      setPoll(data);
      setNewOption('');
      setShowAddOption(false);
      setVoteStatus({
        message: 'New option added successfully!',
        type: 'success'
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add new option');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this poll?')) {
      return;
    }

    try {
      await API.delete(`/polls/${id}`);
      navigate('/polls');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Failed to delete poll');
    }
  };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: poll.title,
        text: 'Check out this poll!',
        url: url
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setVoteStatus({
          message: 'Poll link copied to clipboard!',
          type: 'success'
        });
      }).catch(() => {
        setVoteStatus({
          message: 'Failed to copy link',
          type: 'error'
        });
      });
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!poll) return null;

  return (
    <div className="poll-details">
      <div className="poll-header">
        <h1>{poll.title}</h1>
        <p>Created by: {poll.createdBy?.username || 'Unknown'}</p>
        
        <div className="poll-actions">
          <button onClick={handleShare} className="share-button">
            Share Poll
          </button>
          
          {poll.createdBy?._id === localStorage.getItem('userId') && (
            <button 
              onClick={handleDelete}
              className="delete-button"
            >
              Delete Poll
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
              <button 
                onClick={() => handleVote(option._id)}
                disabled={poll.voters.includes(localStorage.getItem('userId'))}
                className="vote-button"
              >
                {poll.voters.includes(localStorage.getItem('userId')) ? 'Voted' : 'Vote'}
              </button>
            </div>
          ))}
        </div>

        <div className="poll-chart">
          <PollChart poll={poll} />
        </div>

        {!poll.voters.includes(localStorage.getItem('userId')) && (
          <div className="add-option-section">
            {!showAddOption ? (
              <button 
                onClick={() => setShowAddOption(true)}
                className="add-option-button"
              >
                Add New Option
              </button>
            ) : (
              <form onSubmit={handleAddOption} className="add-option-form">
                <input
                  type="text"
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Enter new option"
                  required
                />
                <button type="submit">Add Option</button>
                <button 
                  type="button" 
                  onClick={() => setShowAddOption(false)}
                >
                  Cancel
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PollDetails;