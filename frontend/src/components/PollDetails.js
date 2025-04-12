import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

const PollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [voteError, setVoteError] = useState(null);
  const [hasVoted, setHasVoted] = useState(false);

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
      setVoteError(null);
      const { data } = await API.post(`/polls/${id}/vote`, { optionId });
      setPoll(data);
      setHasVoted(true);
    } catch (err) {
      console.error('Voting error:', err);
      const message = err.response?.data?.message || 'Error submitting vote';
      setVoteError(message);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        navigate('/login');
      }
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!poll) return null;

  return (
    <div>
      <h1>{poll.title}</h1>
      <p>Created by: {poll.createdBy?.username || 'Unknown'}</p>
      {voteError && <p style={{ color: 'red' }}>{voteError}</p>}
      <ul>
        {poll.options.map((option) => (
          <li key={option._id}>
            {option.option} - {option.votes} votes
            <button 
              onClick={() => handleVote(option._id)}
              disabled={hasVoted || poll.voters.includes(localStorage.getItem('userId'))}
            >
              {hasVoted ? 'Voted' : 'Vote'}
            </button>
          </li>
        ))}
      </ul>
      {hasVoted && (
        <p style={{ color: 'green' }}>Thank you for voting!</p>
      )}
    </div>
  );
};

export default PollDetails;