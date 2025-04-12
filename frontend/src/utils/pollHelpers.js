export const hasUserVoted = (poll, userId) => {
  if (!poll || !userId) return false;
  return poll.voters.some(voter => 
    typeof voter === 'string' 
      ? voter === userId 
      : voter._id === userId
  );
};

export const getVoteCount = (poll) => {
  if (!poll?.options) return 0;
  return poll.options.reduce((sum, opt) => sum + (opt.votes || 0), 0);
};