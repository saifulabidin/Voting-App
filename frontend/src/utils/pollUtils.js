export const checkVoteStatus = (poll, userId) => {
  if (!poll || !userId) return false;
  return poll.voters.some(voter => 
    typeof voter === 'string' ? voter === userId : voter._id === userId
  );
};

export const formatVoteCount = (count) => {
  return `${count} ${count === 1 ? 'vote' : 'votes'}`;
};