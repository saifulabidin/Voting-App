const express = require('express');
const Poll = require('../models/Poll');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const { validate } = require('../middleware/validate');
const router = express.Router();

// Middleware to authenticate user
const protect = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'No auth token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth error:', err);
    return res.status(401).json({ 
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Create Poll route with updated error handling
router.post('/', protect, validate('createPoll'), async (req, res, next) => {
  try {
    const { title, options } = req.body;

    const validOptions = options
      .filter(opt => opt && opt.option?.trim())
      .map(opt => ({
        option: opt.option.trim(),
        votes: 0
      }));

    const poll = new Poll({
      title: title.trim(),
      options: validOptions,
      createdBy: req.user._id // This should now be available
    });

    const createdPoll = await poll.save();
    await createdPoll.populate('createdBy', 'username');
    
    res.status(201).json(createdPoll);
  } catch (err) {
    next(err);
  }
});

// Get all Polls (Authenticated/Unauthenticated)
router.get('/', async (req, res) => {
  try {
    const polls = await Poll.find().populate('createdBy', 'username');
    res.json(polls);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch polls' });
  }
});

// Get Poll by ID
router.get('/:id', async (req, res) => {
  try {
    const poll = await Poll.findById(req.params.id)
      .populate('createdBy', 'username')
      .populate('voters', 'username');
      
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }
    
    res.json(poll);
  } catch (err) {
    console.error('Error fetching poll:', err);
    // Check if error is due to invalid ObjectId
    if (err.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid poll ID' });
    }
    res.status(500).json({ 
      message: 'Error fetching poll',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

// Update vote endpoint with transaction
router.post('/:pollId/vote', protect, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { pollId } = req.params;
    const { optionId } = req.body;

    // Check if user has already voted
    const existingPoll = await Poll.findOne({
      _id: pollId,
      voters: req.user._id
    });

    if (existingPoll) {
      return res.status(400).json({ 
        message: 'You have already voted on this poll' 
      });
    }

    const poll = await Poll.findById(pollId).session(session);
    
    if (!poll) {
      return res.status(404).json({ message: 'Poll not found' });
    }

    const option = poll.options.id(optionId);
    if (!option) {
      return res.status(400).json({ message: 'Invalid option selected' });
    }

    option.votes += 1;
    poll.voters.push(req.user._id);
        
    await poll.save({ session });
    await session.commitTransaction();
    
    // Return updated poll with user info
    const updatedPoll = await Poll.findById(pollId)
      .populate('createdBy', 'username')
      .populate('voters', 'username');
      
    res.json(updatedPoll);
  } catch (err) {
    await session.abortTransaction();
    console.error('Voting error:', err);
    res.status(400).json({ 
      message: err.message || 'Error submitting vote'
    });
  } finally {
    session.endSession();
  }
});

// Delete Poll (Authenticated)
router.delete('/:pollId', protect, async (req, res) => {
  const { pollId } = req.params;
  try {
    const poll = await Poll.findById(pollId);
    if (!poll || poll.createdBy.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized or poll not found' });
    }

    await Poll.findByIdAndDelete(pollId);
    res.json({ message: 'Poll deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Failed to delete poll' });
  }
});

module.exports = router;
