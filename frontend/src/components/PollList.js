import React, { useEffect, useState } from 'react';
import API from '../api';
import { Link } from 'react-router-dom';

const PollList = () => {
  const [polls, setPolls] = useState([]);

  useEffect(() => {
    const fetchPolls = async () => {
      try {
        const { data } = await API.get('/polls');
        setPolls(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchPolls();
  }, []);

  return (
    <div>
      <h1>Polls</h1>
      <ul>
        {polls.map((poll) => (
          <li key={poll._id}>
            <Link to={`/polls/${poll._id}`}>{poll.title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default PollList;