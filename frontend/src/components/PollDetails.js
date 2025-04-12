import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

const PollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteStatus, setVoteStatus] = useState({
    message: '',
    type: '' // 'success' or 'error'
  });

  useEffect(() => {
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
    fetchPoll();
  }, [id, navigate]);

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
      // Handle duplicate vote error
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

  const handleDelete = async () => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus polling ini?')) {
      return;
    }

    try {
      await API.delete(`/polls/${id}`);
      navigate('/polls');
    } catch (err) {
      console.error('Delete error:', err);
      setError(err.response?.data?.message || 'Gagal menghapus polling');
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!poll) return null;

  return (
    <div>
      <h1>{poll.title}</h1>
      <p>Created by: {poll.createdBy?.username || 'Unknown'}</p>
      
      {/* Add delete button if user is the creator */}
      {poll.createdBy?._id === localStorage.getItem('userId') && (
        <button 
          onClick={handleDelete}
          style={{
            backgroundColor: '#ff4444',
            color: 'white',
            padding: '8px 16px',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '20px'
          }}
        >
          Hapus Polling
        </button>
      )}

      {/* Status Message */}
      {voteStatus.message && (
        <div style={{ 
          padding: '10px',
          borderRadius: '4px',
          backgroundColor: voteStatus.type === 'success' ? '#e6ffe6' : '#ffe6e6',
          color: voteStatus.type === 'success' ? '#006600' : '#cc0000',
          border: `1px solid ${voteStatus.type === 'success' ? '#b3ffb3' : '#ffb3b3'}`
        }}>
          {voteStatus.message}
        </div>
      )}

      {/* Poll Options */}
      <ul>
        {poll.options.map((option) => (
          <li key={option._id}>
            {option.option} - {option.votes} votes
            <button 
              onClick={() => handleVote(option._id)}
              disabled={poll.voters.includes(localStorage.getItem('userId'))}
              style={{
                marginLeft: '10px',
                opacity: poll.voters.includes(localStorage.getItem('userId')) ? 0.5 : 1
              }}
            >
              {poll.voters.includes(localStorage.getItem('userId')) ? 'Sudah Vote' : 'Vote'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PollDetails;