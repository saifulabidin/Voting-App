export const checkVoteStatus = (poll, userId) => {
  if (!poll || !userId) return false;
  return poll.voters.some(voter => 
    typeof voter === 'string' ? voter === userId : voter._id === userId
  );
};

export const formatVoteCount = (count) => {
  return `${count} ${count === 1 ? 'vote' : 'votes'}`;
};

export const formatUsername = (username) => {
  if (!username) return '';
  // Jika username mengandung @gmail.com, hilangkan bagian tersebut
  if (username.endsWith('@gmail.com')) {
    return username.split('@')[0];
  }
  return username;
};