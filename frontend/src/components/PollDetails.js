import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import API from '../api';

const PollDetails = () => {
  const { id } = useParams();
  const [poll, setPoll] = useState(null);

  useEffect(() => {
    const fetchPoll = async () => {
      try {
        const { data } = await API.get(`/polls/${id}`);
        setPoll(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPoll();
  }, [id]);

  const handleVote = async (optionId) => {
    try {
      const { data } = await API.post(`/polls/${id}/vote`, { optionId });
      setPoll(data);
    } catch (err) {
      console.error(err);
    }
  };

  if (!poll) return <p>Loading...</p>;

  return (
    <div>
      <h1>{poll.title}</h1>
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