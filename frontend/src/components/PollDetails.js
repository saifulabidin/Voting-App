import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import API from '../api';

const PollDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [poll, setPoll] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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
      const { data } = await API.post(`/polls/${id}/vote`, { optionId });
      setPoll(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!poll) return null;

  return (
    <div>
      <h1>{poll.title}</h1>
      <p>Created by: {poll.createdBy?.username || 'Unknown'}</p>
      <ul>
        {poll.options.map((option) => (
          <li key={option._id}>
            {option.option} - {option.votes} votes
            <button onClick={() => handleVote(option._id)}>Vote</button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PollDetails;